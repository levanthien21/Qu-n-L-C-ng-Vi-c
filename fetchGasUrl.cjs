require('dotenv').config();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchGasUrl() {
  const url = `${SUPABASE_URL}/rest/v1/app_data?id=eq.thienbbh&select=data`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const settings = data[0].data.settings;
    console.log("GAS URL:", settings.googleScriptUrl);
    console.log("Telegram Token:", settings.telegramToken);
    console.log("Telegram Chat ID:", settings.telegramChatId);
  }
}
fetchGasUrl().catch(console.error);
