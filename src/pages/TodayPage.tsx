import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseSheetData, SheetStats } from '../domain/sheetParser';
import { ExternalLink, RefreshCw, CheckCircle2, Plus, X, Users, Activity, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { Badge, ProgressBar } from '../components/ui';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { SOPGuide } from '../components/SOPGuide';
import { MeetingScheduler } from '../components/MeetingScheduler';
import type { Customer } from '../domain/types';

function CustomerDetailModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const customer = useStore(s => s.customers.find(c => c.id === customerId));
  if (!customer) return null;
  const stats = parseSheetData(customer.sheetData);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-orange-500/20 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-orange-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div>
            <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{customer.name}</h2>
            <div className="text-xs text-slate-500 mt-1">Lịch triển khai & Quy trình Support (SOP)</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
          <MeetingScheduler customer={customer} />

          <SOPGuide customer={customer} />
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
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);

  
  const getBadgeTone = (status: string): any => {
     switch (status) {
        case 'DV-Gets': return 'red';
        case 'DV – CB Kiến Thức': return 'purple';
        case 'DV – Test AI': return 'dark-yellow';
        case 'DV – Actual Run': return 'dark-blue';
        case 'DV – Done': return 'green';
        default: return 'slate';
     }
  };

  const getCustomerStatus = (stats: SheetStats) => {
     const getStatus = (name: string) => {
       const m = stats.milestones.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
       return m ? m.status.toLowerCase() : '';
     };

     const isDone = (s: string) => s.includes('hoàn thành') || s.includes('xong');
     const isDoing = (s: string) => s.includes('đang thực hiện') || isDone(s);

     const nghiemThuStatus = getStatus('nghiệm thu');
     const kickOffStatus = getStatus('kick-off') || getStatus('kick off');
     const setupStatus = getStatus('setup & test') || getStatus('setup') || getStatus('set ai');
     const vanHanhStatus = getStatus('vận hành') || getStatus('actual run');
     const buoi3Status = getStatus('buổi 3');

     if (isDone(nghiemThuStatus) || isDone(buoi3Status)) return "DV – Done";
     if (isDoing(vanHanhStatus)) return "DV – Actual Run";
     if (isDoing(setupStatus)) return "DV – Test AI";
     if (isDone(kickOffStatus)) return "DV – CB Kiến Thức";
     
     return "DV-Gets";
  };

  const forceSync = async (c: Customer) => {
    if (!settings.googleScriptUrl || !c.sheetLink) return;
    const match = c.sheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) { alert('Link Google Sheet không đúng định dạng!'); return; }
    
    setSyncing(c.id);
    try {
      const res = await fetch(`${settings.googleScriptUrl}?id=${match[1]}`);
      const data = await res.json();
      if (data.success && data.data) {
         const newStats = parseSheetData(data.data);
         const isDone = getCustomerStatus(newStats) === "DV – Done";
         
         const updates: Partial<Customer> = { 
           sheetData: data.data,
           lastSheetSync: new Date().toISOString()
         };
         
         if (isDone && !c.completedAt) {
           updates.completedAt = new Date().toISOString();
         } else if (!isDone) {
           updates.completedAt = undefined;
         }
         
         useStore.getState().updateCustomer(c.id, updates);
      } else {
         alert('Lỗi từ Google Sheet: ' + (data.error || 'Unknown'));
      }
    } catch(e) {
      alert('Lỗi kết nối đồng bộ mạng!');
    }
    setSyncing(null);
  };

  const addDays = (dateStr: string | null, days: number) => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return null;
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  const getRemainingDays = (dateStr: string | null, fromDateStr?: string | null) => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return null;
    const from = fromDateStr ? new Date(fromDateStr) : new Date();
    from.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    return Math.round((target.getTime() - from.getTime()) / 86400000);
  };
  
  const formatDateVN = (dateStr: string | null) => {
     if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr || '---';
     const [y, m, d] = dateStr.split('-');
     return `${d}/${m}/${y}`;
  };

  const getTimeProgress = (startStr: string | null, endStr: string | null) => {
     if (!startStr || !endStr) return 0;
     const start = new Date(startStr).getTime();
     const end = new Date(endStr).getTime();
     const now = new Date().getTime();
     if (now <= start) return 0;
     if (now >= end) return 100;
     return Math.round(((now - start) / (end - start)) * 100);
  };

  const total = customers.length;
  const completedCount = customers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) === "DV – Done").length;
  const inProgressCount = total - completedCount;

  const renderTable = (list: Customer[], emptyMessage: string, isCompletedSection = false) => (
    <div className="card overflow-x-auto mb-8">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
          <tr>
            <th className="p-3 font-medium min-w-[200px]">Khách hàng</th>
            <th className="p-3 font-medium min-w-[250px]">Tiến độ các buổi (Lịch trình)</th>
            <th className="p-3 font-medium min-w-[250px]">Tiến độ nghiệm thu</th>
            <th className="p-3 font-medium min-w-[130px]">Đồng bộ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map(c => {
            const stats = parseSheetData(c.sheetData);
            const isSyncing = syncing === c.id;
            
            const handoverDate = addDays(stats.startDate, stats.durationDays);
            const currentStatus = getCustomerStatus(stats);
            
            const isDone = currentStatus === "DV – Done";
            const targetComputeDate = isDone && c.completedAt ? c.completedAt : null;
            const remainingDays = getRemainingDays(handoverDate, targetComputeDate);
            
            const timePercent = getTimeProgress(stats.startDate, handoverDate);
            
            const mKickoff = stats.milestones.find(m => m.name.toLowerCase().includes('kick-off') || m.name.toLowerCase().includes('kick off'));
            const mBuoi2 = stats.milestones.find(m => m.name.toLowerCase().includes('buổi 2'));
            const mBuoi3 = stats.milestones.find(m => m.name.toLowerCase().includes('buổi 3'));

            const MilestoneRow = ({ name, m }: { name: string, m?: {start: string, end: string, status: string} }) => {
               if (!m) return null;
               const mIsDone = m.status.toLowerCase().includes('hoàn thành');
               const mIsDoing = m.status.toLowerCase().includes('đang thực hiện');
               return (
                 <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium w-16">{name}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDateVN(m.start || m.end)}</span>
                    </div>
                    <Badge tone={mIsDone ? 'green' : mIsDoing ? 'orange' : 'slate'}>{m.status || 'Trống'}</Badge>
                 </div>
               );
            };
            
            return (
              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-3 align-top">
                  <button onClick={() => setDetailCustomerId(c.id)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-left">
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
                  
                  <div className="mt-3">
                    <button onClick={() => setDetailCustomerId(c.id)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
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
                </td>
                
                <td className="p-3 align-top">
                   <div className="flex flex-col gap-1.5 text-xs w-full max-w-[240px]">
                     <MilestoneRow name="Kick-off" m={mKickoff} />
                     <MilestoneRow name="Buổi 2" m={mBuoi2} />
                     <MilestoneRow name="Buổi 3" m={mBuoi3} />
                   </div>
                </td>

                <td className="p-3 align-top">
                   <div className={`flex flex-col gap-2 w-full max-w-[240px] p-3 rounded border ${isCompletedSection ? 'bg-emerald-50/50 border-emerald-100' : 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-600 font-medium">Trạng thái:</span>
                       <Badge tone={getBadgeTone(currentStatus)}>{currentStatus}</Badge>
                     </div>
                     <div className="flex justify-between items-center text-xs mt-0.5">
                       <span className="text-slate-600 font-medium">Gói dịch vụ:</span>
                       <Badge tone="slate">{stats.durationDays} ngày</Badge>
                     </div>
                     <div className={`border-t my-1 ${isCompletedSection ? 'border-emerald-200' : 'border-indigo-100 dark:border-indigo-800'}`}></div>
                     
                     <div className="flex justify-between items-center text-xs">
                       <span className={`font-bold ${isCompletedSection ? 'text-emerald-700' : 'text-indigo-700 dark:text-indigo-400'}`}>Ngày nghiệm thu:</span>
                       <span className={`font-bold text-sm ${isCompletedSection ? 'text-emerald-800' : 'text-indigo-800 dark:text-indigo-300'}`}>
                         {handoverDate ? formatDateVN(handoverDate) : '---'}
                       </span>
                     </div>

                     {isCompletedSection && remainingDays !== null && (
                        <div className="mt-1 pt-1 border-t border-emerald-200/50">
                           <div className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              <span className="font-semibold text-emerald-700">
                                 {remainingDays > 0 ? `Hoàn thành sớm ${remainingDays} ngày!` : remainingDays < 0 ? `Hoàn thành trễ ${-remainingDays} ngày` : `Hoàn thành đúng hạn`}
                              </span>
                           </div>
                        </div>
                     )}

                     {!isCompletedSection && (
                       <div className="mt-1">
                         <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                           <span>{stats.startDate ? formatDateVN(stats.startDate) : ''}</span>
                           <span>{timePercent}%</span>
                         </div>
                         <ProgressBar 
                           percent={timePercent} 
                           tone={remainingDays !== null && remainingDays < 0 ? 'red' : 'indigo'} 
                         />
                         {remainingDays !== null && (
                           <div className="flex justify-end items-center gap-1 mt-1.5">
                             <Clock size={12} className={remainingDays < 0 ? "text-red-500" : remainingDays <= 5 ? "text-amber-500" : "text-emerald-500"} />
                             <span className={`text-[11px] font-bold ${remainingDays < 0 ? 'text-red-600' : remainingDays <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                               {remainingDays < 0 ? `Quá hạn ${-remainingDays} ngày` : remainingDays === 0 ? "Hạn cuối là hôm nay" : `Còn lại ${remainingDays} ngày`}
                             </span>
                           </div>
                         )}
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
                        className="flex items-center justify-center gap-1 text-[11px] w-20 py-1.5 rounded font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
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

  const activeCustomers = customers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) !== "DV – Done");
  const completedList = customers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) === "DV – Done");

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
            Khách hàng đã hoàn thành (DV – Done)
          </h2>
          {renderTable(completedList, "Chưa có khách hàng nào hoàn thành.", true)}
        </div>
      )}
      
      {addOpen && <CustomerFormModal onClose={() => setAddOpen(false)} />}
      {detailCustomerId && <CustomerDetailModal customerId={detailCustomerId} onClose={() => setDetailCustomerId(null)} />}
    </div>
  );
}
