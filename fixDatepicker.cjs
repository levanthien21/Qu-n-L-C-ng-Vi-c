const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');
c = c.replace("setDate('');", "setDate(null);");
fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
