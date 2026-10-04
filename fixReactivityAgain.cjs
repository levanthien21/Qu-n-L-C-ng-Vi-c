const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

c = c.replace('  const theme = useStore((s) => s.settings.theme);\n  const settings = useStore((s) => s.settings);\n  const update = useStore((s) => s.updateSettings);', '  const { settings, updateSettings: update } = useStore();\n  const theme = settings.theme;');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
