import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, FileUp, Upload } from 'lucide-react';
import { exportCustomersCsv, exportJson, exportTasksCsv, normalizeText, parseTableFile } from '../data/backup';
import type { ParsedTable } from '../data/backup';
import { parseDateInput } from '../domain/dates';
import type { NewCustomerInput } from '../domain/generateTasks';
import { useStore } from '../store/useStore';
import { Badge, EmptyState } from '../components/ui';

type FieldKey =
  | 'name'
  | 'industry'
  | 'contactPerson'
  | 'phone'
  | 'chatLink'
  | 'summaryLink'
  | 'saleId'
  | 'retionId'
  | 'package'
  | 'startDate'
  | 'paymentStatus'
  | 'notes';

const FIELDS: { key: FieldKey; label: string; required?: boolean; keywords: string[] }[] = [
  { key: 'name', label: 'Tên nhóm / doanh nghiệp', required: true, keywords: ['ten nhom', 'ten khach', 'doanh nghiep', 'khach hang', 'ten'] },
  { key: 'industry', label: 'Ngành hàng', keywords: ['nganh'] },
  { key: 'contactPerson', label: 'Người liên hệ', keywords: ['nguoi lien he', 'lien he', 'dau moi'] },
  { key: 'phone', label: 'SĐT / Zalo', keywords: ['sdt', 'so dien thoai', 'zalo', 'phone'] },
  { key: 'chatLink', label: 'Link nhóm chat', keywords: ['link nhom', 'nhom chat'] },
  { key: 'summaryLink', label: 'Link tổng hợp gói DVHL', keywords: ['tong hop', 'link goi'] },
  { key: 'saleId', label: 'ID sale', keywords: ['id sale', 'sale'] },
  { key: 'retionId', label: 'ID QTV / ID tổ chức Retion', keywords: ['qtv', 'to chuc', 'retion'] },
  { key: 'package', label: 'Gói (30 / 14 ngày)', keywords: ['goi', 'package'] },
  { key: 'startDate', label: 'Ngày bắt đầu', keywords: ['ngay bat dau', 'bat dau', 'start'] },
  { key: 'paymentStatus', label: 'Thanh toán (Đủ / Chưa đủ)', keywords: ['thanh toan', 'payment'] },
  { key: 'notes', label: 'Ghi chú', keywords: ['ghi chu', 'note'] },
];

function guessMapping(headers: string[]): Record<FieldKey, string> {
  const result = {} as Record<FieldKey, string>;
  const used = new Set<string>();
  for (const f of FIELDS) {
    let found = '';
    for (const kw of f.keywords) {
      const h = headers.find((x) => !used.has(x) && normalizeText(x).includes(kw));
      if (h) {
        found = h;
        break;
      }
    }
    if (found) used.add(found);
    result[f.key] = found;
  }
  return result;
}

export default function ImportExportPage() {
  const store = useStore();
  const { templates, today } = store;
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [defaultTpl, setDefaultTpl] = useState(templates[0]?.id ?? '');
  const [autoPast, setAutoPast] = useState(true);
  const [msg, setMsg] = useState('');

  const getData = () => ({ version: 1, templates: store.templates, customers: store.customers, tasks: store.tasks, settings: store.settings });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setMsg('');
    try {
      const t = await parseTableFile(f);
      if (!t.headers.length) {
        setMsg('Không đọc được tiêu đề cột. Dòng đầu tiên của file phải là tên các cột.');
        return;
      }
      setTable(t);
      setMapping(guessMapping(t.headers));
    } catch (e) {
      setMsg(`Không đọc được file: ${(e as Error).message}`);
    }
  };

  const convert = (row: Record<string, string>): { input?: NewCustomerInput; templateId?: string; error?: string } => {
    const get = (k: FieldKey) => (mapping[k] ? (row[mapping[k]] ?? '').toString().trim() : '');
    const name = get('name');
    if (!name) return { error: 'Thiếu tên' };
    const startRaw = mapping.startDate ? row[mapping.startDate] : '';
    const startNum = typeof startRaw === 'string' && /^\d{5}$/.test(startRaw.trim()) ? Number(startRaw) : startRaw;
    const startDate = parseDateInput(startNum);
    if (!startDate) return { error: `Ngày bắt đầu không đọc được ("${startRaw ?? ''}")` };
    const pkgText = get('package');
    const m = pkgText.match(/\d+/);
    const tpl =
      (m ? templates.find((t) => t.durationDays === Number(m[0])) : undefined) ?? templates.find((t) => t.id === defaultTpl);
    if (!tpl) return { error: 'Không xác định được gói' };
    const pay = normalizeText(get('paymentStatus'));
    const partial = /chua|thieu|no|con lai|coc/.test(pay);
    return {
      templateId: tpl.id,
      input: {
        name,
        industry: get('industry'),
        contactPerson: get('contactPerson'),
        phone: get('phone'),
        chatLink: get('chatLink'),
        summaryLink: get('summaryLink'),
        saleId: get('saleId'),
        retionId: get('retionId'),
        paymentStatus: partial ? 'partial' : 'full',
        startDate,
        notes: get('notes'),
      },
    };
  };

  const converted = table ? table.rows.map(convert) : [];
  const okRows = converted.filter((r) => r.input);
  const errRows = converted.map((r, i) => ({ r, i })).filter((x) => x.r.error);

  const doImport = () => {
    const n = store.importCustomers(
      okRows.map((r) => ({ input: r.input!, templateId: r.templateId! })),
      autoPast,
    );
    setMsg(`Đã nhập ${n} khách. ${errRows.length ? `Bỏ qua ${errRows.length} dòng lỗi.` : ''}`);
    setTable(null);
  };

  const onJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.customers) || !Array.isArray(data.tasks)) {
        setMsg('File JSON không đúng định dạng backup của ứng dụng.');
        return;
      }
      if (window.confirm(`File có ${data.customers.length} khách và ${data.tasks.length} đầu việc.\nNhập sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?`)) {
        store.importAppData(data);
        setMsg('Đã khôi phục dữ liệu từ file backup.');
      }
    } catch {
      setMsg('Không đọc được file JSON.');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Nhập / Xuất dữ liệu</h1>
      {msg && <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">{msg}</div>}

      <section className="card p-4">
        <h2 className="section-title">
          <Download size={15} /> Xuất / backup
        </h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => exportJson(getData(), today)}>
            Backup toàn bộ (JSON)
          </button>
          <button className="btn-secondary" onClick={() => exportCustomersCsv(getData(), today)}>
            Xuất danh sách khách (CSV)
          </button>
          <button className="btn-secondary" onClick={() => exportTasksCsv(getData(), today)}>
            Xuất đầu việc (CSV)
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Dữ liệu đang lưu trong trình duyệt của máy này. Hãy backup JSON định kỳ (ví dụ mỗi tuần) để không mất dữ liệu khi xóa lịch sử trình duyệt.</p>
      </section>

      <section className="card p-4">
        <h2 className="section-title">
          <Upload size={15} /> Khôi phục từ backup (JSON)
        </h2>
        <input type="file" accept=".json,application/json" className="input" onChange={(e) => { void onJson(e.target.files?.[0]); e.target.value = ''; }} />
      </section>

      <section className="card p-4">
        <h2 className="section-title">
          <FileSpreadsheet size={15} /> Nhập khách từ CSV / Excel (xuất từ Google Sheet)
        </h2>
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
          Trong Google Sheet: <b>Tệp → Tải xuống → CSV</b> (hoặc Excel). Dòng đầu tiên phải là tên cột. Sau khi chọn file, bạn ghép từng cột với thông tin tương ứng.
        </p>
        <input type="file" accept=".csv,.txt,.xlsx,.xls" className="input" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />

        {table && (
          <div className="mt-4 space-y-4">
            <div className="text-sm">
              Đọc được <b>{table.rows.length}</b> dòng, <b>{table.headers.length}</b> cột.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="label">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <select className="input" value={mapping[f.key] ?? ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                    <option value="">— Không nhập —</option>
                    {table.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label className="label">Gói mặc định (khi cột Gói trống hoặc không có số 30/14)</label>
                <select className="input" value={defaultTpl} onChange={(e) => setDefaultTpl(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={autoPast} onChange={(e) => setAutoPast(e.target.checked)} />
              <span>Tự đánh dấu "Xong" các việc có deadline trước hôm nay (nên bật khi nhập khách đang triển khai dở).</span>
            </label>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                Xem trước <Badge tone="green">{okRows.length} hợp lệ</Badge>
                {errRows.length > 0 && <Badge tone="red">{errRows.length} lỗi</Badge>}
              </div>
              <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 text-xs dark:border-slate-800">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Tên</th>
                      <th className="px-2 py-1 text-left">Gói</th>
                      <th className="px-2 py-1 text-left">Bắt đầu</th>
                      <th className="px-2 py-1 text-left">Thanh toán</th>
                      <th className="px-2 py-1 text-left">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {converted.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1">{r.input?.name ?? ''}</td>
                        <td className="px-2 py-1">{templates.find((t) => t.id === r.templateId)?.name ?? ''}</td>
                        <td className="px-2 py-1">{r.input?.startDate ?? ''}</td>
                        <td className="px-2 py-1">{r.input ? (r.input.paymentStatus === 'full' ? 'Đủ' : 'Chưa đủ') : ''}</td>
                        <td className={`px-2 py-1 ${r.error ? 'text-red-600' : 'text-emerald-600'}`}>{r.error ?? 'OK'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {converted.length > 50 && <div className="mt-1 text-xs text-slate-500">Chỉ hiển thị 50 dòng đầu.</div>}
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setTable(null)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={okRows.length === 0} onClick={doImport}>
                <FileUp size={15} /> Nhập {okRows.length} khách
              </button>
            </div>
          </div>
        )}
        {!table && templates.length === 0 && <EmptyState>Chưa có template nào. Hãy tạo ở trang <Link to="/template" className="underline">Template</Link>.</EmptyState>}
      </section>
    </div>
  );
}
