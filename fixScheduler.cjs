const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');

// Remove the note input
c = c.replace(
  '<input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nội dung hẹn (VD: Hướng dẫn Retion, chốt link test...)" className="input flex-1 text-sm" />',
  ''
);

// Add the Tick All button
c = c.replace(
  '<div className="space-y-2">\n          {upcoming.length === 0',
  `<div className="space-y-2">
          {upcoming.length > 0 && (
            <div className="flex justify-end mb-1">
              <button 
                type="button" 
                onClick={() => {
                   const ids = upcoming.map(u => u.id);
                   save(meetings.map(x => ids.includes(x.id) ? { ...x, done: true } : x));
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                <Check size={14} /> Đánh dấu xong tất cả
              </button>
            </div>
          )}
          {upcoming.length === 0`
);

fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
