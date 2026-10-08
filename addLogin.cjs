const fs = require('fs');

const appContent = `import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TodayPage from './pages/TodayPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './store/useStore';

function WorkspaceLogin() {
  const [val, setVal] = useState('');
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👋</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Đăng nhập Không Gian</h1>
        <p className="text-sm text-slate-500 mb-6">Mỗi nhân viên có một mã không gian làm việc riêng biệt. Hãy nhập mã của bạn để tiếp tục.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) {
            localStorage.setItem('dvhl_workspace', val.trim().toLowerCase());
            window.location.reload();
          }
        }}>
          <input 
            type="text" 
            autoFocus
            placeholder="Nhập mã nhân viên (ví dụ: hieu_marketing)"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mb-4"
            value={val}
            onChange={e => setVal(e.target.value)}
          />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
            Vào làm việc
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const hasWorkspace = !!localStorage.getItem('dvhl_workspace');

  useEffect(() => {
    if (hasWorkspace) void init();
  }, [init, hasWorkspace]);

  if (!hasWorkspace) {
    return <WorkspaceLogin />;
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="cai-dat" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
export default App;
`;

fs.writeFileSync('src/App.tsx', appContent, 'utf8');

// Now update supabaseRepository.ts
let repo = fs.readFileSync('src/data/supabaseRepository.ts', 'utf8');
repo = repo.replace(
  /eq\('id', 'global'\)/g,
  "eq('id', localStorage.getItem('dvhl_workspace') || 'global')"
);
repo = repo.replace(
  /upsert\(\{ id: 'global'/g,
  "upsert({ id: localStorage.getItem('dvhl_workspace') || 'global'"
);

fs.writeFileSync('src/data/supabaseRepository.ts', repo, 'utf8');

// Add "Đăng xuất" button in SettingsPage.tsx
let settings = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
const logoutBtn = `
      <section className="card p-4 border-red-100 bg-red-50/30">
        <h2 className="section-title text-red-600">Không gian làm việc</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Đang đăng nhập mã: <span className="text-indigo-600">{localStorage.getItem('dvhl_workspace')}</span></p>
            <p className="text-xs text-slate-500 mt-1">Đăng xuất để đổi sang mã của nhân viên khác.</p>
          </div>
          <button 
            className="btn-danger"
            onClick={() => {
              if (window.confirm('Đăng xuất khỏi không gian này?')) {
                 localStorage.removeItem('dvhl_workspace');
                 window.location.reload();
              }
            }}
          >
            Đăng xuất
          </button>
        </div>
      </section>
`;
settings = settings.replace('</div>\n  );\n}', logoutBtn + '</div>\n  );\n}');
fs.writeFileSync('src/pages/SettingsPage.tsx', settings, 'utf8');

