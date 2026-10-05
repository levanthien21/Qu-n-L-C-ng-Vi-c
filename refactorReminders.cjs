const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');

c = c.replace(
  "import { useStore } from '../store/useStore';",
  "import { useStore } from '../store/useStore';\nimport { sendTelegramMessage } from '../utils/telegram';"
);

const newLogic = `
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
                 sendTelegramMessage(\`⏰ [NHẮC LỊCH 30 PHÚT] Sắp tới lịch hẹn với khách hàng **\${c.name}**\n- Thời gian: \${new Date(m.date).toLocaleString('vi-VN')}\n- Ghi chú: \${m.note || 'Không có'}\`);
                 updated = true;
                 return { ...m, notified: true };
             }
             if (diffMins > 0 && diffMins <= 10 && !m.notified10) {
                 sendTelegramMessage(\`🔥 [NHẮC LỊCH 10 PHÚT] Khách hàng **\${c.name}** đã sắp đến giờ họp!\n- Thời gian: \${new Date(m.date).toLocaleString('vi-VN')}\`);
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

    return () => { clearInterval(iv); clearInterval(iv2); };`;

c = c.replace("return () => clearInterval(iv);", newLogic);

fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
