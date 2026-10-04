import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { sendTelegramMessage } from '../utils/telegram';
import { Field } from '../components/ui';
import type { Settings } from '../domain/types';

function Num({ label, k, hint }: { label: string; k: keyof Settings; hint?: string }) {
  const value = useStore((s) => s.settings[k]) as number;
  const update = useStore((s) => s.updateSettings);
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={1}
        className="input"
        value={value}
        onChange={(e) => update({ [k]: Math.max(1, Number(e.target.value) || 1) } as Partial<Settings>)}
      />
    </Field>
  );
}

export default function SettingsPage() {
  const theme = useStore((s) => s.settings.theme);
  const update = useStore((s) => s.updateSettings);
  const store = useStore.getState();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Cài đặt</h1>

      <section className="card p-4">
        <h2 className="section-title">Giao diện</h2>
        <select className="input !w-auto" value={theme} onChange={(e) => update({ theme: e.target.value as Settings['theme'] })}>
          <option value="system">Theo hệ thống</option>
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
        </select>
      </section>

      <section className="card p-4">
        <h2 className="section-title">Ngưỡng cảnh báo</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Num label="Nhắc 'chưa liên hệ khách' sau (ngày)" k="contactAlertDays" hint="Mặc định cho mọi khách; có thể chỉnh riêng từng khách." />
          <Num label="Cảnh báo 'lâu không cập nhật' sau (ngày)" k="staleDays" />
          <Num label="Cảnh báo sớm 'Chờ khách' từ (ngày)" k="waitingWarnDays" />
          <Num label="Mốc đề xuất Tạm đóng ticket (ngày chờ khách)" k="waitingCloseDays" />
          <Num label="Nhắc sắp bàn giao khi còn (ngày)" k="handoverAlertDays" />
          <Num label="Khách 'sắp kết thúc' khi còn (ngày)" k="endingSoonDays" />
          <Num label="Việc 'sắp đến hạn' trong (ngày)" k="dueSoonDays" />
          <Num label="Cảnh báo lỗi AI từ (lần)" k="aiErrorThreshold" />
          <Num label="Số hội thoại test tối thiểu" k="minTestConversations" />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="section-title">Tích hợp Google Sheet</h2>
        <Field label="Google Apps Script Webhook URL">
          <input
            className="input"
            value={useStore((s) => s.settings.googleScriptUrl) || ''}
            onChange={(e) => update({ googleScriptUrl: e.target.value })}
            placeholder="https://script.google.com/macros/s/..."
          />
        </Field>
      </section>

      <section className="card p-4">
        <h2 className="section-title">Dữ liệu mẫu</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => { store.loadDemo(); window.alert('Đã nạp dữ liệu mẫu (nếu chưa có).'); }}>
            Nạp lại 4 khách mẫu
          </button>
          <button className="btn-secondary" onClick={() => window.confirm('Xóa các khách mẫu (chỉ khách có nhãn "Dữ liệu mẫu")?') && store.removeDemo()}>
            Xóa khách mẫu
          </button>
          <button
            className="btn-danger"
            onClick={() => window.confirm('XÓA TOÀN BỘ khách và đầu việc? Template được giữ lại. Hãy backup trước!') && store.clearAll()}
          >
            Xóa toàn bộ khách
          </button>
        </div>
      </section>

            <section className="card p-4">
        <h2 className="section-title flex items-center gap-2">
          <span className="text-blue-500">✈️</span> Cấu hình Thông báo Telegram
        </h2>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-1">Telegram Bot Token</label>
            <input type="text" className="input" placeholder="Ví dụ: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" value={store.settings.telegramToken || ''} onChange={(e) => store.updateSettings({ telegramToken: e.target.value })} />
            <p className="text-xs text-slate-500 mt-1">Lấy token từ @BotFather trên Telegram.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telegram Chat ID</label>
            <input type="text" className="input" placeholder="Ví dụ: 123456789" value={store.settings.telegramChatId || ''} onChange={(e) => store.updateSettings({ telegramChatId: e.target.value })} />
            <p className="text-xs text-slate-500 mt-1">Lấy ID từ @userinfobot hoặc thêm bot vào nhóm và lấy Group ID.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={!!store.settings.telegramNotifyProgress} onChange={(e) => store.updateSettings({ telegramNotifyProgress: e.target.checked })} />
               <span className="text-sm">Báo cáo khi Tick tiến độ SOP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={!!store.settings.telegramNotifyMeetings} onChange={(e) => store.updateSettings({ telegramNotifyMeetings: e.target.checked })} />
               <span className="text-sm">Nhắc Lịch Meeting (trước 30 phút)</span>
            </label>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => {
                if(!store.settings.telegramToken || !store.settings.telegramChatId) return alert('Vui lòng nhập Token và Chat ID');
                sendTelegramMessage(store.settings.telegramToken, store.settings.telegramChatId, '🤖 <b>Kết nối thành công!</b>\nBot Hệ thống Quản lý DVHL AI đã sẵn sàng gửi thông báo cho bạn.');
                alert('Đã gửi tin nhắn test. Vui lòng kiểm tra Telegram!');
              }}
              className="btn-secondary text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
            >
              Gửi tin nhắn Test
            </button>
          </div>
        </div>
      </section>

<section className="card p-4">
        <h2 className="section-title">Công cụ khác</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/template" className="btn-secondary">
            Chỉnh Template (gói 30 / 14 ngày…)
          </Link>
          <Link to="/du-lieu" className="btn-secondary">
            Nhập / Xuất dữ liệu
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">Giai đoạn 2 (dự kiến): nhắc mỗi sáng qua Telegram / Zalo / email và đồng bộ Supabase.</p>
      </section>
    </div>
  );
}
