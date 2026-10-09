const fs = require('fs');
let c = fs.readFileSync('src/domain/types.ts', 'utf8');

c = c.replace(
  /export const DEFAULT_SETTINGS: Settings = \{/,
  `export const DEFAULT_SETTINGS: Settings = {
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbx7jw3ZTcMh0t6ROz4wL6kYsVnvBzj_RPxZZh9HAhMGfACUcFL3ZXrxjv0AME17O6I/exec',
  telegramToken: '8810340638:AAGooPsfR68rBQIVDhJjwtreNvQxq6gEt9I',
  telegramChatId: '8770897961',
  telegramNotifyProgress: true,
  telegramNotifyMeetings: true,`
);

fs.writeFileSync('src/domain/types.ts', c, 'utf8');
