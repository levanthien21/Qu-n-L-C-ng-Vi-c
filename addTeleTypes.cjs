const fs = require('fs');
let c = fs.readFileSync('src/domain/types.ts', 'utf8');
c = c.replace(
  "  theme: 'light' | 'dark' | 'system';",
  "  theme: 'light' | 'dark' | 'system';\n  telegramToken?: string;\n  telegramChatId?: string;\n  telegramNotifyProgress?: boolean;\n  telegramNotifyMeetings?: boolean;"
);
c = c.replace(
  "  meetingNotes?: { id: string; date: string; note: string }[];",
  "  meetingNotes?: { id: string; date: string; note: string; notified?: boolean }[];"
);
fs.writeFileSync('src/domain/types.ts', c, 'utf8');
