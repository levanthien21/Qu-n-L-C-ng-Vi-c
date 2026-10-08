const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nccbtvknetlnnakpsnvr.supabase.co';
const supabaseKey = 'sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('app_data').select('*').eq('id', 'global').single();
  if (error || !data) { console.log('Error or empty', error); return; }
  console.log('Customers count:', data.data.customers?.length);
  if (data.data.customers?.length > 0) {
     console.log('First customer name:', data.data.customers[0].name);
     console.log('Settings telegram config:', !!data.data.settings?.telegramToken);
  }
}
check();
