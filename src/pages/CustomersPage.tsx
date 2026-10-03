import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { diffDays, formatVN } from '../domain/dates';
import {
  customerStatus,
  customerTasks,
  getCurrentPhase,
  progress,
  riskReasons,
  urgencyScore,
} from '../domain/status';
import { CUSTOMER_STATUS_LABEL } from '../domain/types';
import type { CustomerStatusKey } from '../domain/types';
import { useStore } from '../store/useStore';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { Badge, CustomerStatusBadge, EmptyState, ProgressBar } from '../components/ui';

type SortKey = 'urgent' | 'name' | 'end' | 'progress';

export default function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const tasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialStatus = params.get('status');

  const [q, setQ] = useState('');
  const [pkg, setPkg] = useState('all');
  const [status, setStatus] = useState<'all' | CustomerStatusKey>(
    initialStatus && initialStatus in CUSTOMER_STATUS_LABEL ? (initialStatus as CustomerStatusKey) : 'all',
  );
  const [phase, setPhase] = useState('all');
  const [sort, setSort] = useState<SortKey>('urgent');
  const [adding, setAdding] = useState(false);

  const rows = useMemo(
    () =>
      customers.map((c) => {
        const mine = customerTasks(c, tasks);
        return {
          c,
          status: customerStatus(c, tasks, today),
          phase: getCurrentPhase(c, mine, today),
          prog: progress(c, tasks),
          score: urgencyScore(c, tasks, today, settings),
          risks: riskReasons(c, tasks, today, settings),
        };
      }),
    [customers, tasks, today, settings],
  );

  const phaseCodes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of customers) for (const p of c.phases) if (!map.has(p.code)) map.set(p.code, p.order);
    return [...map.entries()].sort((a, b) => a[1] - b[1]).map(([code]) => code);
  }, [customers]);
  const durations = useMemo(() => [...new Set(customers.map((c) => c.durationDays))].sort((a, b) => a - b), [customers]);

  const filtered = rows
    .filter((r) => {
      const text = `${r.c.name} ${r.c.industry} ${r.c.contactPerson} ${r.c.phone} ${r.c.saleId} ${r.c.retionId}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (pkg !== 'all' && String(r.c.durationDays) !== pkg) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (phase !== 'all' && r.phase?.code !== phase) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'name') return a.c.name.localeCompare(b.c.name, 'vi');
      if (sort === 'end') return a.c.endDate.localeCompare(b.c.endDate);
      if (sort === 'progress') return a.prog.percent - b.prog.percent;
      return b.score - a.score || a.c.endDate.localeCompare(b.c.endDate);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Khách hàng ({filtered.length})</h1>
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Plus size={16} /> Thêm khách
        </button>
      </div>

      <div className="card grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input className="input !pl-9" placeholder="Tìm tên, ngành, SĐT, ID sale, ID Retion…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={pkg} onChange={(e) => setPkg(e.target.value)}>
          <option value="all">Mọi gói</option>
          {durations.map((d) => (
            <option key={d} value={d}>
              Gói {d} ngày
            </option>
          ))}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as 'all' | CustomerStatusKey)}>
          <option value="all">Mọi trạng thái</option>
          {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatusKey[]).map((k) => (
            <option key={k} value={k}>
              {CUSTOMER_STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        <select className="input" value={phase} onChange={(e) => setPhase(e.target.value)}>
          <option value="all">Mọi giai đoạn</option>
          {phaseCodes.map((c) => (
            <option key={c} value={c}>
              Giai đoạn {c}
            </option>
          ))}
        </select>
        <select className="input sm:col-span-2 lg:col-span-1" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="urgent">Sắp xếp: Khẩn cấp nhất</option>
          <option value="end">Sắp xếp: Sắp kết thúc</option>
          <option value="progress">Sắp xếp: Tiến độ thấp nhất</option>
          <option value="name">Sắp xếp: Tên A→Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>Không có khách nào phù hợp. Bấm "Thêm khách" để tạo khách mới.</EmptyState>
      ) : (
        <>
          {/* Bảng cho máy tính */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2">Khách</th>
                  <th className="px-3 py-2">Gói</th>
                  <th className="px-3 py-2">Giai đoạn</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="w-40 px-3 py-2">Tiến độ</th>
                  <th className="px-3 py-2">Kết thúc</th>
                  <th className="px-3 py-2">Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.c.id}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                    onClick={() => navigate(`/khach-hang/${r.c.id}`)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{r.c.name}</div>
                      <div className="text-xs text-slate-500">{[r.c.industry, r.c.contactPerson].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className="px-3 py-2.5">{r.c.durationDays} ngày</td>
                    <td className="px-3 py-2.5">{r.phase ? <Badge tone="purple">{r.phase.code} · {r.phase.tag}</Badge> : '—'}</td>
                    <td className="px-3 py-2.5">
                      <CustomerStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="mb-1 text-xs">{r.prog.percent}%</div>
                      <ProgressBar percent={r.prog.percent} tone={r.status === 'late' ? 'red' : r.status === 'completed' ? 'green' : 'indigo'} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {formatVN(r.c.endDate)}
                      <div className="text-slate-500">{diffDays(r.c.endDate, today) >= 0 ? `còn ${diffDays(r.c.endDate, today)} ngày` : `quá ${-diffDays(r.c.endDate, today)} ngày`}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {r.risks.map((x, i) => (
                          <Badge key={i} tone={x.severity === 'danger' ? 'red' : 'yellow'}>
                            {x.kind === 'overdue' ? 'Quá hạn' : x.kind === 'ai_errors' ? 'Lỗi AI' : x.kind === 'stale' ? 'Lâu chưa cập nhật' : 'Chờ khách lâu'}
                          </Badge>
                        ))}
                        {r.c.paymentStatus === 'partial' && <Badge tone="orange">Chưa thanh toán đủ</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thẻ cho điện thoại */}
          <div className="space-y-2 md:hidden">
            {filtered.map((r) => (
              <Link key={r.c.id} to={`/khach-hang/${r.c.id}`} className="card block p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{r.c.name}</div>
                    <div className="text-xs text-slate-500">
                      Gói {r.c.durationDays} ngày · kết thúc {formatVN(r.c.endDate)}
                    </div>
                  </div>
                  <CustomerStatusBadge status={r.status} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar percent={r.prog.percent} tone={r.status === 'late' ? 'red' : 'indigo'} />
                  </div>
                  <span className="text-xs">{r.prog.percent}%</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.phase && <Badge tone="purple">{r.phase.code} · {r.phase.tag}</Badge>}
                  {r.risks.map((x, i) => (
                    <Badge key={i} tone={x.severity === 'danger' ? 'red' : 'yellow'}>
                      {x.text}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {adding && <CustomerFormModal onClose={() => setAdding(false)} onSaved={(id) => navigate(`/khach-hang/${id}`)} />}
    </div>
  );
}
