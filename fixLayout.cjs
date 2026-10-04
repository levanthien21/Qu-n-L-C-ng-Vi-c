const fs = require('fs');

// 1. Fix Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
// Fix logo size and fit
layout = layout.replace('className="h-9 w-9 rounded-xl object-cover', 'className="h-10 w-10 rounded-xl object-contain bg-white');
layout = layout.replace('className="h-12 w-12 rounded-2xl object-cover', 'className="h-16 w-16 rounded-2xl object-contain bg-white');
// Fix menu text
layout = layout.replace("label: 'Thống kê (Dashboard)'", "label: 'Bảng điều khiển (Dashboard)'");

// Replace hero banner with simple date header
const bannerRegex = /<div className="hero-banner mb-6">[\s\S]*?<\/div>\n          <\/div>/;
const newHeader = `<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">{weekdayVN(today)}</div>
              <h1 className="text-2xl font-extrabold">{formatVN(today)}</h1>
            </div>
          </div>`;
layout = layout.replace(bannerRegex, newHeader);

fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');

// 2. Fix TodayPage.tsx
let todayPage = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');
todayPage = todayPage.replace(
  '<h1 className="text-xl font-bold">Master Dashboard (Thống kê từ Google Sheet)</h1>',
  '<h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">Bảng điều khiển trung tâm <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Đồng bộ từ Google Sheet</span></h1>'
);
fs.writeFileSync('src/pages/TodayPage.tsx', todayPage, 'utf8');

