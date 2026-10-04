const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Remove Demo section
const demoRegex = /<section className="card p-4">\s*<h2 className="section-title">Dữ liệu mẫu<\/h2>[\s\S]*?<\/section>/;
c = c.replace(demoRegex, '');

// Remove the Giai đoạn 2 paragraph
const devNotesRegex = /<p className="mt-3 text-xs text-slate-500">Giai đoạn 2[^<]+<\/p>/;
c = c.replace(devNotesRegex, '');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
