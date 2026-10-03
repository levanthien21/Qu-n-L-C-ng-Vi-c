import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, ChevronRight, Hourglass, ListChecks, Users } from 'lucide-react';
import { groupByCustomer } from '../domain/alerts';
import type { TaskView } from '../domain/alerts';
import { diffDays, formatVNShort, weekdayVN } from '../domain/dates';
import { customerStatus, customerTasks, getCurrentPhase } from '../domain/status';
import { CUSTOMER_STATUS_LABEL } from '../domain/types';
import type { Customer, CustomerStatusKey, Task } from '../domain/types';
import { useStore } from '../store/useStore';
import { useDashboard } from '../components/Layout';
import { TaskRow, useTaskActions } from '../components/TaskRow';
import { Badge, EmptyState } from '../components/ui';
import type { Tone } from '../components/ui';

const STATUS_TONE: Record<CustomerStatusKey, string> = {
  in_progress: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300',
  late: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  paused: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ticket_closed: 'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
};

function GroupedTasks({
  list,
  actions,
  today,
  dueSoonDays,
}: {
  list: TaskView[];
  actions: ReturnType<typeof useTaskActions>;
  today: string;
  dueSoonDays: number;
}) {
  const tasks = useStore((s) => s.tasks);
  return (
    <div className="space-y-3">
      {groupByCustomer(list).map((g) => (
        <CustomerGroup key={g.customer.id} customer={g.customer} allTasks={tasks}>
          {g.tasks.map((t) => (
            <TaskRow key={t.id} task={t} actions={actions} today={today} dueSoonDays={dueSoonDays} testCount={g.customer.testReport.simulatedConversations} />
          ))}
        </CustomerGroup>
      ))}
    </div>
  );
}

function CustomerGroup({ customer, allTasks, children }: { customer: Customer; allTasks: Task[]; children: React.ReactNode }) {
  const today = useStore((s) => s.today);
  const phase = getCurrentPhase(customer, customerTasks(customer, allTasks), today);
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <Link to={`/khach-hang/${customer.id}`} className="text-sm font-bold text-indigo-700 hover:underline dark:text-indigo-300">
          {customer.name}
        </Link>
        {phase && <span className="text-[11px] text-slate-500">{phase.code} · {phase.tag}</span>}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Block({ title, icon, count, children, right }: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title} {count !== undefined && <Badge tone="slate">{count}</Badge>}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function TodayPage() {
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  const customers = useStore((s) => s.customers);
  const tasks = useStore((s) => s.tasks);
  const setManualStatus = useStore((s) => s.setManualStatus);
  const dash = useDashboard();
  const actions = useTaskActions();
  const [showWaiting, setShowWaiting] = useState(false);
  const [showAllAttention, setShowAllAttention] = useState(false);

  // ---- Số lượng khách theo trạng thái ----
  const counts = useMemo(() => {
    const c: Record<CustomerStatusKey, number> = { in_progress: 0, late: 0, paused: 0, ticket_closed: 0, completed: 0 };
    for (const cu of customers) c[customerStatus(cu, tasks, today)]++;
    return c;
  }, [customers, tasks, today]);
  const receiving = counts.in_progress + counts.late + counts.paused;

  // ---- Lịch hẹn: meeting + follow-up trong 14 ngày tới (và quá hạn chưa xử lý) ----
  const appointments = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    return tasks
      .filter((t) => t.status !== 'done' && (t.meetingNo || t.isCustom) && diffDays(t.deadline, today) <= 14)
      .filter((t) => {
        const c = byId.get(t.customerId);
        return c && !c.manualStatus;
      })
      .map((t) => ({ t, c: byId.get(t.customerId)!, days: diffDays(t.deadline, today) }))
      .sort((a, b) => a.t.deadline.localeCompare(b.t.deadline));
  }, [customers, tasks, today]);

  // ---- Việc cần làm ngay: trễ + hôm nay + 3 ngày tới ----
  const actNow = [...dash.overdue, ...dash.today, ...dash.dueSoon];
  const sevTone: Record<string, Tone> = { danger: 'red', warning: 'yellow', info: 'blue' };

  // ---- Cần chú ý (gộp cảnh báo + nhắc nhở thành 1 danh sách) ----
  const attention = [
    ...dash.reminders
      .filter((r) => r.kind !== 'meeting')
      .map((r) => ({ key: r.id, customerId: r.customerId, name: r.customerName, severity: r.severity, text: r.text, action: r.action })),
    ...dash.risky.flatMap(({ customer, reasons }) =>
      reasons
        .filter((x) => x.kind === 'stale' || x.kind === 'waiting')
        .map((x, i) => ({ key: `${customer.id}-${x.kind}-${i}`, customerId: customer.id, name: customer.name, severity: x.severity, text: x.text, action: undefined as 'close_ticket' | undefined })),
    ),
  ];
  const attentionShown = showAllAttention ? attention : attention.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Tổng quan</h1>
        <Link to="/khach-hang" className="btn-primary btn-sm">
          + Thêm / xem khách
        </Link>
      </div>

      {/* 1. Khách hàng theo trạng thái */}
      <Block title="Khách hàng" icon={<Users size={16} />}>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{receiving}</span>
          <span className="text-sm text-slate-500">khách đang tiếp nhận (tổng {customers.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatusKey[]).map((k) => (
            <Link key={k} to={`/khach-hang?status=${k}`} className={`rounded-lg border px-3 py-2 transition hover:shadow ${STATUS_TONE[k]}`}>
              <div className="text-2xl font-bold">{counts[k]}</div>
              <div className="text-xs">{CUSTOMER_STATUS_LABEL[k]}</div>
            </Link>
          ))}
        </div>
      </Block>

      {/* 2. Lịch hẹn */}
      <Block title="Lịch hẹn 14 ngày tới" icon={<CalendarDays size={16} />} count={appointments.length} right={<Link to="/lich" className="text-xs text-indigo-600 hover:underline">Xem lịch</Link>}>
        {appointments.length === 0 ? (
          <EmptyState>Chưa có meeting hay lịch follow-up nào sắp tới.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {appointments.map(({ t, c, days }) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <div className={`w-28 shrink-0 text-xs font-semibold ${days < 0 ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                  {weekdayVN(t.deadline)} {formatVNShort(t.deadline)}
                  <div className="font-normal text-slate-500">{days < 0 ? `trễ ${-days} ngày` : days === 0 ? 'Hôm nay' : `còn ${days} ngày`}</div>
                </div>
                <Badge tone={t.meetingNo ? 'blue' : 'slate'}>{t.meetingNo ? `Meeting buổi ${t.meetingNo}` : 'Follow-up'}</Badge>
                <Link to={`/khach-hang/${c.id}`} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                  {c.name}
                </Link>
                {!t.meetingNo && <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{t.title.replace(/^Follow-up:\s*/, '')}</span>}
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* 3. Việc cần làm ngay */}
      <Block title="Việc cần làm ngay" icon={<ListChecks size={16} />} count={actNow.length}>
        {actNow.length === 0 ? (
          <EmptyState>Không có việc nào trễ hoặc đến hạn trong 3 ngày tới 🎉</EmptyState>
        ) : (
          <div className="space-y-4">
            {dash.overdue.length > 0 && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/20">
                <div className="mb-2 text-sm font-bold text-red-700 dark:text-red-300">Quá hạn ({dash.overdue.length})</div>
                <GroupedTasks list={dash.overdue} actions={actions} today={today} dueSoonDays={settings.dueSoonDays} />
              </div>
            )}
            {dash.today.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-400">Hôm nay ({dash.today.length})</div>
                <GroupedTasks list={dash.today} actions={actions} today={today} dueSoonDays={settings.dueSoonDays} />
              </div>
            )}
            {dash.dueSoon.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-bold text-slate-600 dark:text-slate-300">1–3 ngày tới ({dash.dueSoon.length})</div>
                <GroupedTasks list={dash.dueSoon} actions={actions} today={today} dueSoonDays={settings.dueSoonDays} />
              </div>
            )}
          </div>
        )}
      </Block>

      {/* 4. Cần chú ý */}
      {attention.length > 0 && (
        <Block title="Cần chú ý" icon={<Bell size={16} />} count={attention.length}>
          <ul className="space-y-2">
            {attentionShown.map((a) => (
              <li key={a.key} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={sevTone[a.severity]}>{a.severity === 'danger' ? 'Khẩn' : a.severity === 'warning' ? 'Chú ý' : 'Nhắc'}</Badge>
                <Link to={`/khach-hang/${a.customerId}`} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                  {a.name}
                </Link>
                <span className="min-w-0 flex-1">{a.text}</span>
                {a.action === 'close_ticket' && (
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => {
                      const c = customers.find((x) => x.id === a.customerId);
                      if (c && window.confirm(`Xác nhận đã báo sale và nhắn lên nhóm? Chuyển "${c.name}" sang Tạm đóng ticket.`)) {
                        setManualStatus(c.id, 'ticket_closed', 'Khách không phản hồi quá 15 ngày');
                      }
                    }}
                  >
                    Tạm đóng ticket
                  </button>
                )}
              </li>
            ))}
          </ul>
          {attention.length > 4 && (
            <button className="btn-ghost btn-sm mt-2" onClick={() => setShowAllAttention(!showAllAttention)}>
              {showAllAttention ? 'Thu gọn' : `Xem thêm ${attention.length - 4} mục`}
            </button>
          )}
        </Block>
      )}

      {/* 5. Đang chờ — mặc định thu gọn */}
      {dash.waiting.length > 0 && (
        <section className="card">
          <button className="flex w-full items-center gap-2 p-3 text-left text-sm font-semibold sm:p-4" onClick={() => setShowWaiting(!showWaiting)}>
            {showWaiting ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Hourglass size={16} /> Đang chờ khách / Hậu Kiểm <Badge tone="slate">{dash.waiting.length}</Badge>
            <span className="ml-1 text-xs font-normal text-slate-500">(không tính là trễ của bạn)</span>
          </button>
          {showWaiting && (
            <div className="border-t border-slate-100 p-3 dark:border-slate-800 sm:p-4">
              <GroupedTasks list={dash.waiting} actions={actions} today={today} dueSoonDays={settings.dueSoonDays} />
            </div>
          )}
        </section>
      )}

      {actions.modals}
    </div>
  );
}
