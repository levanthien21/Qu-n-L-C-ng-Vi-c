const fs = require('fs');
let c = fs.readFileSync('src/store/useStore.ts', 'utf8');

c = c.replace(
  '      if (!data) {',
  `      if (data) {
        data.settings.googleScriptUrl = data.settings.googleScriptUrl || DEFAULT_SETTINGS.googleScriptUrl;
        data.settings.telegramToken = data.settings.telegramToken || DEFAULT_SETTINGS.telegramToken;
        data.settings.telegramChatId = data.settings.telegramChatId || DEFAULT_SETTINGS.telegramChatId;
        if (data.settings.telegramNotifyProgress === undefined) data.settings.telegramNotifyProgress = DEFAULT_SETTINGS.telegramNotifyProgress;
        if (data.settings.telegramNotifyMeetings === undefined) data.settings.telegramNotifyMeetings = DEFAULT_SETTINGS.telegramNotifyMeetings;
      }
      if (!data) {`
);

fs.writeFileSync('src/store/useStore.ts', c, 'utf8');
