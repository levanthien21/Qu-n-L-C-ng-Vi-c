import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
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
        const mTime = new Date(m.date).getTime();
        const diffMins = (mTime - now) / 60000;
        
        let shouldUpdate = false;
        
        if (diffMins > 0 && diffMins <= 30 && !m.notified) {
          sendTelegram(token, chatId, `⏰ [NHẮC LỊCH 30 PHÚT] Sắp tới lịch hẹn với khách hàng **${c.name}**\n- Thời gian: ${new Date(m.date).toLocaleString('vi-VN')}\n- Ghi chú: ${m.note || 'Không có'}`);
          m.notified = true;
          shouldUpdate = true;
        }
        
        if (diffMins > 0 && diffMins <= 10 && !m.notified10) {
          sendTelegram(token, chatId, `🔥 [NHẮC LỊCH 10 PHÚT] Khách hàng **${c.name}** đã sắp đến giờ họp!\n- Thời gian: ${new Date(m.date).toLocaleString('vi-VN')}`);
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
