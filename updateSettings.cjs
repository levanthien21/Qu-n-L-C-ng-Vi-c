const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const importRegex = /import \{ useStore \} from '\.\.\/store\/useStore';/;
if (c.match(importRegex) && !c.includes('sendTelegramMessage')) {
   c = c.replace(importRegex, "import { useStore } from '../store/useStore';\nimport { sendTelegramMessage } from '../utils/telegram';");
}

const teleUI = `        <div className="card p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-500">✈️</span> Cấu hình Thông báo Telegram
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Telegram Bot Token</label>
              <input type="text" className="input" placeholder="Ví dụ: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" value={settings.telegramToken || ''} onChange={(e) => updateSettings({ telegramToken: e.target.value })} />
              <p className="text-xs text-slate-500 mt-1">Lấy token từ @BotFather trên Telegram.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telegram Chat ID</label>
              <input type="text" className="input" placeholder="Ví dụ: 123456789" value={settings.telegramChatId || ''} onChange={(e) => updateSettings({ telegramChatId: e.target.value })} />
              <p className="text-xs text-slate-500 mt-1">Lấy ID từ @userinfobot hoặc thêm bot vào nhóm và lấy Group ID.</p>
            </div>
            
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={!!settings.telegramNotifyProgress} onChange={(e) => updateSettings({ telegramNotifyProgress: e.target.checked })} />
                 <span className="text-sm">Báo cáo khi Tick tiến độ SOP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={!!settings.telegramNotifyMeetings} onChange={(e) => updateSettings({ telegramNotifyMeetings: e.target.checked })} />
                 <span className="text-sm">Nhắc Lịch Meeting (trước 30 phút)</span>
              </label>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => {
                  if(!settings.telegramToken || !settings.telegramChatId) return alert('Vui lòng nhập Token và Chat ID');
                  sendTelegramMessage(settings.telegramToken, settings.telegramChatId, '🤖 <b>Kết nối thành công!</b>\\nBot Hệ thống Quản lý DVHL AI đã sẵn sàng gửi thông báo cho bạn.');
                  alert('Đã gửi tin nhắn test. Vui lòng kiểm tra Telegram!');
                }}
                className="btn text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20"
              >
                Gửi tin nhắn Test
              </button>
            </div>
          </div>
        </div>

      </div>`;

c = c.replace('      </div>\n\n      <div className="flex justify-end gap-2 mt-6">', teleUI + '\n\n      <div className="flex justify-end gap-2 mt-6">');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
