const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nccbtvknetlnnakpsnvr.supabase.co';
const supabaseKey = 'sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.from('app_data').upsert({ id: 'global', data: { test: true } });
  console.log("Upsert error:", error);
  const { data, error: err2 } = await supabase.from('app_data').select('*');
  console.log("Select data:", data, "error:", err2);
}
check();
