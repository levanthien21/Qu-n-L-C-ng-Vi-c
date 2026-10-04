const fs = require('fs');
let c = fs.readFileSync('src/components/ui.tsx', 'utf8');
c = c.replace(
  "    slate: 'text-slate-800 dark:text-slate-100',\n  };",
  "    slate: 'text-slate-800 dark:text-slate-100',\n    'dark-green': 'text-green-700 dark:text-green-400',\n    'dark-yellow': 'text-amber-700 dark:text-amber-400',\n    'dark-blue': 'text-blue-700 dark:text-blue-400',\n  };"
);
fs.writeFileSync('src/components/ui.tsx', c, 'utf8');
