const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');

c = c.replace(
  "const mTime = new Date(m.date).getTime();",
  "const mTime = new Date(m.date + '+07:00').getTime();"
);

fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
