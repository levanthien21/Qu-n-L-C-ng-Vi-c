const fs = require('fs');
let c = fs.readFileSync('api/cron.ts', 'utf8');

c = c.replace(
  "if (diffMins > 0 && diffMins <= 10 && !m.notified10) {",
  `if (diffMins <= 0 && diffMins > -10 && !m.notified0) {
          sendTelegram(token, chatId, \`🔴 [ĐÃ TỚI GIỜ HẸN] Khách hàng <b>\${c.name}</b> đã đến giờ họp rồi nhé!\\n- Thời gian: \${timeStr}\`);
          m.notified0 = true;
          shouldUpdate = true;
        }
        
        if (diffMins > 0 && diffMins <= 10 && !m.notified10) {`
);

fs.writeFileSync('api/cron.ts', c, 'utf8');
