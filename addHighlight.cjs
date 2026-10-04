const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

const originalBtn = `<button onClick={() => setDetailCustomerId(c.id)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                      <CalendarDays size={12} /> Xem lộ trình & Ghi chú
                    </button>
                  </div>
                </td>`;

const replaceBtn = `<button onClick={() => setDetailCustomerId(c.id)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                      <CalendarDays size={12} /> Xem lộ trình & Ghi chú
                    </button>
                  </div>
                  
                  {(() => {
                    const nowTime = new Date().getTime();
                    const upcomingMeetings = (c.meetingNotes || [])
                       .filter(m => new Date(m.date).getTime() >= nowTime - (12 * 3600000))
                       .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const nextMeeting = upcomingMeetings[0];
                    if (!nextMeeting) return null;
                    return (
                       <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-2 rounded flex flex-col gap-1 w-full max-w-[200px]">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                             <Clock size={12} /> Lịch hẹn sắp tới
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                             {new Date(nextMeeting.date).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}: {nextMeeting.note}
                          </span>
                          {upcomingMeetings.length > 1 && (
                             <span className="text-[10px] text-amber-600 dark:text-amber-500 italic mt-0.5">
                                + {upcomingMeetings.length - 1} lịch hẹn khác...
                             </span>
                          )}
                       </div>
                    );
                  })()}
                </td>`;

c = c.replace(
  '<button onClick={() => setDetailCustomerId(c.id)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">\n                      <CalendarDays size={12} /> Xem lộ trình chi tiết\n                    </button>\n                  </div>\n                </td>',
  replaceBtn
);

c = c.replace(
  '<button onClick={() => setDetailCustomerId(c.id)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">\n                      <CalendarDays size={12} /> Xem lộ trình & Ghi chú\n                    </button>\n                  </div>\n                </td>',
  replaceBtn
);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
