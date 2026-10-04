const fs = require('fs');
let c = fs.readFileSync('src/components/ui.tsx', 'utf8');
c = c.replace(
  "export type Tone = 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple' | 'orange' | 'slate';",
  "export type Tone = 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple' | 'orange' | 'slate' | 'dark-green' | 'dark-yellow' | 'dark-blue';"
);
c = c.replace(
  "  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-400 dark:ring-slate-700',\n};",
  "  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-400 dark:ring-slate-700',\n  'dark-green': 'bg-green-200 text-green-800 ring-green-400 dark:bg-green-900/80 dark:text-green-200 dark:ring-green-700',\n  'dark-yellow': 'bg-amber-200 text-amber-800 ring-amber-400 dark:bg-amber-900/80 dark:text-amber-200 dark:ring-amber-700',\n  'dark-blue': 'bg-blue-200 text-blue-800 ring-blue-400 dark:bg-blue-900/80 dark:text-blue-200 dark:ring-blue-700',\n};"
);
fs.writeFileSync('src/components/ui.tsx', c, 'utf8');
