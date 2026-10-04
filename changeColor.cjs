const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');
c = c.replace(
  "case 'DV – CB Kiến Thức': return 'dark-green';",
  "case 'DV – CB Kiến Thức': return 'purple';"
);
fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
