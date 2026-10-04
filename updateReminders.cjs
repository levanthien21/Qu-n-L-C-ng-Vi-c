const fs = require('fs');

// 1. Update types.ts
let typesContent = fs.readFileSync('src/domain/types.ts', 'utf8');
typesContent = typesContent.replace(
  "meetingNotes?: { id: string; date: string; note: string; notified?: boolean }[];",
  "meetingNotes?: { id: string; date: string; note: string; notified?: boolean; notified10?: boolean }[];"
);
fs.writeFileSync('src/domain/types.ts', typesContent, 'utf8');

// 2. Update App.tsx logic
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `            // Remind 30 mins before
            if (!m.notified && mTime > now && mTime - now <= 30 * 60000) {
               sendTelegramMessage(
                  settings.telegramToken, 
                  settings.telegramChatId, 
                  \`🔔 <b>NHẮC HẸN MEETING SẮP TỚI</b>\\n\\nKhách hàng: <b>\${c.name}</b>\\nLịch hẹn: \${new Date(m.date).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}\\nNội dung: \${m.note}\`
               );
               changed = true;
               return { ...m, notified: true };
            }`;

const newLogic = `            const timeDiff = mTime - now;
            let updatedM = { ...m };
            
            // Remind 10 mins before
            if (!m.notified10 && timeDiff > 0 && timeDiff <= 10 * 60000) {
               sendTelegramMessage(
                  settings.telegramToken, 
                  settings.telegramChatId, 
                  \`🚨 <b>CHUẨN BỊ MEETING (Còn 10 phút)</b>\\n\\nKhách hàng: <b>\${c.name}</b>\\nLịch hẹn: \${new Date(m.date).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}\\nNội dung: \${m.note}\`
               );
               changed = true;
               updatedM.notified10 = true;
               updatedM.notified = true; // Mark 30m as done if skipped
            } 
            // Remind 30 mins before
            else if (!m.notified && timeDiff > 10 * 60000 && timeDiff <= 30 * 60000) {
               sendTelegramMessage(
                  settings.telegramToken, 
                  settings.telegramChatId, 
                  \`🔔 <b>NHẮC HẸN MEETING (Còn 30 phút)</b>\\n\\nKhách hàng: <b>\${c.name}</b>\\nLịch hẹn: \${new Date(m.date).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}\\nNội dung: \${m.note}\`
               );
               changed = true;
               updatedM.notified = true;
            }
            
            return updatedM;`;

appContent = appContent.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', appContent, 'utf8');

