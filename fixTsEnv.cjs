const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

c = c.replace(/import\.meta\.env/g, '(import.meta as any).env');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
