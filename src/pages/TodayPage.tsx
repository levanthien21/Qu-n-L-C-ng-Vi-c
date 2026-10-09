import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseSheetData, SheetStats } from '../domain/sheetParser';
import { Search, Filter, ExternalLink, RefreshCw, CheckCircle2, Plus, X, Users, Activity, CheckCircle, Clock, CalendarDays } from 'lucide-react';
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
        
        <div className="pl-4 pr-1.5 py-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [urgency, setUrgency] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");

  
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

  const calcRemaining = (c: Customer) => {
    const st = parseSheetData(c.sheetData);
    const done = getCustomerStatus(st) === "DV – Done";
    const hd = addDays(st.startDate, st.durationDays);
    return getRemainingDays(hd, done && c.completedAt ? c.completedAt : null);
  };

  const hasUpcomingMeeting = (c: Customer) =>
    (c.meetingNotes || []).some(m => !m.done && new Date(m.date).getTime() >= Date.now() - 12 * 3600000);

  const baseFiltered = customers.filter(c => {
    const stats = parseSheetData(c.sheetData);
    const status = getCustomerStatus(stats);
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || status === filterStatus;
    const rem = calcRemaining(c);
    const isDoneC = status === "DV – Done";
    let matchUrgency = true;
    if (urgency === 'overdue') matchUrgency = !isDoneC && rem !== null && rem < 0;
    else if (urgency === 'soon') matchUrgency = !isDoneC && rem !== null && rem >= 0 && rem <= 5;
    else if (urgency === 'meeting') matchUrgency = hasUpcomingMeeting(c);
    return matchSearch && matchStatus && matchUrgency;
  });

  const filteredCustomers = [...baseFiltered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
    if (sortBy === 'deadline') {
      const ra = calcRemaining(a); const rb = calcRemaining(b);
      return (ra === null ? 9999 : ra) - (rb === null ? 9999 : rb);
    }
    return 0;
  });

  const statusCounts: Record<string, number> = {};
  customers.forEach(c => {
    const s = getCustomerStatus(parseSheetData(c.sheetData));
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const overdueCount = customers.filter(c => { const r = calcRemaining(c); return getCustomerStatus(parseSheetData(c.sheetData)) !== "DV – Done" && r !== null && r < 0; }).length;
  const soonCount = customers.filter(c => { const r = calcRemaining(c); return getCustomerStatus(parseSheetData(c.sheetData)) !== "DV – Done" && r !== null && r >= 0 && r <= 5; }).length;
  const meetingCount = customers.filter(hasUpcomingMeeting).length;

  const total = filteredCustomers.length;
  const completedCount = filteredCustomers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) === "DV – Done").length;
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
                  <button onClick={() => setDetailCustomerId(c.id)} className="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline text-left transition-colors">
                    {c.name}
                  </button>
                  <div className="text-sm font-medium text-slate-500 mt-1">{c.industry || 'Chưa phân loại'}</div>
                  {c.sheetLink ? (
                    <a href={c.sheetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1">
                      Mở File Sheet <ExternalLink size={10} />
                    </a>
                  ) : (
                    <div className="text-xs text-red-500 mt-1">⚠️ Chưa dán link Sheet</div>
                  )}
                  
                  <div className="mt-3">
                    <button onClick={() => setDetailCustomerId(c.id)} className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
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
                   <div className="w-full max-w-[250px]">
                     <div className="flex items-center justify-between mb-2.5">
                       <Badge tone={getBadgeTone(currentStatus)}>{currentStatus}</Badge>
                       {!isCompletedSection && remainingDays !== null && (() => {
                          const overdue = remainingDays < 0;
                          const urgent = !overdue && remainingDays <= 5;
                          const notice = !overdue && !urgent && remainingDays <= 10;
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${overdue ? 'bg-red-50 text-red-600 border-red-200' : urgent ? 'bg-orange-50 text-orange-600 border-orange-200' : notice ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                               {overdue ? `Trễ ${-remainingDays} ngày` : remainingDays === 0 ? 'Hạn hôm nay' : `Còn ${remainingDays} ngày`}
                            </span>
                          )
                       })()}
                       {isCompletedSection && remainingDays !== null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                             {remainingDays > 0 ? `Sớm ${remainingDays} ngày` : remainingDays < 0 ? `Trễ ${-remainingDays} ngày` : 'Đúng hạn'}
                          </span>
                       )}
                     </div>

                     {(() => {
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
                     })()}
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

  const activeCustomers = filteredCustomers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) !== "DV – Done");
  const completedList = filteredCustomers.filter(c => getCustomerStatus(parseSheetData(c.sheetData)) === "DV – Done");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">Bảng điều khiển trung tâm <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Đồng bộ từ Google Sheet</span></h1>
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

      <div className="card p-3 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] w-full">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên khách, ngành hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 w-full text-sm"
          />
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative">
            <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="input pl-8 py-2 text-sm bg-slate-50 cursor-pointer hover:bg-white appearance-none pr-8"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {['DV-Gets', 'DV – CB Kiến Thức', 'DV – Test AI', 'DV – Actual Run', 'DV – Done'].map(s => (
                <option key={s} value={s}>{s} ({statusCounts[s] || 0})</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Clock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={urgency} 
              onChange={(e) => setUrgency(e.target.value)} 
              className="input pl-8 py-2 text-sm bg-slate-50 cursor-pointer hover:bg-white appearance-none pr-8"
            >
              <option value="ALL">Mức độ gấp: Tất cả</option>
              <option value="overdue">🔥 Quá hạn ({overdueCount})</option>
              <option value="soon">⏰ Sắp đến hạn ({soonCount})</option>
              <option value="meeting">📅 Có lịch hẹn ({meetingCount})</option>
            </select>
          </div>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="input py-2 text-sm bg-slate-50 cursor-pointer hover:bg-white w-[160px]"
          >
            <option value="default">Mặc định</option>
            <option value="deadline">Gần hạn nhất</option>
            <option value="name">Tên A → Z</option>
          </select>

          {(searchTerm || filterStatus !== 'ALL' || urgency !== 'ALL' || sortBy !== 'default') && (
            <button 
              className="btn-secondary px-3 py-2 shrink-0 text-sm" 
              onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); setUrgency('ALL'); setSortBy('default'); }}
              title="Xóa bộ lọc"
            >
              <X size={16} />
            </button>
          )}
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
