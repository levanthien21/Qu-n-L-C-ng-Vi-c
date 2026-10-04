const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

const funcToAdd = `
  const getBadgeTone = (status: string): any => {
     switch (status) {
        case 'DV-Gets': return 'red';
        case 'DV – CB Kiến Thức': return 'dark-green';
        case 'DV – Test AI': return 'dark-yellow';
        case 'DV – Actual Run': return 'dark-blue';
        case 'DV – Done': return 'green';
        default: return 'slate';
     }
  };
`;

c = c.replace(
  'const getCustomerStatus = (stats: SheetStats) => {',
  funcToAdd + '\n  const getCustomerStatus = (stats: SheetStats) => {'
);

c = c.replace(
  '<Badge tone={isDone ? \'green\' : \'blue\'}>{currentStatus}</Badge>',
  '<Badge tone={getBadgeTone(currentStatus)}>{currentStatus}</Badge>'
);

c = c.replace(
  '<Badge tone={currentStatus === \'DV – Done\' ? \'green\' : \'blue\'}>{currentStatus}</Badge>',
  '<Badge tone={getBadgeTone(currentStatus)}>{currentStatus}</Badge>'
);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
