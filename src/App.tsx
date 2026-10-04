import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TodayPage from './pages/TodayPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './store/useStore';

function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Đang tải dữ liệu…</div>;
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
