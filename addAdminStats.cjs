const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

if (!c.includes('import { useState, useEffect }')) {
  c = c.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\nimport { useState, useEffect } from 'react';");
}

const componentStartRegex = /export default function SettingsPage\(\) \{/;
c = c.replace(componentStartRegex, `export default function SettingsPage() {
  const isGlobal = localStorage.getItem('dvhl_workspace') === 'global';
  const [adminStats, setAdminStats] = useState<any[]>([]);
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);

  useEffect(() => {
    if (isGlobal) {
       setLoadingAdminStats(true);
       const url = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/app_data?select=id,data';
       const headers = {
         apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
         Authorization: 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
       };
       fetch(url, { headers })
         .then(res => res.json())
         .then(data => {
            if (Array.isArray(data)) {
               const s = data.map(row => {
                  const customers = row.data?.customers || [];
                  // We don't have getCustomerStatus easily available here without importing sheetParser
                  // Let's just do a rough estimate: check completedAt or manualStatus
                  const done = customers.filter((c: any) => c.manualStatus === 'DV – Done' || c.completedAt).length;
                  const active = customers.length - done;
                  return { id: row.id, total: customers.length, active, done };
               });
               setAdminStats(s);
            }
         })
         .catch(e => console.error(e))
         .finally(() => setLoadingAdminStats(false));
    }
  }, [isGlobal]);
`);

const adminSection = `
      {isGlobal && (
        <section className="card p-4 border-indigo-100 bg-indigo-50/30">
          <h2 className="section-title text-indigo-700 flex items-center gap-2">
            👑 Quản trị viên (Thống kê đồng nghiệp)
          </h2>
          <p className="text-xs text-indigo-500 mb-3">Tính năng này chỉ hiển thị riêng cho mã "global". Dùng để theo dõi tình hình sử dụng của các đồng nghiệp.</p>
          
          {loadingAdminStats ? (
             <p className="text-sm text-slate-500 animate-pulse">Đang tải dữ liệu...</p>
          ) : (
             <div className="overflow-x-auto mt-2">
               <table className="w-full text-left text-sm">
                 <thead className="bg-indigo-100/70 text-indigo-800">
                   <tr>
                     <th className="p-2.5 font-semibold rounded-tl-lg">Mã không gian</th>
                     <th className="p-2.5 font-semibold">Tổng Khách hàng</th>
                     <th className="p-2.5 font-semibold text-orange-600">Đang triển khai</th>
                     <th className="p-2.5 font-semibold text-emerald-600 rounded-tr-lg">Đã hoàn thành</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-indigo-100/50">
                   {adminStats.map(s => (
                     <tr key={s.id} className="hover:bg-white/50 transition-colors">
                       <td className="p-2.5 font-bold text-slate-700">{s.id === 'global' ? 'Tôi (global)' : s.id}</td>
                       <td className="p-2.5 font-medium text-slate-600">{s.total} KH</td>
                       <td className="p-2.5 font-medium text-orange-600">{s.active} KH</td>
                       <td className="p-2.5 font-medium text-emerald-600">{s.done} KH</td>
                     </tr>
                   ))}
                   {adminStats.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-4 text-center text-slate-500">Chưa có dữ liệu.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          )}
        </section>
      )}
`;

c = c.replace('      <section className="card p-4 border-red-100 bg-red-50/30">', adminSection + '\n      <section className="card p-4 border-red-100 bg-red-50/30">');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
