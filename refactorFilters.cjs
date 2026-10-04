const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

// 1. Change filter UI
const filterAnchorStart = '      <div className="card p-4 space-y-3">';
const filterAnchorEnd = '        <div className="flex flex-wrap items-center gap-2">\n          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500"><Clock size={13} /> Mức độ gấp:</span>';
// find where the filter block ends
const filterEndIndex = c.indexOf('      <div className="mt-8">');
if (filterEndIndex === -1) console.log("Can't find filter block end");

const newFilterUI = `      <div className="card p-3 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-center">
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
      </div>\n\n`;

const s1 = c.indexOf(filterAnchorStart);
if (s1 !== -1 && filterEndIndex !== -1) {
   c = c.substring(0, s1) + newFilterUI + c.substring(filterEndIndex);
} else {
   console.log("Could not replace filter UI");
}

// 2. Change customer name styling
// Previous: className="text-lg font-extrabold leading-snug text-indigo-600 dark:text-indigo-400 hover:underline text-left"
const oldNameClass = 'className="text-lg font-extrabold leading-snug text-indigo-600 dark:text-indigo-400 hover:underline text-left"';
const newNameClass = 'className="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline text-left transition-colors"';
c = c.replace(oldNameClass, newNameClass);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');

