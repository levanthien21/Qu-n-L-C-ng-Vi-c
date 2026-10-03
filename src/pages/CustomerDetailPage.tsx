import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { addDays, diffDays, formatVN } from '../domain/dates';
import {
  contactThreshold,
  customerStatus,
  customerTasks,
  customerWaitingDays,
  daysSinceContact,
  phaseInfos,
  progress,
} from '../domain/status';
import type { PhaseInfo } from '../domain/status';
import type { ManualStatus } from '../domain/types';
import { useStore } from '../store/useStore';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { TaskRow, useTaskActions } from '../components/TaskRow';
import { Badge, CustomerStatusBadge, EmptyState, Field, Modal, ProgressBar } from '../components/ui';
import {
  AIErrorPanel,
  CareLogPanel,
  PlaybookPanel,
  ProgressReportModal,
  RescheduleHistoryPanel,
  TestReportPanel,
} from './customer/CustomerPanels';

function InfoItem({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      {value ? (
        link ? (
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            <span className="truncate">{value}</span> <ExternalLink size={12} className="shrink-0" />
          </a>
        ) : (
          <div className="truncate text-sm">{value}</div>
        )
      ) : (
        <div className="text-sm text-slate-400">—</div>
      )}
    </div>
  );
}

function PhaseChip({ info }: { info: PhaseInfo }) {
  const { state, hasOverdue, hasWaiting, phase, done, total } = info;
  let cls = 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900';
  let icon = <Circle size={13} />;
  if (state === 'done') {
    cls = 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300';
    icon = <CheckCircle2 size={13} />;
  } else if (hasOverdue) {
    cls = 'border-red-400 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300';
    icon = <AlertTriangle size={13} />;
  } else if (state === 'current') {
    cls = 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    icon = <ChevronRight size={13} />;
  }
  return (
    <div className={`min-w-[96px] rounded-lg border px-2.5 py-1.5 text-xs ${cls}`} title={phase.name}>
      <div className="flex items-center gap-1 font-bold">
        {icon} {phase.code}
      </div>
      <div className="mt-0.5 text-[10px] opacity-80">{phase.tag}</div>
      <div className="text-[10px]">
        {done}/{total}
        {hasWaiting && state !== 'done' ? ' · chờ' : ''}
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = useStore((s) => s.customers.find((c) => c.id === id));
  const allTasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  const store = useStore.getState();
  const actions = useTaskActions();

  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [showDoneRecurring, setShowDoneRecurring] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const mine = useMemo(() => (customer ? customerTasks(customer, allTasks) : []), [customer, allTasks]);
  const infos = useMemo(() => (customer ? phaseInfos(customer, allTasks, today) : []), [customer, allTasks, today]);

  if (!customer) {
    return (
      <EmptyState>
        Không tìm thấy khách này. <Link className="text-indigo-600 underline" to="/khach-hang">Về danh sách khách</Link>
      </EmptyState>
    );
  }

  const status = customerStatus(customer, allTasks, today);
  const prog = progress(customer, allTasks);
  const current = infos.find((i) => i.state === 'current');
  const elapsed = Math.max(0, diffDays(today, customer.startDate));
  const toEnd = diffDays(customer.endDate, today);
  const since = daysSinceContact(customer, today);
  const waitDays = customerWaitingDays(customer, allTasks, today);

  const setStatus = (v: string) => {
    if (v === 'auto') return store.setManualStatus(customer.id, null);
    const label = { paused: 'Tạm dừng', ticket_closed: 'Tạm đóng ticket', completed: 'Hoàn thành' }[v as ManualStatus];
    if (v === 'ticket_closed' && !window.confirm('Bạn đã báo sale và nhắn lên nhóm chưa? Chuyển sang "Tạm đóng ticket"?')) return;
    const note = v === 'ticket_closed' || v === 'paused' ? (window.prompt(`Ghi chú lý do ${label} (có thể bỏ trống):`) ?? '') : '';
    store.setManualStatus(customer.id, v as ManualStatus, note);
  };

  const isOpen = (code: string) => openMap[code] ?? code === current?.phase.code;
  const toggle = (code: string) => setOpenMap({ ...openMap, [code]: !isOpen(code) });

  const meetings = ([1, 2, 3] as const).map((no) => ({ no, task: mine.find((t) => t.meetingNo === no) }));

  return (
    <div className="space-y-4">
      <Link to="/khach-hang" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Danh sách khách
      </Link>

      {/* Tiêu đề */}
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{customer.name}</h1>
              <CustomerStatusBadge status={status} />
              <Badge tone="slate">Gói {customer.durationDays} ngày</Badge>
              {customer.paymentStatus === 'partial' && <Badge tone="orange">Chưa thanh toán đủ</Badge>}
              {customer.isDemo && <Badge tone="slate">Dữ liệu mẫu</Badge>}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {current ? (
                <>
                  Giai đoạn hiện tại: <b className="text-slate-700 dark:text-slate-200">{current.phase.code} – {current.phase.name}</b> <Badge tone="purple">{current.phase.tag}</Badge>
                </>
              ) : (
                'Đã hoàn thành mọi giai đoạn'
              )}
            </div>
            {customer.manualStatusNote && <div className="mt-1 text-xs italic text-slate-500">Ghi chú trạng thái: {customer.manualStatusNote}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={() => setReportOpen(true)}>
              <FileText size={15} /> Xuất báo cáo tiến độ
            </button>
            <select
              className="input !w-auto"
              value={customer.manualStatus ?? 'auto'}
              onChange={(e) => setStatus(e.target.value)}
              title="Chuyển trạng thái khách"
            >
              <option value="auto">Tự động (Đang triển khai / Chậm tiến độ)</option>
              <option value="paused">Tạm dừng</option>
              <option value="ticket_closed">Tạm đóng ticket</option>
              <option value="completed">Hoàn thành</option>
            </select>
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Sửa
            </button>
            <button className="btn-secondary" onClick={() => setRescheduleStart(true)}>
              <CalendarClock size={14} /> Dời ngày bắt đầu
            </button>
            <button
              className="btn-ghost text-red-500"
              onClick={() => {
                if (window.confirm(`Xóa khách "${customer.name}" cùng toàn bộ đầu việc? Không thể hoàn tác.`)) {
                  store.deleteCustomer(customer.id);
                  navigate('/khach-hang');
                }
              }}
              title="Xóa khách"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Cảnh báo */}
      <div className="space-y-2">
        {since >= contactThreshold(customer, settings) && status !== 'completed' && !customer.manualStatus && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            ⏰ Đã <b>{since} ngày</b> chưa liên hệ khách. Hãy hỏi thăm khách và ghi vào Nhật ký chăm sóc.
          </div>
        )}
        {waitDays >= settings.waitingWarnDays && !customer.manualStatus && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
              waitDays >= settings.waitingCloseDays
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
            }`}
          >
            <span>
              {waitDays >= settings.waitingCloseDays
                ? `🚨 Khách đã "Chờ khách" ${waitDays} ngày liên tục. Sau khi đã báo sale và nhắn lên nhóm, bạn có thể Tạm đóng ticket.`
                : `⚠ Khách đã "Chờ khách" ${waitDays} ngày (mốc đóng ticket: ${settings.waitingCloseDays} ngày).`}
            </span>
            {waitDays >= settings.waitingCloseDays && (
              <button className="btn-danger btn-sm" onClick={() => setStatus('ticket_closed')}>
                Tạm đóng ticket
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thông tin + tiến độ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card grid grid-cols-2 gap-3 p-4 lg:col-span-2">
          <InfoItem label="Ngành hàng" value={customer.industry} />
          <InfoItem label="Người liên hệ" value={customer.contactPerson} />
          <InfoItem label="SĐT / Zalo" value={customer.phone} />
          <InfoItem label="ID sale" value={customer.saleId} />
          <InfoItem label="ID QTV / tổ chức Retion" value={customer.retionId} />
          <InfoItem label="Thanh toán" value={customer.paymentStatus === 'full' ? 'Đủ' : 'Chưa đủ'} />
          <InfoItem label="Link nhóm chat" value={customer.chatLink} link />
          <InfoItem label='Link tổng hợp gói DVHL' value={customer.summaryLink} link />
          <InfoItem label='Link Google Sheet khách hàng' value={customer.sheetLink} link />
          {customer.notes && (
            <div className="col-span-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Ghi chú</div>
              <div className="whitespace-pre-wrap text-sm">{customer.notes}</div>
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">{prog.percent}%</div>
            <div className="text-xs text-slate-500">
              {prog.done}/{prog.total} việc
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar percent={prog.percent} tone={status === 'late' ? 'red' : status === 'completed' ? 'green' : 'indigo'} />
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Bắt đầu</dt><dd>{formatVN(customer.startDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Kết thúc dự kiến</dt><dd>{formatVN(customer.endDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Đã qua</dt><dd>{elapsed}/{customer.durationDays} ngày</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Còn lại</dt><dd className={toEnd < 0 ? 'text-red-600' : ''}>{toEnd >= 0 ? `${toEnd} ngày` : `quá ${-toEnd} ngày`}</dd></div>
          </dl>
        </div>
      </div>

      {/* Timeline giai đoạn */}
      <section className="card p-4">
        <h2 className="section-title">Timeline theo giai đoạn</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {infos.map((i) => (
            <PhaseChip key={i.phase.id} info={i} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Xong</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />Đang làm</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Có việc trễ</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-400" />Chưa tới</span>
        </div>
      </section>

      {/* Meeting */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="section-title !mb-0">Meeting & xác nhận của khách</h2>
          {customer.sheetLink && settings.googleScriptUrl && (
            <button 
              className="btn-secondary btn-sm" 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                try {
                  btn.innerHTML = 'Đang đồng bộ...';
                  btn.disabled = true;
                  
                  // Extract sheet ID from link
                  const match = customer.sheetLink!.match(/\/d\/([a-zA-Z0-9-_]+)/);
                  if (!match) throw new Error('Link Google Sheet không hợp lệ (không tìm thấy ID)');
                  
                  const res = await fetch(`${settings.googleScriptUrl}?id=${match[1]}`);
                  const data = await res.json();
                  if (!data.success) throw new Error(data.error);
                  
                  // Update confirmed meetings
                  if (data.data.meeting1 && !customer.meetingConfirmed['1']) store.toggleMeetingConfirmed(customer.id, 1);
                  if (data.data.meeting2 && !customer.meetingConfirmed['2']) store.toggleMeetingConfirmed(customer.id, 2);
                  if (data.data.meeting3 && !customer.meetingConfirmed['3']) store.toggleMeetingConfirmed(customer.id, 3);
                  
                  alert('Đồng bộ thành công!');
                } catch (err: any) {
                  alert('Lỗi đồng bộ: ' + err.message);
                } finally {
                  btn.innerHTML = originalText;
                  btn.disabled = false;
                }
              }}
            >
              🔄 Đồng bộ từ Google Sheet
            </button>
          )}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {meetings.map(({ no, task }) => (
            <div key={no} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Buổi {no}</div>
                {task && (task.status === 'done' ? <Badge tone="green">Đã họp {formatVN(task.doneAt)}</Badge> : <Badge tone={task.deadline < today ? 'red' : 'blue'}>Hẹn {formatVN(task.deadline)}</Badge>)}
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!customer.meetingConfirmed[String(no)]} onChange={() => store.toggleMeetingConfirmed(customer.id, no)} />
                Khách đã xác nhận vào file Lộ trình triển khai
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Đầu việc theo giai đoạn */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title !mb-0">Đầu việc</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input type="checkbox" checked={showDoneRecurring} onChange={(e) => setShowDoneRecurring(e.target.checked)} />
              Hiện việc lặp đã xong
            </label>
            <button className="btn-secondary btn-sm" onClick={() => setAddTaskOpen(true)}>
              <Plus size={13} /> Thêm việc
            </button>
          </div>
        </div>
        {infos.map((info) => {
          const code = info.phase.code;
          const list = mine
            .filter((t) => t.phaseCode === code)
            .filter((t) => showDoneRecurring || !(t.ruleId && t.status === 'done'))
            .sort((a, b) => a.order - b.order || a.startDate.localeCompare(b.startDate));
          const hiddenDone = mine.filter((t) => t.phaseCode === code && t.ruleId && t.status === 'done').length - list.filter((t) => t.ruleId && t.status === 'done').length;
          const open = isOpen(code);
          return (
            <div key={info.phase.id} className="card overflow-hidden">
              <button className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => toggle(code)}>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-semibold">{code} – {info.phase.name}</span>
                <Badge tone="purple">{info.phase.tag}</Badge>
                {info.phase.note && <span className="hidden text-xs text-slate-500 sm:inline">({info.phase.note})</span>}
                <span className="ml-auto flex items-center gap-1.5">
                  {info.hasOverdue && <Badge tone="red">Có việc trễ</Badge>}
                  {info.state === 'current' && <Badge tone="blue">Đang ở đây</Badge>}
                  <Badge tone={info.state === 'done' ? 'green' : 'slate'}>{info.done}/{info.total}</Badge>
                </span>
              </button>
              {open && (
                <div className="space-y-1.5 border-t border-slate-200 p-3 dark:border-slate-800">
                  {list.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      actions={actions}
                      today={today}
                      dueSoonDays={settings.dueSoonDays}
                      allowDelete={t.isCustom}
                      testCount={customer.testReport.simulatedConversations}
                    />
                  ))}
                  {list.length === 0 && <div className="text-sm text-slate-500">Chưa có việc nào trong giai đoạn này.</div>}
                  {hiddenDone > 0 && <div className="text-xs text-slate-500">Đã ẩn {hiddenDone} việc lặp đã xong.</div>}
                </div>
              )}
            </div>
          );
        })}
        {mine.some((t) => !infos.some((i) => i.phase.code === t.phaseCode)) && (
          <div className="card space-y-1.5 p-3">
            <div className="text-sm font-semibold">Việc khác</div>
            {mine
              .filter((t) => !infos.some((i) => i.phase.code === t.phaseCode))
              .map((t) => (
                <TaskRow key={t.id} task={t} actions={actions} today={today} dueSoonDays={settings.dueSoonDays} allowDelete />
              ))}
          </div>
        )}
      </section>

      <CareLogPanel customer={customer} />
      <TestReportPanel customer={customer} />
      <AIErrorPanel customer={customer} />
      <PlaybookPanel defaultOpen={current?.phase.code === 'II.6'} />
      <RescheduleHistoryPanel customer={customer} />

      {actions.modals}
      {editing && <CustomerFormModal customer={customer} onClose={() => setEditing(false)} />}
      {reportOpen && <ProgressReportModal customer={customer} tasks={allTasks} onClose={() => setReportOpen(false)} />}
      {rescheduleStart && <RescheduleStartModal customerId={customer.id} start={customer.startDate} onClose={() => setRescheduleStart(false)} />}
      {addTaskOpen && <AddTaskModal customerId={customer.id} onClose={() => setAddTaskOpen(false)} />}
    </div>
  );
}

function RescheduleStartModal({ customerId, start, onClose }: { customerId: string; start: string; onClose: () => void }) {
  const [date, setDate] = useState(start);
  const [reason, setReason] = useState('');
  const delta = date ? diffDays(date, start) : 0;
  return (
    <Modal title="Dời ngày bắt đầu" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Toàn bộ việc <b>chưa xong</b> (và lịch lặp) sẽ dời theo cùng số ngày; ngày kết thúc dự kiến cũng dời theo. Việc đã xong giữ nguyên.
      </p>
      <Field label="Ngày bắt đầu mới">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <p className="mt-1 text-xs text-slate-500">Hiện tại: {formatVN(start)} {delta !== 0 && `→ mới ${formatVN(date)} (${delta > 0 ? '+' : ''}${delta} ngày)`}</p>
      <div className="mt-3">
        <Field label="Lý do (bắt buộc)">
          <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: Khách xin dời lịch bắt đầu do chưa chuẩn bị xong" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button
          className="btn-primary"
          disabled={!date || delta === 0 || !reason.trim()}
          onClick={() => {
            useStore.getState().rescheduleStart(customerId, date, reason.trim());
            onClose();
          }}
        >
          Dời ngày
        </button>
      </div>
    </Modal>
  );
}

function AddTaskModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const today = useStore((s) => s.today);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(addDays(today, 1));
  return (
    <Modal title="Thêm việc riêng cho khách" onClose={onClose}>
      <Field label="Tên việc">
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="mt-3">
        <Field label="Deadline">
          <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button
          className="btn-primary"
          disabled={!title.trim() || !deadline}
          onClick={() => {
            useStore.getState().addCustomTask(customerId, title.trim(), deadline);
            onClose();
          }}
        >
          Thêm
        </button>
      </div>
    </Modal>
  );
}
