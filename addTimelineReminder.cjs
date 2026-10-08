const fs = require('fs');
let c = fs.readFileSync('api/cron.ts', 'utf8');

const injection = `
    const vnDateObj = new Date(now + 7 * 3600000);
    const currentDateStr = \`\${vnDateObj.getUTCFullYear()}-\${String(vnDateObj.getUTCMonth()+1).padStart(2,'0')}-\${String(vnDateObj.getUTCDate()).padStart(2,'0')}\`;
    const tomorrowObj = new Date(now + 7 * 3600000 + 86400000);
    const tomorrowDateStr = \`\${tomorrowObj.getUTCFullYear()}-\${String(tomorrowObj.getUTCMonth()+1).padStart(2,'0')}-\${String(tomorrowObj.getUTCDate()).padStart(2,'0')}\`;

    if (settings.lastTimelineReminder !== currentDateStr) {
       // We need to generate a daily report
       let reportLines: string[] = [];
       
       for (const c of customers) {
          if (!c.sheetData) continue;
          const milestones = parseMilestones(c.sheetData);
          for (const m of milestones) {
             const mIsDone = (m.status || '').toLowerCase().includes('hoàn thành');
             if (mIsDone) continue;
             
             if (m.start === currentDateStr || m.end === currentDateStr) {
                reportLines.push(\`🔸 <b>\${c.name}</b>: \${m.name} (Hôm nay)\`);
             } else if (m.start === tomorrowDateStr || m.end === tomorrowDateStr) {
                reportLines.push(\`🔹 <b>\${c.name}</b>: \${m.name} (Ngày mai)\`);
             }
          }
       }
       
       if (reportLines.length > 0) {
          const msg = \`📅 <b>BÁO CÁO LỘ TRÌNH TRIỂN KHAI</b>\\n\\n\` + reportLines.join('\\n');
          await sendTelegram(token, chatId, msg);
       }
       
       settings.lastTimelineReminder = currentDateStr;
       hasUpdates = true;
    }
`;

const helpers = `
function parseMilestones(data: any): any[] {
  const milestones: any[] = [];
  if (!data || Object.keys(data).length === 0) return milestones;

  const formatDate = (rawDate: any): string => {
    if (!rawDate) return '';
    if (typeof rawDate === 'string') {
      if (rawDate.match(/^\\d{4}-\\d{2}-\\d{2}T/)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        }
      }
      if (rawDate.match(/^\\d{4}-\\d{2}-\\d{2}/)) {
        return rawDate.substring(0, 10);
      }
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) return \`\${parts[2]}-\${parts[1].padStart(2, '0')}-\${parts[0].padStart(2, '0')}\`;
      }
    }
    return String(rawDate);
  };

  const timeline = data['Timeline 30 ngày '] || data['Timeline 30 ngày'] || data['Timeline 14 ngày '] || data['Timeline 14 ngày'];
  if (timeline && timeline.length > 0) {
    let mIdx = timeline.findIndex((r: any[]) => String(r[0]).trim() === 'Giai đoạn' && String(r[1]).trim() === 'Bắt đầu');
    if (mIdx >= 0) {
      for (let i = mIdx + 1; i < mIdx + 15; i++) {
        if (!timeline[i] || !timeline[i][0]) break;
        const mName = String(timeline[i][0]).trim();
        const mStart = formatDate(timeline[i][1]);
        const mEnd = formatDate(timeline[i][2]);
        const mStatus = String(timeline[i][4] || '').trim();
        
        if (mName) {
           milestones.push({ name: mName, start: mStart, end: mEnd, status: mStatus });
        }
      }
    }
  }
  return milestones;
}
`;

c = c.replace(
  'const now = Date.now();\n    let hasUpdates = false;',
  'const now = Date.now();\n    let hasUpdates = false;\n' + injection
);

c += '\n' + helpers;

fs.writeFileSync('api/cron.ts', c, 'utf8');
