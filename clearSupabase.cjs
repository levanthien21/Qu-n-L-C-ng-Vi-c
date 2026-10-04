const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nccbtvknetlnnakpsnvr.supabase.co';
const supabaseKey = 'sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clear() {
  await supabase.from('app_data').delete().eq('id', 'global');
  console.log("Cleared");
}
clear();
