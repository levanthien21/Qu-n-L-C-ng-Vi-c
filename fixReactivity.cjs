const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

// Replace detailCustomer state
c = c.replace(
  'const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);',
  'const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);'
);

// Replace setDetailCustomer(c) to setDetailCustomerId(c.id)
c = c.replace(/setDetailCustomer\(c\)/g, 'setDetailCustomerId(c.id)');
c = c.replace(/setDetailCustomer\(null\)/g, 'setDetailCustomerId(null)');

// Replace rendering modal
c = c.replace(
  '{detailCustomer && <CustomerDetailModal customer={detailCustomer} onClose={() => setDetailCustomer(null)} />}',
  '{detailCustomerId && <CustomerDetailModal customerId={detailCustomerId} onClose={() => setDetailCustomerId(null)} />}'
);

// Completely replace CustomerDetailModal
const newModal = `function CustomerDetailModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const customer = useStore(s => s.customers.find(c => c.id === customerId));
  if (!customer) return null;
  const stats = parseSheetData(customer.sheetData);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{customer.name}</h2>
            <div className="text-xs text-slate-500 mt-1">Lịch triển khai & Quy trình Support (SOP)</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
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
        </div>
      </div>
    </div>
  );
}`;

c = c.replace(/function CustomerDetailModal\([\s\S]*?export default function TodayPage/m, newModal + '\n\nexport default function TodayPage');

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
