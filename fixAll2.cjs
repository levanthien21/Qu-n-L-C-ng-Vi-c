const fs = require('fs');

// 1. Fix Layout.tsx: Remove date, fix logo clipping
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layout = layout.replace(
`<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">{weekdayVN(today)}</div>
              <h1 className="text-2xl font-extrabold">{formatVN(today)}</h1>
            </div>
          </div>`,
''
);

// Fix logo clipping by adding padding inside the white rounded background
layout = layout.replace('className="h-10 w-10 rounded-xl object-contain bg-white shadow-md shadow-orange-500/30"', 'className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md shadow-orange-500/30"');
layout = layout.replace('className="h-16 w-16 rounded-2xl object-contain bg-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 animate-float"', 'className="h-16 w-16 rounded-2xl object-contain bg-white p-1.5 shadow-lg shadow-orange-500/30 ring-2 ring-orange-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 animate-float"');

fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');

