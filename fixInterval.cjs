const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');

c = c.replace(
  'timeIntervals={15}',
  'timeIntervals={5}'
);

fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
