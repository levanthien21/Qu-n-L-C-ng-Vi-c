const fs = require('fs');
let c = fs.readFileSync('src/store/useStore.ts', 'utf8');

c = c.replace(
  'data = normalizeData({ templates, customers: demo.customers, tasks: demo.tasks, settings: DEFAULT_SETTINGS });',
  'data = normalizeData({ templates, customers: [], tasks: [], settings: DEFAULT_SETTINGS });'
);

fs.writeFileSync('src/store/useStore.ts', c, 'utf8');
