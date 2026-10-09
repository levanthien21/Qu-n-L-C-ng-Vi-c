require('dotenv').config();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function checkDb() {
  const url = `${SUPABASE_URL}/rest/v1/app_data?select=*`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  
  if (Array.isArray(data)) {
    for (const row of data) {
       console.log(row.id, row.data?.settings?.telegramToken);
       
       if (row.id !== 'thienbbh' && row.data?.settings?.telegramToken === '8810340638:AAGooPsfR68rBQIVDhJjwtreNvQxq6gEt9I') {
         // Reset it!
         row.data.settings.telegramToken = '';
         row.data.settings.telegramChatId = '';
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
          console.log(`Reverted Telegram config for ${row.id}`);
       }
    }
  }
}
checkDb().catch(console.error);
