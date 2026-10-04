import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseSheetData } from '../domain/sheetParser';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { ProgressBar, Badge } from '../components/ui';
import { CustomerFormModal } from '../components/CustomerFormModal';

export default function TodayPage() {
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
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

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="p-3 font-medium">Khách hàng / Doanh nghiệp</th>
              <th className="p-3 font-medium">Giai đoạn hiện tại</th>
              <th className="p-3 font-medium w-48">Tiến độ (Lộ trình triển khai)</th>
              <th className="p-3 font-medium min-w-[200px]">Việc trễ hạn (Timeline 30 ngày)</th>
              <th className="p-3 font-medium">Đồng bộ gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map(c => {
              const stats = parseSheetData(c.sheetData);
              const isDanger = stats.overdueTasks.length > 0;
              
              return (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-3 align-top">
                    <Link to={`/khach-hang/${c.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1">{c.industry || 'Chưa phân loại'}</div>
                    {c.sheetLink && (
                      <a href={c.sheetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:underline mt-1">
                        Mở File Google Sheet <ExternalLink size={10} />
                      </a>
                    )}
                    {!c.sheetLink && <div className="text-[11px] text-red-500 mt-1">⚠️ Chưa dán link Sheet</div>}
                  </td>
                  
                  <td className="p-3 align-top">
                    {stats.currentPhase ? (
                      <Badge tone={stats.currentPhase.includes('hoàn thành') ? 'green' : 'blue'}>
                        {stats.currentPhase}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Đang quét...</span>
                    )}
                  </td>
                  
                  <td className="p-3 align-top">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{stats.percent}%</span>
                      <span className="text-[10px] text-slate-500">{stats.completedTasks} / {stats.totalTasks} việc</span>
                    </div>
                    <ProgressBar percent={stats.percent} tone={isDanger ? 'red' : 'indigo'} />
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
                           <CheckCircle2 size={12} /> Không có việc trễ
                         </span>
                      ) : (
                         <span className="text-xs text-slate-400">—</span>
                      )
                    )}
                  </td>

                  <td className="p-3 align-top text-xs text-slate-500">
                    {c.lastSheetSync ? (
                       <div className="flex items-center gap-1">
                         <RefreshCw size={12} className="text-emerald-500" />
                         {new Date(c.lastSheetSync).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                       </div>
                    ) : (
                       <span>Chưa đồng bộ</span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                   Chưa có khách hàng nào. <button onClick={() => setAddOpen(true)} className="text-indigo-600 underline">Thêm khách hàng ngay</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {addOpen && <CustomerFormModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
