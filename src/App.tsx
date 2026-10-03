import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useStore } from './store/useStore';
import CalendarPage from './pages/CalendarPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomersPage from './pages/CustomersPage';
import ImportExportPage from './pages/ImportExportPage';
import KanbanPage from './pages/KanbanPage';
import SettingsPage from './pages/SettingsPage';
import TemplatesPage from './pages/TemplatesPage';
import TodayPage from './pages/TodayPage';

export default function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Đang tải dữ liệu…</div>;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="khach-hang" element={<CustomersPage />} />
        <Route path="khach-hang/:id" element={<CustomerDetailPage />} />
        <Route path="lich" element={<CalendarPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="template" element={<TemplatesPage />} />
        <Route path="du-lieu" element={<ImportExportPage />} />
        <Route path="cai-dat" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
