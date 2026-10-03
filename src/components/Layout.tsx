import { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  CalendarDays,
  Columns3,
  Database,
  LayoutTemplate,
  ListChecks,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Users,
  AlertTriangle,
  Monitor,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { buildDashboard } from '../domain/alerts';
import { formatVN, weekdayVN } from '../domain/dates';
import { customerWaitingDays } from '../domain/status';
import { useStore } from '../store/useStore';

const MAIN_NAV = [
  { to: '/', label: 'Hôm nay', icon: ListChecks, end: true },
  { to: '/khach-hang', label: 'Khách hàng', icon: Users },
];

const SECONDARY_NAV = [
  { to: '/lich', label: 'Lịch', icon: CalendarDays, end: false },
  { to: '/kanban', label: 'Kanban', icon: Columns3, end: false },
  { to: '/template', label: 'Template', icon: LayoutTemplate, end: false },
  { to: '/du-lieu', label: 'Nhập/Xuất', icon: Database, end: false },
  { to: '/cai-dat', label: 'Cài đặt', icon: SettingsIcon, end: false },
];

export function useDashboard() {
  const customers = useStore((s) => s.customers);
  const tasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  return useMemo(() => buildDashboard(customers, tasks, today, settings), [customers, tasks, today, settings]);
}

function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme);
  const update = useStore((s) => s.updateSettings);
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Theo máy';
  return (
    <button className="btn-secondary btn-sm" onClick={() => update({ theme: next })} title="Đổi giao diện sáng/tối">
      <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Layout() {
  const today = useStore((s) => s.today);
  const dash = useDashboard();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const overdue = dash.stats.overdueTasks;
  const dangerReminders = dash.reminders.filter((r) => r.severity === 'danger');

  useEffect(() => {
    const store = useStore.getState();
    // 1. Tự động đóng ticket nếu quá ngày chờ
    const checkWaiting = () => {
      for (const c of store.customers) {
        if (!c.manualStatus) {
          const waitDays = customerWaitingDays(c, store.tasks, store.today);
          if (waitDays >= store.settings.waitingCloseDays) {
            store.setManualStatus(c.id, 'ticket_closed', `Hệ thống tự đóng do quá ${store.settings.waitingCloseDays} ngày Chờ khách`);
          }
        }
      }
    };
    checkWaiting();

    // 2. Tự động đồng bộ ngầm Google Sheet
    const bgSync = async () => {
      const { settings, customers, toggleMeetingConfirmed } = useStore.getState();
      if (!settings.googleScriptUrl) return;
      const active = customers.filter((c) => c.sheetLink && (!c.manualStatus || c.manualStatus === 'paused'));
      for (const c of active) {
        try {
          const match = c.sheetLink!.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (!match) continue;
          const res = await fetch(`${settings.googleScriptUrl}?id=${match[1]}`);
          const data = await res.json();
          if (data.success) {
            if (data.data.meeting1 && !c.meetingConfirmed['1']) toggleMeetingConfirmed(c.id, 1);
            if (data.data.meeting2 && !c.meetingConfirmed['2']) toggleMeetingConfirmed(c.id, 2);
            if (data.data.meeting3 && !c.meetingConfirmed['3']) toggleMeetingConfirmed(c.id, 3);
          }
        } catch (e) {
          console.error('Lỗi đồng bộ ngầm', c.name, e);
        }
      }
    };
    bgSync(); // chạy ngay lúc đầu
    const iv = setInterval(bgSync, 10 * 60 * 1000); // 10 phút/lần
    return () => clearInterval(iv);
  }, [today]);

  const badgeFor = (to: string) => (to === '/' ? overdue : to === '/khach-hang' ? dash.risky.length : 0);

  const NavItem = ({ to, label, icon: Icon, end }: any) => {
    const b = badgeFor(to);
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`
        }
      >
        <Icon size={17} />
        <span className="flex-1">{label}</span>
        {b > 0 && (
          <span className={`rounded-full px-1.5 text-[11px] font-bold text-white ${to === '/' ? 'bg-red-500' : 'bg-amber-500'}`}>{b}</span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen md:flex">
      {/* Thanh bên (máy tính) */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <Link to="/" className="mb-4 px-2 pt-1">
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">Onboarding Tracker</div>
          <div className="text-[11px] text-slate-500">Triển khai DVHL AI</div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showMoreMenu ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            <span className="flex-1 text-left">Tính năng khác</span>
          </button>
          
          {showMoreMenu && (
            <div className="ml-2 flex flex-col gap-1 border-l-2 border-slate-100 pl-2 dark:border-slate-800">
              {SECONDARY_NAV.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          )}
        </nav>
        <div className="px-2 text-[11px] text-slate-500">GMT+7 · dd/mm/yyyy</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div>
            <div className="text-sm font-semibold">
              {weekdayVN(today)}, {formatVN(today)}
            </div>
            <div className="text-[11px] text-slate-500 md:hidden">Onboarding Tracker · DVHL AI</div>
          </div>
          <ThemeToggle />
        </header>

        {(overdue > 0 || dangerReminders.length > 0) && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={14} className="mr-1.5 inline" />
            {overdue > 0 && (
              <Link to="/" className="font-semibold underline">
                {overdue} việc quá hạn
              </Link>
            )}
            {overdue > 0 && dangerReminders.length > 0 && ' · '}
            {dangerReminders.length > 0 && (
              <Link to="/" className="font-semibold underline">
                {dangerReminders.length} cảnh báo khẩn cần xử lý
              </Link>
            )}
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 p-3 sm:p-5">
          <Outlet />
        </main>
      </div>

      {/* Thanh dưới (điện thoại) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden">
        {[MAIN_NAV[0], MAIN_NAV[1], SECONDARY_NAV[0], SECONDARY_NAV[1], SECONDARY_NAV[4]].map(({ to, label, icon: Icon, end }) => {
          const b = badgeFor(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`
              }
            >
              <Icon size={19} />
              {label}
              {b > 0 && (
                <span className={`absolute right-3 top-1 rounded-full px-1 text-[9px] font-bold text-white ${to === '/' ? 'bg-red-500' : 'bg-amber-500'}`}>
                  {b}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
