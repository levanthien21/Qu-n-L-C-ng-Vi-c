const fs = require('fs');
const code = `import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseSheetData } from '../domain/sheetParser';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Plus, X, Users, Activity, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { ProgressBar, Badge } from '../components/ui';
import { CustomerFormModal } from '../components/CustomerFormModal';
import type { Customer } from '../domain/types';

function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const stats = parseSheetData(customer.sheetData);
  const phases = Array.from(new Set(stats.tasks.map(t => t.phase)));
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{customer.name}</h2>
            <div className="text-xs text-slate-500 mt-1">Chi tiết lộ trình triển khai ({stats.completedTasks}/{stats.totalTasks} việc - {stats.percent}%)</div>
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
                  const isDone = m.status.toLowerCase().includes('hoàn thành');
                  const isDoing = m.status.toLowerCase().includes('đang thực hiện');
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-700/30 p-2 rounded border border-slate-100 dark:border-slate-700/50">
                       <div className="flex items-center gap-2">
                         <div className="flex flex-col leading-tight">
                           <span className="font-semibold text-slate-700 dark:text-slate-200">{m.name}</span>
                           <span className="text-slate-500 text-[10px] mt-0.5">{m.start || '?'} - {m.end || '?'}</span>
                         </div>
                       </div>
                       <Badge tone={isDone ? 'green' : isDoing ? 'orange' : 'slate'}>{m.status || 'Trống'}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {phases.map((phase, idx) => {
              const phaseTasks = stats.tasks.filter(t => t.phase === phase);
              const doneTasks = phaseTasks.filter(t => t.done).length;
              const isAllDone = doneTasks === phaseTasks.length;
              
              return (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-sm">{phase || 'Không tên'}</h3>
                    <Badge tone={isAllDone ? 'green' : 'blue'}>
                      {doneTasks}/{phaseTasks.length} hoàn thành
                    </Badge>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {phaseTasks.map((t, tidx) => (
                      <li key={tidx} className="p-3 px-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <div className="mt-0.5">
                          {t.done ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                        <span className="\`text-sm \${t.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}\`">
                          {t.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            
            {phases.length === 0 && (
               <div className="text-center p-8 text-slate-500">
                  Không tìm thấy công việc nào trong sheet "Lộ trình triển khai".
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);
  const [addOpen, setAddOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const forceSync = async (c: Customer) => {
    if (!settings.googleScriptUrl || !c.sheetLink) return;
    const match = c.sheetLink.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
    if (!match) { alert('Link Google Sheet không đúng định dạng!'); return; }
    
    setSyncing(c.id);
    try {
      const res = await fetch(\`\${settings.googleScriptUrl}?id=\${match[1]}\`);
      const data = await res.json();
      if (data.success && data.data) {
         useStore.getState().updateCustomer(c.id, { 
           sheetData: data.data,
           lastSheetSync: new Date().toISOString()
         });
      } else {
         alert('Lỗi từ Google Sheet: ' + (data.error || 'Unknown'));
      }
    } catch(e) {
      alert('Lỗi kết nối đồng bộ mạng!');
    }
    setSyncing(null);
  };

  const addDays = (dateStr: string | null, days: number) => {
    if (!dateStr || !dateStr.match(/^\\d{4}-\\d{2}-\\d{2}/)) return null;
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  const getRemainingDays = (dateStr: string | null) => {
    if (!dateStr || !dateStr.match(/^\\d{4}-\\d{2}-\\d{2}/)) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  };
  
  const formatDateVN = (dateStr: string | null) => {
     if (!dateStr || !dateStr.match(/^\\d{4}-\\d{2}-\\d{2}/)) return dateStr || '---';
     const [y, m, d] = dateStr.split('-');
     return \`\${d}/\${m}/\${y}\`;
  };

  const total = customers.length;
  const completedCount = customers.filter(c => parseSheetData(c.sheetData).percent === 100).length;
  const inProgressCount = total - completedCount;

  const renderTable = (list: Customer[], emptyMessage: string) => (
    <div className="card overflow-x-auto mb-8">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
          <tr>
            <th className="p-3 font-medium min-w-[180px]">Khách hàng</th>
            <th className="p-3 font-medium min-w-[160px]">Tiến độ</th>
            <th className="p-3 font-medium min-w-[280px]">Lịch trình Nghiệm thu</th>
            <th className="p-3 font-medium min-w-[130px]">Đồng bộ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map(c => {
            const stats = parseSheetData(c.sheetData);
            const isDanger = stats.percent < 100 && stats.percent > 0;
            const isSyncing = syncing === c.id;
            
            const handoverDate = addDays(stats.startDate, stats.durationDays);
            const remainingDays = getRemainingDays(handoverDate);
            
            return (
              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-3 align-top">
                  <button onClick={() => setDetailCustomer(c)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-left">
                    {c.name}
                  </button>
                  <div className="text-xs text-slate-500 mt-1">{c.industry || 'Chưa phân loại'}</div>
                  {c.sheetLink ? (
                    <a href={c.sheetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:underline mt-1">
                      Mở File Sheet <ExternalLink size={10} />
                    </a>
                  ) : (
                    <div className="text-[11px] text-red-500 mt-1">⚠️ Chưa dán link Sheet</div>
                  )}
                </td>
                
                <td className="p-3 align-top cursor-pointer" onClick={() => setDetailCustomer(c)}>
                  <div className="mb-2">
                    {stats.currentPhase ? (
                      <Badge tone={stats.currentPhase.includes('hoàn thành') ? 'green' : 'blue'}>
                        {stats.currentPhase}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">{c.sheetData ? 'Chưa bắt đầu' : 'Đang quét...'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-1 w-full max-w-[160px]">
                    <span className="text-xs font-semibold">{stats.percent}%</span>
                    <span className="text-[10px] text-slate-500">{stats.completedTasks} / {stats.totalTasks} việc</span>
                  </div>
                  <div className="w-full max-w-[160px]">
                    <ProgressBar percent={stats.percent} tone={stats.percent === 100 ? 'green' : isDanger ? 'indigo' : 'slate'} />
                  </div>
                </td>

                <td className="p-3 align-top">
                   <div className="flex flex-col gap-2 w-full max-w-[260px] bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-100 dark:border-slate-700/50">
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 font-medium">Ngày triển khai (Kick-off):</span>
                       <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.startDate ? formatDateVN(stats.startDate) : '---'}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 font-medium">Gói dịch vụ:</span>
                       <Badge tone="slate">{stats.durationDays} ngày</Badge>
                     </div>
                     <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ngày nghiệm thu:</span>
                       <span className="font-bold text-indigo-700 dark:text-indigo-300">
                         {handoverDate ? formatDateVN(handoverDate) : '---'}
                       </span>
                     </div>
                     {remainingDays !== null && stats.percent < 100 && (
                       <div className="flex justify-end items-center gap-1 mt-0.5">
                         <Clock size={12} className={remainingDays < 0 ? "text-red-500" : remainingDays <= 5 ? "text-amber-500" : "text-emerald-500"} />
                         <span className="\`text-xs font-bold \${remainingDays < 0 ? 'text-red-600' : remainingDays <= 5 ? 'text-amber-600' : 'text-emerald-600'}\`">
                           {remainingDays < 0 ? \`Quá hạn \${-remainingDays} ngày\` : remainingDays === 0 ? "Hạn cuối là hôm nay" : \`Còn lại \${remainingDays} ngày\`}
                         </span>
                       </div>
                     )}
                   </div>
                </td>

                <td className="p-3 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <div className="text-[10px] text-slate-500">
                      {c.lastSheetSync ? (
                         <div className="flex items-center gap-1">
                           <CheckCircle2 size={10} className="text-emerald-500" />
                           {new Date(c.lastSheetSync).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                         </div>
                      ) : (
                         <span>Chưa dữ liệu</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button 
                        disabled={!c.sheetLink || isSyncing}
                        onClick={() => forceSync(c)}
                        className="flex items-center justify-center gap-1 text-[11px] w-20 py-1.5 rounded font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:opacity-50"
                      >
                        <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} /> 
                        {isSyncing ? 'Đang lấy...' : 'Đồng bộ'}
                      </button>
                      <button 
                        onClick={() => window.confirm('Bạn có chắc muốn xóa khách hàng này?') && useStore.getState().deleteCustomer(c.id)}
                        className="flex items-center justify-center gap-1 text-[11px] w-12 py-1.5 rounded font-medium bg-red-50 hover:bg-red-100 text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          
          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-500">
                 {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const activeCustomers = customers.filter(c => parseSheetData(c.sheetData).percent < 100);
  const completedList = customers.filter(c => parseSheetData(c.sheetData).percent === 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Master Dashboard (Thống kê từ Google Sheet)</h1>
        <div className="flex items-center gap-2">
          {!settings.googleScriptUrl && (
             <Link to="/cai-dat" className="text-red-500 underline text-sm font-semibold">
               ⚠️ Chưa cài đặt Cầu nối
             </Link>
          )}
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Thêm khách hàng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Tổng khách hàng</div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Đang triển khai</div>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Đã hoàn thành</div>
            <div className="text-2xl font-bold">{completedCount}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="text-amber-500" />
          Khách hàng đang triển khai
        </h2>
        {renderTable(activeCustomers, "Không có khách hàng nào đang triển khai.")}
      </div>

      {completedList.length > 0 && (
        <div className="mt-8 opacity-75 hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
            <CheckCircle className="text-emerald-500" />
            Khách hàng đã hoàn thành (Nghiệm thu)
          </h2>
          {renderTable(completedList, "Chưa có khách hàng nào hoàn thành.")}
        </div>
      )}
      
      {addOpen && <CustomerFormModal onClose={() => setAddOpen(false)} />}
      {detailCustomer && <CustomerDetailModal customer={detailCustomer} onClose={() => setDetailCustomer(null)} />}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/TodayPage.tsx', code, 'utf8');
