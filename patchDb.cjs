require('dotenv').config();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function patchDb() {
  const url = `${SUPABASE_URL}/rest/v1/app_data?select=*`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  
  if (Array.isArray(data)) {
    for (const row of data) {
       const settings = row.data?.settings || {};
       let changed = false;
       if (!settings.googleScriptUrl) { settings.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbx7jw3ZTcMh0t6ROz4wL6kYsVnvBzj_RPxZZh9HAhMGfACUcFL3ZXrxjv0AME17O6I/exec'; changed = true; }
       if (!settings.telegramToken) { settings.telegramToken = '8810340638:AAGooPsfR68rBQIVDhJjwtreNvQxq6gEt9I'; changed = true; }
       if (!settings.telegramChatId) { settings.telegramChatId = '8770897961'; changed = true; }
       if (settings.telegramNotifyProgress === undefined) { settings.telegramNotifyProgress = true; changed = true; }
       if (settings.telegramNotifyMeetings === undefined) { settings.telegramNotifyMeetings = true; changed = true; }
       
       if (changed) {
          row.data.settings = settings;
          await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ id: row.id, data: row.data })
          });
          console.log(`Patched settings for ${row.id}`);
       }
    }
  }
}
patchDb().catch(console.error);
