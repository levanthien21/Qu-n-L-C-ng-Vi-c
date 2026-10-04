import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { CUSTOMER_STATUS_LABEL } from '../domain/types';
import type { CustomerStatusKey } from '../domain/types';

export type Tone = 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple' | 'orange' | 'slate' | 'dark-green' | 'dark-yellow' | 'dark-blue';

const TONE: Record<Tone, string> = {
  red: 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900',
  yellow: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900',
  blue: 'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900',
  gray: 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  purple: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-900',
  orange: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-900',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-400 dark:ring-slate-700',
  'dark-green': 'bg-green-200 text-green-800 ring-green-400 dark:bg-green-900/80 dark:text-green-200 dark:ring-green-700',
  'dark-yellow': 'bg-amber-200 text-amber-800 ring-amber-400 dark:bg-amber-900/80 dark:text-amber-200 dark:ring-amber-700',
  'dark-blue': 'bg-blue-200 text-blue-800 ring-blue-400 dark:bg-blue-900/80 dark:text-blue-200 dark:ring-blue-700',
};

export function Badge({ tone = 'slate', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function CustomerStatusBadge({ status }: { status: CustomerStatusKey }) {
  const tone: Record<CustomerStatusKey, Tone> = {
    in_progress: 'blue',
    late: 'red',
    paused: 'gray',
    ticket_closed: 'slate',
    completed: 'green',
  };
  return <Badge tone={tone[status]}>{CUSTOMER_STATUS_LABEL[status]}</Badge>;
}

export function ProgressBar({ percent, tone = 'indigo' }: { percent: number; tone?: 'indigo' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'bg-emerald-500' : tone === 'red' ? 'bg-red-500' : 'bg-indigo-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`card flex max-h-[92vh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-b-xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-base font-semibold">{title}</h3>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = 'slate',
  hint,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
  hint?: string;
}) {
  const color: Record<Tone, string> = {
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-sky-600 dark:text-sky-400',
    gray: 'text-slate-600 dark:text-slate-300',
    purple: 'text-violet-600 dark:text-violet-400',
    orange: 'text-orange-600 dark:text-orange-400',
    slate: 'text-slate-800 dark:text-slate-100',
    'dark-green': 'text-green-700 dark:text-green-400',
    'dark-yellow': 'text-amber-700 dark:text-amber-400',
    'dark-blue': 'text-blue-700 dark:text-blue-400',
  };
  return (
    <div className="card p-3 sm:p-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold sm:text-3xl ${color[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}
