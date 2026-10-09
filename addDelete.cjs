const fs = require('fs');
let c = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

c = c.replace(/const isGlobal = localStorage\.getItem\('dvhl_workspace'\) === 'thienbbh';/, `const isGlobal = localStorage.getItem('dvhl_workspace') === 'thienbbh';
  
  const handleDeleteColleague = async (id: string) => {
    if (id === 'thienbbh') return alert('Không thể xóa chính bạn!');
    if (!window.confirm('Bạn có chắc chắn muốn xóa không gian làm việc này? Toàn bộ dữ liệu của họ sẽ bị xóa vĩnh viễn!')) return;
  
    const url = (import.meta as any).env.VITE_SUPABASE_URL + '/rest/v1/app_data?id=eq.' + encodeURIComponent(id);
    const headers = {
      apikey: (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (import.meta as any).env.VITE_SUPABASE_ANON_KEY
    };
    
    try {
       const res = await fetch(url, { method: 'DELETE', headers });
       if (res.ok) {
         setAdminStats(prev => prev.filter(s => s.id !== id));
         alert('Đã xóa thành công không gian làm việc: ' + id);
       } else {
         alert('Xóa thất bại: ' + res.statusText);
       }
    } catch(e) {
       alert('Lỗi kết nối khi xóa!');
    }
  };`);

c = c.replace(/<th className="p-2.5 font-semibold text-emerald-600 rounded-tr-lg">Đã hoàn thành<\/th>/, `<th className="p-2.5 font-semibold text-emerald-600">Đã hoàn thành</th>
                     <th className="p-2.5 font-semibold text-red-600 rounded-tr-lg">Hành động</th>`);

c = c.replace(/<td className="p-2.5 font-medium text-emerald-600">\{s\.done\} KH<\/td>/, `<td className="p-2.5 font-medium text-emerald-600">{s.done} KH</td>
                       <td className="p-2.5 text-right">
                         {s.id !== 'thienbbh' && (
                           <button onClick={() => handleDeleteColleague(s.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-semibold">
                             Xóa bỏ
                           </button>
                         )}
                       </td>`);
                       
// Also fix colSpan
c = c.replace(/colSpan=\{4\}/, 'colSpan={5}');

fs.writeFileSync('src/pages/SettingsPage.tsx', c, 'utf8');
