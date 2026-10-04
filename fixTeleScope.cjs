const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Ensure we have reactive settings
if (!c.includes('const settings = useStore((s) => s.settings);')) {
   c = c.replace(
     'const theme = useStore((s) => s.settings.theme);',
     'const theme = useStore((s) => s.settings.theme);\n  const settings = useStore((s) => s.settings);'
   );
}

// Replace non-reactive store calls in Telegram section
c = c.replace(/value=\{store\.settings\.telegramToken \|\| ''\}/g, "value={settings.telegramToken || ''}");
c = c.replace(/value=\{store\.settings\.telegramChatId \|\| ''\}/g, "value={settings.telegramChatId || ''}");
c = c.replace(/checked=\{!!store\.settings\.telegramNotifyProgress\}/g, "checked={!!settings.telegramNotifyProgress}");
c = c.replace(/checked=\{!!store\.settings\.telegramNotifyMeetings\}/g, "checked={!!settings.telegramNotifyMeetings}");

// Replace update calls
c = c.replace(/store\.updateSettings/g, 'update');
c = c.replace(/store\.settings\./g, 'settings.');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
