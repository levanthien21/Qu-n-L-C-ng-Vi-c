import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, diffDays, formatVN, todayStr, weekday } from '../domain/dates';
import type { DateStr } from '../domain/dates';
import { isActiveCustomer, taskState } from '../domain/status';
import type { Task } from '../domain/types';
import { useStore } from '../store/useStore';
import { Badge } from '../components/ui';

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Thứ 2 của tuần chứa ngày d */
function mondayOf(d: DateStr): DateStr {
  const wd = weekday(d); // 0 = CN
  return addDays(d, -((wd + 6) % 7));
}

function chipClass(t: Task, today: string, dueSoon: number): string {
  if (t.meetingNo && t.status !== 'done') return 'bg-sky-600 text-white';
  const st = taskState(t, today, dueSoon);
  switch (st) {
    case 'overdue':
      return 'bg-red-500 text-white';
    case 'due_today':
    case 'due_soon':
      return 'bg-amber-400 text-amber-950';
    case 'done':
      return 'bg-emerald-200 text-emerald-900 line-through opacity-70 dark:bg-emerald-900/50 dark:text-emerald-200';
    case 'waiting_customer':
      return 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
    case 'waiting_audit':
      return 'bg-sky-200 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100';
    default:
      return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200';
  }
}

export default function CalendarPage() {
  const customers = useStore((s) => s.customers);
  const tasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);

  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState<DateStr>(today);
  const [selected, setSelected] = useState<DateStr>(today);
  const [customerId, setCustomerId] = useState('all');
  const [showRecurring, setShowRecurring] = useState(false);
  const [showDone, setShowDone] = useState(true);

  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const byDate = useMemo(() => {
    const map = new Map<DateStr, Task[]>();
    for (const t of tasks) {
      const c = custMap.get(t.customerId);
      if (!c) continue;
      if (customerId !== 'all' && t.customerId !== customerId) continue;
      if (!isActiveCustomer(c) && customerId === 'all') continue;
      if (t.ruleId && !showRecurring) continue;
      if (t.status === 'done' && !showDone) continue;
      const list = map.get(t.deadline) ?? [];
      list.push(t);
      map.set(t.deadline, list);
    }
    return map;
  }, [tasks, custMap, customerId, showRecurring, showDone]);

  // Danh sách ngày cần vẽ
  const days = useMemo(() => {
    if (mode === 'week') {
      const m = mondayOf(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(m, i));
    }
    const first = `${cursor.slice(0, 7)}-01`;
    const start = mondayOf(first);
    const monthDays = new Date(Date.UTC(+first.slice(0, 4), +first.slice(5, 7), 0)).getUTCDate();
    const needed = Math.ceil((diffDays(first, start) + monthDays) / 7) * 7;
    return Array.from({ length: needed }, (_, i) => addDays(start, i));
  }, [mode, cursor]);

  const move = (dir: -1 | 1) => {
    if (mode === 'week') setCursor(addDays(cursor, dir * 7));
    else {
      const y = +cursor.slice(0, 4);
      const m = +cursor.slice(5, 7) - 1 + dir;
      const d = new Date(Date.UTC(y, m, 1));
      setCursor(d.toISOString().slice(0, 10));
    }
  };

  const title =
    mode === 'month'
      ? `Tháng ${cursor.slice(5, 7)}/${cursor.slice(0, 4)}`
      : `Tuần ${formatVN(days[0])} – ${formatVN(days[6])}`;
  const curMonth = cursor.slice(0, 7);
  const agenda = (byDate.get(selected) ?? []).sort((a, b) => a.order - b.order);
  const maxChips = mode === 'week' ? 12 : 3;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Lịch deadline & meeting</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="all">Tất cả khách đang triển khai</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
            {(['month', 'week'] as const).map((m) => (
              <button
                key={m}
                className={`px-3 py-1.5 text-sm ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800'}`}
                onClick={() => setMode(m)}
              >
                {m === 'month' ? 'Tháng' : 'Tuần'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button className="btn-secondary btn-sm" onClick={() => move(-1)} aria-label="Trước">
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setCursor(todayStr());
              setSelected(todayStr());
            }}
          >
            Hôm nay
          </button>
          <button className="btn-secondary btn-sm" onClick={() => move(1)} aria-label="Sau">
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 font-semibold">{title}</span>
        </div>
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showRecurring} onChange={(e) => setShowRecurring(e.target.checked)} /> Việc lặp
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Việc đã xong
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
          {DOW.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const list = byDate.get(d) ?? [];
            const inMonth = mode === 'week' || d.slice(0, 7) === curMonth;
            return (
              <div
                key={d}
                onClick={() => setSelected(d)}
                className={`min-h-[84px] cursor-pointer border-b border-r border-slate-100 p-1 dark:border-slate-800 ${mode === 'week' ? 'min-h-[220px]' : ''} ${
                  inMonth ? '' : 'bg-slate-50/60 text-slate-400 dark:bg-slate-900/40'
                } ${selected === d ? 'ring-2 ring-inset ring-indigo-500' : ''}`}
              >
                <div className={`mb-0.5 text-right text-[11px] ${d === today ? 'font-bold text-indigo-600' : ''}`}>
                  {d === today ? <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-white">{+d.slice(8)}</span> : +d.slice(8)}
                </div>
                <div className="space-y-0.5">
                  {list.slice(0, maxChips).map((t) => (
                    <div key={t.id} className={`truncate rounded px-1 text-[10px] leading-4 ${chipClass(t, today, settings.dueSoonDays)}`} title={`${custMap.get(t.customerId)?.name}: ${t.title}`}>
                      {t.meetingNo ? '📅 ' : ''}
                      {custMap.get(t.customerId)?.name.split(' ').slice(-2).join(' ')} · {t.title}
                    </div>
                  ))}
                  {list.length > maxChips && <div className="text-[10px] text-slate-500">+{list.length - maxChips} việc nữa</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Badge tone="red">Trễ</Badge>
        <Badge tone="yellow">Sắp đến hạn</Badge>
        <Badge tone="green">Xong</Badge>
        <Badge tone="gray">Chờ khách</Badge>
        <Badge tone="blue">Chờ Hậu Kiểm / Meeting</Badge>
      </div>

      <section className="card p-4">
        <h2 className="section-title">Chi tiết ngày {formatVN(selected)}</h2>
        {agenda.length === 0 ? (
          <div className="text-sm text-slate-500">Không có deadline hay meeting nào.</div>
        ) : (
          <ul className="space-y-1.5">
            {agenda.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded px-1.5 text-[11px] ${chipClass(t, today, settings.dueSoonDays)}`}>{t.meetingNo ? `Meeting ${t.meetingNo}` : t.status === 'done' ? 'Xong' : 'Hạn'}</span>
                <Link to={`/khach-hang/${t.customerId}`} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                  {custMap.get(t.customerId)?.name}
                </Link>
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
