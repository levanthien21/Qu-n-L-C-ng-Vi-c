const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

const regex = /<td className="p-3 align-top">\s*<div className=\{\`flex flex-col gap-2 w-full max-w-\[240px\] p-3 rounded border \$\{isCompletedSection \? 'bg-emerald-50\/50 border-emerald-100' : 'bg-indigo-50\/50 border-indigo-100 dark:bg-indigo-900\/20 dark:border-indigo-800\/50'\}\`\}>[\s\S]*?<\/td>/;

const newCell = `<td className="p-3 align-top">
                   <div className="w-full max-w-[250px]">
                     <div className="flex items-center justify-between mb-2.5">
                       <Badge tone={getBadgeTone(currentStatus)}>{currentStatus}</Badge>
                       {!isCompletedSection && remainingDays !== null && (() => {
                          const overdue = remainingDays < 0;
                          const urgent = !overdue && remainingDays <= 5;
                          const notice = !overdue && !urgent && remainingDays <= 10;
                          return (
                            <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full border \${overdue ? 'bg-red-50 text-red-600 border-red-200' : urgent ? 'bg-orange-50 text-orange-600 border-orange-200' : notice ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}\`}>
                               {overdue ? \`Trễ \${-remainingDays} ngày\` : remainingDays === 0 ? 'Hạn hôm nay' : \`Còn \${remainingDays} ngày\`}
                            </span>
                          )
                       })()}
                       {isCompletedSection && remainingDays !== null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                             {remainingDays > 0 ? \`Sớm \${remainingDays} ngày\` : remainingDays < 0 ? \`Trễ \${-remainingDays} ngày\` : 'Đúng hạn'}
                          </span>
                       )}
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-lg p-2.5 mb-2 shadow-sm">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          <span>Nghiệm thu ({stats.durationDays} ngày)</span>
                          <span className={timePercent > 100 ? 'text-red-500' : 'text-indigo-600'}>{timePercent}%</span>
                        </div>
                        <ProgressBar percent={Math.min(timePercent, 100)} tone={remainingDays !== null && remainingDays < 0 ? 'red' : 'indigo'} />
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                          <span>{stats.startDate ? formatDateVN(stats.startDate) : '--'}</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{handoverDate ? formatDateVN(handoverDate) : '--'}</span>
                        </div>
                     </div>

                     {!isCompletedSection && (() => {
                        const sopDone = Math.min(Object.values(c.sopChecklist || {}).filter(Boolean).length, 48);
                        const sopPct = Math.round((sopDone / 48) * 100);
                        const behind = sopPct + 15 < timePercent;
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-lg p-2.5 shadow-sm">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                               <span>Tiến độ SOP</span>
                               <span className={behind ? 'text-red-500' : 'text-emerald-600'}>{sopDone}/48</span>
                             </div>
                             <ProgressBar percent={sopPct} tone={behind ? 'red' : 'emerald'} />
                             {behind && <div className="text-[9px] text-red-500 mt-1.5 font-medium text-right">⚠ Đang chậm hơn thời gian</div>}
                          </div>
                        )
                     })()}
                   </div>
                 </td>`;

if (regex.test(c)) {
   c = c.replace(regex, newCell);
   fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
   console.log('done');
} else {
   console.log('not found regex');
}
