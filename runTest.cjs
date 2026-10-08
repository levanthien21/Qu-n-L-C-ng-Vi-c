const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nccbtvknetlnnakpsnvr.supabase.co';
const supabaseKey = 'sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('app_data').select('*').eq('id', 'global').single();
  if (error || !data) { console.log('Fetch error', error); return; }
  
  const appData = data.data;
  const cust = appData.customers[0];
  
  // Calculate time 15 minutes from now in Vietnam time
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15);
  // Convert to Vietnam time
  const vnTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${vnTime.getFullYear()}-${pad(vnTime.getMonth()+1)}-${pad(vnTime.getDate())}T${pad(vnTime.getHours())}:${pad(vnTime.getMinutes())}`;
  
  console.log("Injecting meeting at:", dateStr);
  
  const dummyMeeting = {
    id: 'ai_test_123',
    date: dateStr,
    note: 'Lịch hẹn giả lập do AI tự động test hệ thống',
    type: 'test',
    notified: false,
    notified10: false,
    done: false
  };
  
  cust.meetingNotes = cust.meetingNotes || [];
  cust.meetingNotes.push(dummyMeeting);
  
  await supabase.from('app_data').upsert({ id: 'global', data: appData });
  
  console.log("Triggering Vercel Cron API...");
  const res = await fetch('https://dvhl-support-manager.vercel.app/api/cron');
  const text = await res.text();
  console.log("Cron Response:", text);
  
  console.log("Cleaning up...");
  cust.meetingNotes = cust.meetingNotes.filter(m => m.id !== 'ai_test_123');
  await supabase.from('app_data').upsert({ id: 'global', data: appData });
  console.log("Done");
}
run();
