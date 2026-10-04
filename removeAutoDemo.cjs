const fs = require('fs');
let c = fs.readFileSync('src/store/useStore.ts', 'utf8');

c = c.replace(
`        if (!data) {
          const templates = defaultTemplates();
          const demo = buildDemoData(templates, today);
          data = normalizeData({ templates, customers: demo.customers, tasks: demo.tasks, settings: DEFAULT_SETTINGS });
          await repository.replaceAll(data);
        }`,
`        if (!data) {
          const templates = defaultTemplates();
          data = normalizeData({ templates, customers: [], tasks: [], settings: DEFAULT_SETTINGS });
          await repository.replaceAll(data);
        }`
);

fs.writeFileSync('src/store/useStore.ts', c, 'utf8');
