import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Lock,
  LockOpen,
  MoreHorizontal,
  ShieldCheck,
  Star,
  XCircle,
  Send,
  Trash2,
} from 'lucide-react';
import { addDays, diffDays, formatVN, formatVNShort } from '../domain/dates';
import { daysLate, isLocked, taskState, waitingDays } from '../domain/status';
import { TASK_STATUS_LABEL } from '../domain/types';
import type { Task, TaskStatus } from '../domain/types';
import { useStore } from '../store/useStore';
import { Badge, Field, Modal } from './ui';

// ---------------------------------------------------------------------------
// Hook: gom thao tác trên đầu việc + các hộp thoại (dời hạn, mở khóa)
// ---------------------------------------------------------------------------
export function useTaskActions() {
  const tasks = useStore((s) => s.tasks);
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);
  const [unlocking, setUnlocking] = useState<{ task: Task; thenComplete: boolean } | null>(null);
  const [rescheduling, setRescheduling] = useState<Task | null>(null);

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const complete = (task: Task) => {
    const st = useStore.getState();
    if (task.isGate) {
      if (window.confirm('Hậu Kiểm (Audit) đã đánh giá ĐẠT cho cổng kiểm soát này?')) st.gateResult(task.id, true);
      return;
    }
    if (isLocked(task, byId)) {
      setUnlocking({ task, thenComplete: true });
      return;
    }
    if (task.feature === 'testCounter') {
      const c = customers.find((x) => x.id === task.customerId);
      const n = c?.testReport.simulatedConversations ?? 0;
      if (n < settings.minTestConversations) {
        const ok = window.confirm(
          `Mới ghi nhận ${n} hội thoại đã test (yêu cầu tối thiểu ${settings.minTestConversations}). Vẫn đánh dấu xong?`,
        );
        if (!ok) return;
      }
    }
    st.completeTask(task.id);
  };

  const changeStatus = (task: Task, status: TaskStatus) => {
    const st = useStore.getState();
    if (status === 'done') return complete(task);
    st.setTaskStatus(task.id, status);
  };

  const modals = (
    <>
      {unlocking && (
        <ReasonModal
          title="Việc đang bị khóa bởi cổng kiểm soát"
          description={`"${unlocking.task.title}" chỉ nên làm sau khi Hậu Kiểm đánh giá ĐẠT. Nếu vẫn muốn tiếp tục (override), hãy ghi lý do.`}
          confirmLabel={unlocking.thenComplete ? 'Override & đánh dấu xong' : 'Mở khóa'}
          onClose={() => setUnlocking(null)}
          onConfirm={(reason) => {
            const st = useStore.getState();
            if (unlocking.thenComplete) st.completeTask(unlocking.task.id, reason);
            else st.unlockTask(unlocking.task.id, reason);
            setUnlocking(null);
          }}
        />
      )}
      {rescheduling && <RescheduleModal task={rescheduling} onClose={() => setRescheduling(null)} />}
    </>
  );

  return {
    byId,
    complete,
    changeStatus,
    reschedule: (t: Task) => setRescheduling(t),
    unlock: (t: Task) => setUnlocking({ task: t, thenComplete: false }),
    modals,
  };
}

export function ReasonModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      {description && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>}
      <Field label="Lý do (bắt buộc)">
        <textarea className="input" rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button className="btn-primary" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function RescheduleModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [start, setStart] = useState(task.startDate);
  const [deadline, setDeadline] = useState(task.deadline);
  const [reason, setReason] = useState('');
  const invalid = !start || !deadline || deadline < start || !reason.trim();
  return (
    <Modal title="Dời ngày công việc" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{task.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày bắt đầu">
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Deadline">
          <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[1, 2, 3, 5].map((n) => (
          <button key={n} className="btn-secondary btn-sm" onClick={() => setDeadline(addDays(task.deadline, n))}>
            Dời hạn +{n} ngày
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Hiện tại: {formatVN(task.startDate)} → {formatVN(task.deadline)}
        {deadline !== task.deadline && ` | Mới: ${formatVN(start)} → ${formatVN(deadline)}`}
      </p>
      <div className="mt-3">
        <Field label="Lý do dời (bắt buộc, sẽ lưu vào lịch sử)">
          <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: Khách hẹn lại do bận kiểm kê" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button
          className="btn-primary"
          disabled={invalid}
          onClick={() => {
            useStore.getState().rescheduleTask(task.id, start, deadline, reason.trim());
            onClose();
          }}
        >
          Lưu thay đổi
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Hiển thị trạng thái hạn của việc
// ---------------------------------------------------------------------------
export function TaskDueBadge({ task, today, dueSoonDays }: { task: Task; today: string; dueSoonDays: number }) {
  const st = taskState(task, today, dueSoonDays);
  switch (st) {
    case 'overdue':
      return <Badge tone="red">Trễ {daysLate(task, today)} ngày</Badge>;
    case 'due_today':
      return <Badge tone="yellow">Hạn hôm nay</Badge>;
    case 'due_soon':
      return <Badge tone="yellow">Còn {diffDays(task.deadline, today)} ngày</Badge>;
    case 'waiting_customer':
      return <Badge tone="gray">Chờ khách · {waitingDays(task, today)} ngày</Badge>;
    case 'waiting_audit':
      return <Badge tone="blue">Chờ Hậu Kiểm · {waitingDays(task, today)} ngày</Badge>;
    case 'done':
      return <Badge tone="green">Xong {task.doneAt ? formatVNShort(task.doneAt) : ''}</Badge>;
    default:
      return null;
  }
}

const BORDER: Record<string, string> = {
  overdue: 'border-l-red-500',
  due_today: 'border-l-amber-400',
  due_soon: 'border-l-amber-300',
  waiting_customer: 'border-l-slate-400',
  waiting_audit: 'border-l-sky-500',
  done: 'border-l-emerald-500',
  normal: 'border-l-transparent',
};

// ---------------------------------------------------------------------------
// Một dòng đầu việc (gọn): ô tick · tên việc · hạn · menu "⋯"
// ---------------------------------------------------------------------------
export function TaskRow({
  task,
  actions,
  today,
  dueSoonDays,
  customerName,
  allowDelete,
  testCount,
}: {
  task: Task;
  actions: ReturnType<typeof useTaskActions>;
  today: string;
  dueSoonDays: number;
  customerName?: string;
  allowDelete?: boolean;
  testCount?: number;
}) {
  const st = taskState(task, today, dueSoonDays);
  const locked = isLocked(task, actions.byId);
  const done = task.status === 'done';
  const store = useStore.getState();
  const gate = task.isGate;
  const [menu, setMenu] = useState(false);
  const closeAnd = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <div
      className={`rounded-lg border border-l-4 px-3 py-2 ${BORDER[st]} ${
        gate
          ? 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      } ${done ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          className={`mt-0.5 shrink-0 ${done ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
          title={done ? 'Bấm để mở lại việc này' : gate ? 'Hậu Kiểm đã duyệt: Đạt' : 'Bấm để đánh dấu xong'}
          onClick={() => (done ? store.reopenTask(task.id) : actions.complete(task))}
        >
          {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          {customerName && <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{customerName}</div>}
          <div className={`text-sm ${done ? 'text-slate-500 line-through' : ''}`}>
            {task.isRequired && !done && <Star size={11} className="mr-1 inline text-orange-500" aria-label="Bắt buộc" />}
            {task.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TaskDueBadge task={task} today={today} dueSoonDays={dueSoonDays} />
            {!done && st !== 'overdue' && st !== 'due_today' && (
              <span className="text-[11px] text-slate-500">Hạn {formatVNShort(task.deadline)}</span>
            )}
            {task.status === 'doing' && <Badge tone="blue">Đang làm</Badge>}
            {gate && (
              <Badge tone="purple">
                <ShieldCheck size={11} /> Cổng Hậu Kiểm
              </Badge>
            )}
            {task.meetingNo && <Badge tone="blue">Meeting {task.meetingNo}</Badge>}
            {locked && (
              <Badge tone="red">
                <Lock size={10} /> Đang khóa
              </Badge>
            )}
            {task.feature === 'testCounter' && testCount !== undefined && <Badge tone="slate">Đã test: {testCount}</Badge>}
            {(st === 'waiting_customer' || st === 'waiting_audit') && daysLate(task, today) > 0 && (
              <span className="text-[11px] text-slate-400">· quá hạn nhưng đang chờ</span>
            )}
          </div>
          {task.note && <div className="mt-1 text-xs italic text-slate-500">{task.note}</div>}
        </div>

        <div className="relative shrink-0">
          <button className="btn-ghost btn-sm" onClick={() => setMenu(!menu)} aria-label="Thêm thao tác" title="Thêm thao tác">
            <MoreHorizontal size={18} />
          </button>
          {menu && (
            <>
              <button className="fixed inset-0 z-30 cursor-default" aria-label="Đóng menu" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {!done && !gate && (
                  <>
                    <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase text-slate-400">Đổi trạng thái</div>
                    {(['todo', 'doing', 'waiting_customer', 'waiting_audit'] as TaskStatus[]).map((s) => (
                      <button
                        key={s}
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          task.status === s ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''
                        }`}
                        onClick={closeAnd(() => actions.changeStatus(task, s))}
                      >
                        {TASK_STATUS_LABEL[s]}
                        {task.status === s && <Check size={13} />}
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  </>
                )}
                {!done && (
                  <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700" onClick={closeAnd(() => actions.reschedule(task))}>
                    <CalendarClock size={14} /> Dời ngày (khách hẹn lại)
                  </button>
                )}
                {done && (
                  <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700" onClick={closeAnd(() => store.reopenTask(task.id))}>
                    Mở lại việc này
                  </button>
                )}
                {allowDelete && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={closeAnd(() => window.confirm('Xóa đầu việc này?') && store.deleteTask(task.id))}
                  >
                    <Trash2 size={14} /> Xóa việc
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {gate && !done && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-violet-200 pt-2 dark:border-violet-900">
          <span className="text-xs text-violet-700 dark:text-violet-300">
            <AlertTriangle size={12} className="mr-1 inline" />
            Hậu Kiểm đạt thì các việc phía sau mới mở khóa.
          </span>
          <div className="ml-auto flex gap-1.5">
            {task.status !== 'waiting_audit' && (
              <button className="btn-secondary btn-sm" onClick={() => store.sendGateToAudit(task.id)}>
                <Send size={12} /> Đã gửi Hậu Kiểm
              </button>
            )}
            <button className="btn-primary btn-sm !bg-emerald-600 hover:!bg-emerald-700" onClick={() => store.gateResult(task.id, true)}>
              <Check size={12} /> Đạt
            </button>
            <button className="btn-danger btn-sm" onClick={() => store.gateResult(task.id, false)}>
              <XCircle size={12} /> Không đạt
            </button>
          </div>
        </div>
      )}

      {locked && !done && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-red-200 pt-2 text-xs dark:border-red-900">
          <span className="text-red-600 dark:text-red-400">Chờ cổng Hậu Kiểm phía trước đạt mới nên làm việc này.</span>
          <button className="btn-secondary btn-sm" onClick={() => actions.unlock(task)}>
            <LockOpen size={12} /> Vẫn làm (ghi lý do)
          </button>
        </div>
      )}
    </div>
  );
}
