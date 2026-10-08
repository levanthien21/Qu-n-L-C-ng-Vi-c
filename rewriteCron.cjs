const fs = require('fs');

const content = `import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://nccbtvknetlnnakpsnvr.supabase.co";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH";
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: row, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', 'global')
      .single();

    if (error || !row || !row.data) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    const appData = row.data as any;
    const settings = appData.settings || {};
    const customers = appData.customers || [];

    const token = settings.telegramToken;
    const chatId = settings.telegramChatId;

    if (!token || !chatId) {
      return res.status(200).json({ message: 'No telegram config' });
    }

    const now = Date.now();
    let hasUpdates = false;

    // --- TIMELINE REMINDER (ONCE A DAY) ---
    const vnDateObj = new Date(now + 7 * 3600000);
    const currentDateStr = \`\${vnDateObj.getUTCFullYear()}-\${String(vnDateObj.getUTCMonth()+1).padStart(2,'0')}-\${String(vnDateObj.getUTCDate()).padStart(2,'0')}\`;
    const tomorrowObj = new Date(now + 7 * 3600000 + 86400000);
    const tomorrowDateStr = \`\${tomorrowObj.getUTCFullYear()}-\${String(tomorrowObj.getUTCMonth()+1).padStart(2,'0')}-\${String(tomorrowObj.getUTCDate()).padStart(2,'0')}\`;

    if (settings.lastTimelineReminder !== currentDateStr) {
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

    // --- MEETING REMINDERS (EVERY MINUTE) ---
    for (const c of customers) {
      if (!c.meetingNotes) continue;
      const newNotes = c.meetingNotes.map((m: any) => {
        if (m.done) return m;
        const mTime = new Date(m.date + "+07:00").getTime();
        const diffMins = (mTime - now) / 60000;
        let shouldUpdate = false;
        const timeStr = new Date(m.date + "+07:00").toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        if (diffMins > 0 && diffMins <= 30 && !m.notified) {
          sendTelegram(token, chatId, \`⏰ [NHẮC LỊCH 30 PHÚT] Sắp tới lịch hẹn với khách hàng <b>\${c.name}</b>\\n- Thời gian: \${timeStr}\\n- Ghi chú: \${m.note || 'Không có'}\`);
          m.notified = true;
          shouldUpdate = true;
        }
        
        if (diffMins > 0 && diffMins <= 10 && !m.notified10) {
          sendTelegram(token, chatId, \`🔥 [NHẮC LỊCH 10 PHÚT] Khách hàng <b>\${c.name}</b> đã sắp đến giờ họp!\\n- Thời gian: \${timeStr}\`);
          m.notified10 = true;
          shouldUpdate = true;
        }
        
        if (shouldUpdate) hasUpdates = true;
        return m;
      });
      c.meetingNotes = newNotes;
    }

    if (hasUpdates) {
      await supabase.from('app_data').upsert({ id: 'global', data: appData });
    }

    return res.status(200).json({ success: true, updated: hasUpdates });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function sendTelegram(token: string, chatId: string, message: string) {
  const url = \`https://api.telegram.org/bot\${token}/sendMessage\`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
  }).catch(console.error);
}

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
        if (mName) milestones.push({ name: mName, start: mStart, end: mEnd, status: mStatus });
      }
    }
  }
  return milestones;
}
`;

fs.writeFileSync('api/cron.ts', content, 'utf8');
