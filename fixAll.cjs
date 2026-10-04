const fs = require('fs');

// 1. Fix Layout.tsx: Remove date, fix logo clipping
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Remove the date header block completely
const headerRegex = /<div className="mb-6 flex flex-wrap items-center justify-between gap-4">[\s\S]*?<\/div>/;
layout = layout.replace(headerRegex, '');

// Fix logo clipping by adding padding inside the white rounded background
layout = layout.replace('className="h-10 w-10 rounded-xl object-contain bg-white shadow-md shadow-orange-500/30"', 'className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md shadow-orange-500/30"');
layout = layout.replace('className="h-16 w-16 rounded-2xl object-contain bg-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 animate-float"', 'className="h-16 w-16 rounded-2xl object-contain bg-white p-1.5 shadow-lg shadow-orange-500/30 ring-2 ring-orange-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 animate-float"');

fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');

// 2. Fix TodayPage.tsx: Fix the modal gap issue
let today = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

// The modal wrapper has a flex-col. The header has `p-4`. The body has `p-4 overflow-y-auto`.
// Since the scrollbar is 9px, the right side looks empty. Let's adjust the padding of the body to visually balance it.
// Replace `p-4 overflow-y-auto flex-1` with `pl-4 pr-1.5 py-4 overflow-y-auto flex-1`
today = today.replace('className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900"', 'className="pl-4 pr-1.5 py-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900"');

// Wait, the scrollbar is on the right of the `pr-1.5`, so the total right gap is 1.5 * 4 = 6px + 9px (scrollbar) = 15px.
// 15px is very close to 16px (`pl-4`). This will make it perfectly balanced!

fs.writeFileSync('src/pages/TodayPage.tsx', today, 'utf8');

