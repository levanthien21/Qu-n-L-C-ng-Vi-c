const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');

c = c.replace(
  /sendTelegramMessage\(`⏰/g,
  "sendTelegramMessage(settings.telegramToken, settings.telegramChatId, `⏰"
);
c = c.replace(
  /sendTelegramMessage\(`🔥/g,
  "sendTelegramMessage(settings.telegramToken, settings.telegramChatId, `🔥"
);

fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
