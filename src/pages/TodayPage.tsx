import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseSheetData } from '../domain/sheetParser';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Plus, X, Users, Activity, CheckCircle } from 'lucide-react';
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
          <div className="space-y-6">
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
                        <span className={`text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
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
  const updateCustomer = useStore((s) => s.updateCustomer);
  const [addOpen, setAddOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const forceSync = async (c: Customer) => {
    if (!settings.googleScriptUrl || !c.sheetLink) return;
    const match = c.sheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) { alert('Link Google Sheet không đúng định dạng!'); return; }
    
    setSyncing(c.id);
    try {
      const res = await fetch(`${settings.googleScriptUrl}?id=${match[1]}`);
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

  const total = customers.length;
  const completed = customers.filter(c => parseSheetData(c.sheetData).percent === 100).length;
  const inProgress = total - completed;

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

      {/* Thống kê */}
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
            <div className="text-2xl font-bold">{inProgress}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Đã hoàn thành</div>
            <div className="text-2xl font-bold">{completed}</div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="p-3 font-medium min-w-[200px]">Khách hàng / Doanh nghiệp</th>
              <th className="p-3 font-medium">Lộ trình (Tiến độ)</th>
              <th className="p-3 font-medium min-w-[180px]">Việc trễ hạn (30 ngày)</th>
              <th className="p-3 font-medium">Deadline</th>
              <th className="p-3 font-medium">Ngày nghiệm thu</th>
              <th className="p-3 font-medium min-w-[130px]">Đồng bộ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map(c => {
              const stats = parseSheetData(c.sheetData);
              const isDanger = stats.overdueTasks.length > 0;
              const isSyncing = syncing === c.id;
              
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
                    <div className="flex items-center justify-between mb-1 w-32">
                      <span className="text-xs font-semibold">{stats.percent}%</span>
                      <span className="text-[10px] text-slate-500">{stats.completedTasks} / {stats.totalTasks} việc</span>
                    </div>
                    <div className="w-32">
                      <ProgressBar percent={stats.percent} tone={isDanger ? 'red' : 'indigo'} />
                    </div>
                  </td>

                  <td className="p-3 align-top">
                    {stats.overdueTasks.length > 0 ? (
                      <ul className="space-y-1">
                        {stats.overdueTasks.map((t, i) => (
                          <li key={i} className="text-xs text-red-600 dark:text-red-400 flex gap-1">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      stats.totalTasks > 0 ? (
                         <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                           <CheckCircle2 size={12} /> Không trễ
                         </span>
                      ) : (
                         <span className="text-xs text-slate-400">—</span>
                      )
                    )}
                  </td>

                  <td className="p-3 align-top">
                    <input 
                      type="date" 
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-transparent w-[110px]"
                      value={c.endDate || ''}
                      onChange={(e) => updateCustomer(c.id, { endDate: e.target.value })}
                    />
                  </td>

                  <td className="p-3 align-top">
                    <input 
                      type="date" 
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-transparent w-[110px]"
                      value={c.handoverDate || ''}
                      onChange={(e) => updateCustomer(c.id, { handoverDate: e.target.value })}
                    />
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
                          className="flex items-center justify-center gap-1 text-[11px] w-20 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
                        >
                          <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} /> 
                          {isSyncing ? 'Đang lấy...' : 'Đồng bộ'}
                        </button>
                        <button 
                          onClick={() => window.confirm('Bạn có chắc muốn xóa khách hàng này?') && useStore.getState().deleteCustomer(c.id)}
                          className="flex items-center justify-center gap-1 text-[11px] w-12 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                   Chưa có khách hàng nào. <button onClick={() => setAddOpen(true)} className="text-indigo-600 underline">Thêm khách hàng ngay</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {addOpen && <CustomerFormModal onClose={() => setAddOpen(false)} />}
      {detailCustomer && <CustomerDetailModal customer={detailCustomer} onClose={() => setDetailCustomer(null)} />}
    </div>
  );
}
