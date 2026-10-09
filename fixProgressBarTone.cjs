const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

c = c.replace(
  /<ProgressBar percent=\{sopPct\} tone=\{behind \? 'red' : 'green'\} \/>/g,
  `<ProgressBar percent={sopPct} tone={behind ? 'red' : undefined} />`
);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
