import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ListChecks,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Monitor
} from 'lucide-react';
import { formatVN, weekdayVN } from '../domain/dates';
import { customerWaitingDays } from '../domain/status';
import { useStore } from '../store/useStore';
import { sendTelegramMessage } from '../utils/telegram';

const MAIN_NAV = [
  { to: '/', label: 'Bảng điều khiển (Dashboard)', icon: ListChecks, end: true },
];

const SECONDARY_NAV = [
  { to: '/cai-dat', label: 'Cài đặt (Webhook)', icon: SettingsIcon, end: false },
];

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

  useEffect(() => {
    const store = useStore.getState();
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

    const bgSync = async () => {
      const { settings, customers, updateCustomer } = useStore.getState();
      if (!settings.googleScriptUrl) return;
      const active = customers.filter((c) => c.sheetLink && (!c.manualStatus || c.manualStatus === 'paused'));
      for (const c of active) {
        try {
          const match = c.sheetLink!.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (!match) continue;
          const res = await fetch(`${settings.googleScriptUrl}?id=${match[1]}`);
          const data = await res.json();
          if (data.success && data.data) {
             updateCustomer(c.id, { 
               sheetData: data.data,
               lastSheetSync: new Date().toISOString()
             });
          }
        } catch (e) {
          console.error('Lỗi đồng bộ ngầm', c.name, e);
        }
      }
    };
    bgSync(); 
    const iv = setInterval(bgSync, 10 * 60 * 1000); 
    
    const meetingReminderLoop = () => {
       const { settings, customers, updateCustomer } = useStore.getState();
       if (!settings.telegramToken || !settings.telegramChatId) return;
       const now = new Date().getTime();
       
       for (const c of customers) {
          let updated = false;
          const newNotes = (c.meetingNotes || []).map(m => {
             if (m.done) return m;
             const mTime = new Date(m.date).getTime();
             const diffMins = (mTime - now) / 60000;
             if (diffMins > 0 && diffMins <= 30 && !m.notified) {
                 sendTelegramMessage(settings.telegramToken!, settings.telegramChatId!, `⏰ [NHẮC LỊCH 30 PHÚT] Sắp tới lịch hẹn với khách hàng **${c.name}**
- Thời gian: ${new Date(m.date).toLocaleString('vi-VN')}
- Ghi chú: ${m.note || 'Không có'}`);
                 updated = true;
                 return { ...m, notified: true };
             }
             if (diffMins > 0 && diffMins <= 10 && !m.notified10) {
                 sendTelegramMessage(settings.telegramToken!, settings.telegramChatId!, `🔥 [NHẮC LỊCH 10 PHÚT] Khách hàng **${c.name}** đã sắp đến giờ họp!
- Thời gian: ${new Date(m.date).toLocaleString('vi-VN')}`);
                 updated = true;
                 return { ...m, notified10: true };
             }
             return m;
          });
          if (updated) {
             updateCustomer(c.id, { meetingNotes: newNotes });
          }
       }
    };
    
    meetingReminderLoop();
    const iv2 = setInterval(meetingReminderLoop, 60 * 1000);

    return () => { clearInterval(iv); clearInterval(iv2); };
  }, [today]);

  const NavItem = ({ to, label, icon: Icon, end }: any) => {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30' : 'text-slate-600 hover:translate-x-1 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-800/50'
          }`
        }
        onClick={() => {
          if (window.innerWidth < 1024) document.getElementById('sidebar-toggle')?.click();
        }}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="opacity-75 group-hover:opacity-100" />
          {label}
        </div>
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100">
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur dark:bg-slate-900/90 border-b border-orange-100 dark:border-slate-800 flex items-center justify-between px-4 z-50">
        <span className="flex items-center gap-2 font-extrabold text-lg">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md shadow-orange-500/30" />
          <span className="gradient-text">Thiện Bot Bán Hàng</span>
        </span>
        <button id="sidebar-toggle" className="p-2 -mr-2" onClick={() => document.body.classList.toggle('sidebar-open')}>
          <ListChecks size={24} />
        </button>
      </div>

      <aside className="sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 -translate-x-full lg:translate-x-0 transition-transform bg-white/90 backdrop-blur dark:bg-slate-900/90 border-r border-orange-100 dark:border-slate-800 flex flex-col">
        <div className="h-20 hidden lg:flex items-center px-5 border-b border-orange-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 rounded-2xl object-contain bg-white p-1.5 shadow-lg shadow-orange-500/30 ring-2 ring-orange-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 animate-float" />
            <div className="leading-tight">
              <div className="gradient-text text-lg font-extrabold">Thiện Bot Bán Hàng</div>
              <div className="text-[11px] font-medium text-slate-500">DVHL Support Manager</div>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-20 lg:pt-4">
          <nav className="space-y-1">
            {MAIN_NAV.map((n) => (
              <NavItem key={n.to} {...n} />
            ))}
          </nav>

          <nav className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
             {SECONDARY_NAV.map((n) => (
               <NavItem key={n.to} {...n} />
             ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <ThemeToggle />
        </div>
      </aside>

      <div
        className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden opacity-0 pointer-events-none transition-opacity overlay"
        onClick={() => document.body.classList.remove('sidebar-open')}
      />

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          
          <Outlet />
        </div>
      </main>

      <style>{`
        .sidebar-open .sidebar { transform: translateX(0); }
        .sidebar-open .overlay { opacity: 1; pointer-events: auto; }
      `}</style>
    </div>
  );
}
