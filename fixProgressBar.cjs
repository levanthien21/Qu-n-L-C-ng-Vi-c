const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');
c = c.replace("tone={behind ? 'red' : 'emerald'}", "tone={behind ? 'red' : 'green'}");
fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
