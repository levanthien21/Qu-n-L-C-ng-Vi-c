import { useState } from 'react';
import { CalendarDays, CalendarPlus, Check, Clock, Trash2, Undo2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Customer } from '../domain/types';

const TYPES = [
  { key: 'kickoff', label: 'Kick-off', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  { key: 'b2', label: 'Buổi 2', cls: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { key: 'test', label: 'Test AI', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { key: 'b3', label: 'Buổi 3', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { key: 'other', label: 'Khác', cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
];

const typeOf = (k?: string) => TYPES.find((t) => t.key === k) || TYPES[4];

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function countdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const txt = days >= 1 ? `${days} ngày` : hours >= 1 ? `${hours} giờ ${mins % 60}p` : `${mins} phút`;
  if (diff < 0) return { text: `Đã qua ${txt}`, tone: 'text-slate-400' };
  if (days === 0 && hours < 3) return { text: `Còn ${txt}`, tone: 'text-red-600 font-bold animate-pulse' };
  if (days === 0) return { text: `Hôm nay · còn ${txt}`, tone: 'text-orange-600 font-bold' };
  return { text: `Còn ${txt}`, tone: 'text-emerald-600 font-semibold' };
}

export function MeetingScheduler({ customer }: { customer: Customer }) {
  const [type, setType] = useState('kickoff');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const meetings = customer.meetingNotes || [];

  const save = (list: NonNullable<Customer['meetingNotes']>) =>
    useStore.getState().updateCustomer(customer.id, { meetingNotes: list });

  const quick = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    setDate(toLocalInput(d));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const label = typeOf(type).label;
    const m = { id: Date.now().toString(), date, note: note.trim() || label, type };
    save([...meetings, m].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNote('');
    setDate('');
  };

  const sorted = [...meetings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcoming = sorted.filter((m) => !m.done && new Date(m.date).getTime() >= Date.now() - 3600000);
  const history = sorted.filter((m) => !upcoming.includes(m)).reverse();

  const Row = ({ m, past }: { m: (typeof meetings)[number]; past?: boolean }) => {
    const t = typeOf(m.type);
    const cd = countdown(m.date);
    const d = new Date(m.date);
    return (
      <div className={`group flex items-center gap-3 rounded-xl border bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 ${past ? 'opacity-70' : 'border-orange-200 dark:border-orange-900/50'}`}>
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30">
          <span className="text-[10px] font-semibold uppercase leading-none">Th{d.getMonth() + 1}</span>
          <span className="text-lg font-extrabold leading-tight">{pad(d.getDate())}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.cls}`}>{t.label}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Clock size={11} /> {pad(d.getHours())}:{pad(d.getMinutes())}
            </span>
            {!past && <span className={`text-[11px] ${cd.tone}`}>{cd.text}</span>}
          </div>
          <div className={`mt-0.5 truncate text-sm ${m.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`} title={m.note}>
            {m.note}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <button
            title={m.done ? 'Đánh dấu chưa xong' : 'Đánh dấu đã họp xong'}
            onClick={() => save(meetings.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))}
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
          >
            {m.done ? <Undo2 size={15} /> : <Check size={15} />}
          </button>
          <button
            title="Xóa lịch hẹn"
            onClick={() => save(meetings.filter((x) => x.id !== m.id))}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-4 py-3 text-white">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <CalendarDays size={18} /> Lịch hẹn Meeting & Ghi chú
        </h3>
        <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-semibold">{upcoming.length} sắp tới</span>
      </div>

      <div className="space-y-4 p-4">
        <form onSubmit={add} className="space-y-3 rounded-xl bg-orange-50/70 p-3 dark:bg-slate-900/50">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${type === t.key ? `${t.cls} scale-105 shadow-sm ring-2 ring-orange-300` : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300'}`}
              >
                <span className={`h-2 w-2 rounded-full ${t.dot}`} /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-slate-500">Chọn nhanh:</span>
            <button type="button" className="rounded-full bg-white px-2.5 py-1 font-semibold text-orange-700 shadow-sm hover:bg-orange-100" onClick={() => quick(0, 15)}>Hôm nay 15:00</button>
            <button type="button" className="rounded-full bg-white px-2.5 py-1 font-semibold text-orange-700 shadow-sm hover:bg-orange-100" onClick={() => quick(1, 9)}>Mai 09:00</button>
            <button type="button" className="rounded-full bg-white px-2.5 py-1 font-semibold text-orange-700 shadow-sm hover:bg-orange-100" onClick={() => quick(1, 14)}>Mai 14:00</button>
            <button type="button" className="rounded-full bg-white px-2.5 py-1 font-semibold text-orange-700 shadow-sm hover:bg-orange-100" onClick={() => quick(3, 10)}>+3 ngày 10:00</button>
            <button type="button" className="rounded-full bg-white px-2.5 py-1 font-semibold text-orange-700 shadow-sm hover:bg-orange-100" onClick={() => quick(7, 10)}>+1 tuần 10:00</button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm sm:w-56" />
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nội dung hẹn (VD: Hướng dẫn Retion, chốt link test...)" className="input flex-1 text-sm" />
            <button type="submit" className="btn-primary whitespace-nowrap text-sm">
              <CalendarPlus size={16} /> Thêm lịch
            </button>
          </div>
          <p className="text-[11px] text-slate-500">Telegram sẽ nhắc trước 30 phút và 10 phút (khi đã bật ở Cài đặt).</p>
        </form>

        <div className="space-y-2">
          {upcoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-orange-200 p-4 text-center text-sm italic text-slate-500">
              Chưa có lịch hẹn sắp tới. Hãy tạo lịch ngay phía trên!
            </div>
          )}
          {upcoming.map((m) => <Row key={m.id} m={m} />)}
        </div>

        {history.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-orange-600">
              Lịch sử đã họp / đã qua ({history.length})
            </summary>
            <div className="mt-2 space-y-2">
              {history.map((m) => <Row key={m.id} m={m} past />)}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
