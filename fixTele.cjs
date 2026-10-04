const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const teleUI = `      <section className="card p-4">
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
                sendTelegramMessage(store.settings.telegramToken, store.settings.telegramChatId, '🤖 <b>Kết nối thành công!</b>\\nBot Hệ thống Quản lý DVHL AI đã sẵn sàng gửi thông báo cho bạn.');
                alert('Đã gửi tin nhắn test. Vui lòng kiểm tra Telegram!');
              }}
              className="btn-secondary text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
            >
              Gửi tin nhắn Test
            </button>
          </div>
        </div>
      </section>

`;

c = c.replace('<section className="card p-4">\n        <h2 className="section-title">Công cụ khác</h2>', teleUI + '<section className="card p-4">\n        <h2 className="section-title">Công cụ khác</h2>');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
