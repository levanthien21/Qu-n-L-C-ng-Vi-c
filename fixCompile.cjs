const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');

c = c.replace(
  'const customer = store.customers.find(c => c.id === customerId);',
  '// customer is already passed as a prop'
);

fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
