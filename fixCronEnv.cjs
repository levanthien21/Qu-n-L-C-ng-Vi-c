const fs = require('fs');
let c = fs.readFileSync('api/cron.ts', 'utf8');
c = c.replace(
  'const supabaseUrl = process.env.VITE_SUPABASE_URL;',
  'const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://nccbtvknetlnnakpsnvr.supabase.co";'
);
c = c.replace(
  'const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;',
  'const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ipeOUgEM0W09kvBmcKFQ_Q_4_3W-bCH";'
);
fs.writeFileSync('api/cron.ts', c, 'utf8');
