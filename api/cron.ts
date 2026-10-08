import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
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

    for (const c of customers) {
      if (!c.meetingNotes) continue;
      
      const newNotes = c.meetingNotes.map((m: any) => {
        if (m.done) return m;
        // Fix timezone for Vercel (UTC) by appending +07:00 to the local date string
        const mTime = new Date(m.date + "+07:00").getTime();
        const diffMins = (mTime - now) / 60000;
        
        let shouldUpdate = false;
        
        const timeStr = new Date(m.date + "+07:00").toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        if (diffMins > 0 && diffMins <= 30 && !m.notified) {
          sendTelegram(token, chatId, `⏰ [NHẮC LỊCH 30 PHÚT] Sắp tới lịch hẹn với khách hàng **${c.name}**\n- Thời gian: ${timeStr}\n- Ghi chú: ${m.note || 'Không có'}`);
          m.notified = true;
          shouldUpdate = true;
        }
        
        if (diffMins > 0 && diffMins <= 10 && !m.notified10) {
          sendTelegram(token, chatId, `🔥 [NHẮC LỊCH 10 PHÚT] Khách hàng **${c.name}** đã sắp đến giờ họp!\n- Thời gian: ${timeStr}`);
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
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: message, 
      parse_mode: 'HTML' 
    })
  }).catch(console.error);
}
