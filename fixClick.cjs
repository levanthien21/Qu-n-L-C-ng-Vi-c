const fs = require('fs');
let c = fs.readFileSync('src/components/SOPGuide.tsx', 'utf8');

c = c.replace(
  '<label className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded -ml-1.5 transition-colors group">',
  '<div onClick={toggle} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded -ml-1.5 transition-colors group">'
);

c = c.replace(
  '        </span>\n      </label>',
  '        </span>\n      </div>'
);

fs.writeFileSync('src/components/SOPGuide.tsx', c, 'utf8');
