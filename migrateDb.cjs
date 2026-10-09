require('dotenv').config();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function migrate() {
  const url = `${SUPABASE_URL}/rest/v1/app_data?id=eq.global&select=*`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const globalData = data[0].data;
    
    const postRes = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: 'thienbbh', data: globalData })
    });
    console.log('Upsert status:', postRes.status);

    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.global`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log('Delete status:', delRes.status);
  } else {
    console.log('No global data found.');
  }
}
migrate().catch(console.error);
