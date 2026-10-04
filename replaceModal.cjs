const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

const originalModalBody = `        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
          {stats.milestones.length > 0 && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><CalendarDays size={16} className="text-indigo-500"/> Lịch triển khai (Milestones)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.milestones.map((m, i) => {
                  const mIsDone = m.status.toLowerCase().includes('hoàn thành');
                  const mIsDoing = m.status.toLowerCase().includes('đang thực hiện');
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-700/30 p-2 rounded border border-slate-100 dark:border-slate-700/50">
                       <div className="flex items-center gap-2">
                         <div className="flex flex-col leading-tight">
                           <span className="font-semibold text-slate-700 dark:text-slate-200">{m.name}</span>
                           <span className="text-slate-500 text-[10px] mt-0.5">{m.start || '?'} - {m.end || '?'}</span>
                         </div>
                       </div>
                       <Badge tone={mIsDone ? 'green' : mIsDoing ? 'orange' : 'slate'}>{m.status || 'Trống'}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <SOPGuide customer={customer} />
        </div>`;

const newModalBody = `        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
          <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
               <CalendarDays size={16} /> Lịch hẹn Meeting & Ghi chú
            </h3>
            
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {(customer.meetingNotes || []).map(m => (
                 <div key={m.id} className="flex justify-between items-start bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded border border-indigo-100 dark:border-indigo-800/50 text-sm">
                    <div>
                       <span className="font-semibold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                          {new Date(m.date).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})}
                       </span>
                       <span className="text-slate-700 dark:text-slate-300">{m.note}</span>
                    </div>
                    <button 
                       onClick={() => {
                         const updated = (customer.meetingNotes || []).filter(x => x.id !== m.id);
                         useStore.getState().updateCustomer(customer.id, { meetingNotes: updated });
                       }} 
                       className="text-red-400 hover:text-red-600 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm"
                       title="Xóa lịch hẹn"
                    >
                       <X size={14}/>
                    </button>
                 </div>
              ))}
              {!(customer.meetingNotes?.length) && <div className="text-xs text-slate-500 italic p-2 text-center">Chưa có lịch hẹn nào.</div>}
            </div>

            <form 
              onSubmit={(e) => {
                 e.preventDefault();
                 const form = e.target;
                 const d = form.mdate.value;
                 const n = form.mnote.value;
                 if(!d || !n) return;
                 const newMeeting = { id: Date.now().toString(), date: d, note: n };
                 const updated = [...(customer.meetingNotes || []), newMeeting].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                 useStore.getState().updateCustomer(customer.id, { meetingNotes: updated });
                 form.reset();
              }}
              className="flex gap-2 items-start"
            >
               <input type="datetime-local" name="mdate" required className="input text-sm w-48 bg-white dark:bg-slate-900" />
               <input type="text" name="mnote" required placeholder="Nội dung hẹn..." className="input text-sm flex-1 bg-white dark:bg-slate-900" />
               <button type="submit" className="btn-primary text-sm whitespace-nowrap"><Plus size={16}/> Thêm lịch</button>
            </form>
          </div>

          <SOPGuide customer={customer} />
        </div>`;

c = c.replace(originalModalBody, newModalBody);
fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
