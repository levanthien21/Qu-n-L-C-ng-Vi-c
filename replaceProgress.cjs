const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

const regex = /<div className="bg-slate-50 dark:bg-slate-800\/40 border border-slate-100 dark:border-slate-700\/50 rounded-lg p-2.5 mb-2 shadow-sm">[\s\S]+?\}\)\(\)\}/;

const replacement = `(() => {
                        const sopDone = Math.min(Object.values(c.sopChecklist || {}).filter(Boolean).length, 48);
                        const sopPct = Math.round((sopDone / 48) * 100);
                        const behind = !isDone && (sopPct + 15 < timePercent);
                        
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-lg p-2.5 shadow-sm">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                               <span>Tiến độ SOP ({stats.durationDays} ngày)</span>
                               <span className={behind ? 'text-red-500' : 'text-emerald-600'}>{sopPct}% ({sopDone}/48)</span>
                             </div>
                             <ProgressBar percent={sopPct} tone={behind ? 'red' : 'green'} />
                             
                             <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                               <span>{stats.startDate ? formatDateVN(stats.startDate) : '--'}</span>
                               <span className="text-slate-700 dark:text-slate-300 font-bold">{handoverDate ? formatDateVN(handoverDate) : '--'}</span>
                             </div>
                             
                             {behind && <div className="text-[9px] text-red-500 mt-1.5 font-medium text-right">⚠ SOP đang chậm hơn thời gian</div>}
                          </div>
                        )
                     })()}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
