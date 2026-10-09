const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
c = c.replace(/=== 'global'/g, "=== 'thienbbh'");
c = c.replace(/mã "global"/g, 'mã "thienbbh"');
c = c.replace(/s\.id === 'global' \? 'Tôi \(global\)' : s\.id/g, "s.id === 'thienbbh' ? 'Tôi (thienbbh)' : s.id");
fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
