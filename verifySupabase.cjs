const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nccbtvknetlnnakpsnvr.supabase.co';
const supabaseKey = 'sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('app_data').select('*').limit(1);
  console.log("Error:", error?.message || 'No error');
  console.log("Data:", data);
}
check();
