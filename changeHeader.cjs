const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

c = c.replace(
  '<th className="p-3 font-medium min-w-[250px]">Tiến độ nghiệm thu</th>',
  '<th className="p-3 font-medium min-w-[250px]">Tiến độ SOP & Nghiệm thu</th>'
);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
