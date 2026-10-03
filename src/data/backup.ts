import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { formatVN } from '../domain/dates';
import { CUSTOMER_STATUS_LABEL, TASK_STATUS_LABEL } from '../domain/types';
import type { AppData } from '../domain/types';
import { customerStatus, getCurrentPhase, customerTasks, progress } from '../domain/status';

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(data: AppData, today: string) {
  downloadFile(`backup-onboarding-${today}.json`, JSON.stringify(data, null, 2), 'application/json');
}

/** CSV có BOM để Excel/Google Sheet đọc đúng tiếng Việt. */
function csv(rows: Record<string, unknown>[]): string {
  return '\uFEFF' + Papa.unparse(rows);
}

export function exportCustomersCsv(data: AppData, today: string) {
  const rows = data.customers.map((c) => {
    const mine = customerTasks(c, data.tasks);
    const phase = getCurrentPhase(c, mine, today);
    return {
      'Tên nhóm/doanh nghiệp': c.name,
      'Ngành hàng': c.industry,
      'Người liên hệ': c.contactPerson,
      'SĐT/Zalo': c.phone,
      'Link nhóm chat': c.chatLink,
      'Link tổng hợp gói DVHL': c.summaryLink,
      'ID sale': c.saleId,
      'ID QTV/tổ chức Retion': c.retionId,
      Gói: `${c.durationDays} ngày`,
      'Ngày bắt đầu': formatVN(c.startDate),
      'Ngày kết thúc dự kiến': formatVN(c.endDate),
      'Thanh toán': c.paymentStatus === 'full' ? 'Đủ' : 'Chưa đủ',
      'Trạng thái': CUSTOMER_STATUS_LABEL[customerStatus(c, data.tasks, today)],
      'Giai đoạn hiện tại': phase ? `${phase.code} – ${phase.tag}` : 'Hoàn thành',
      'Tiến độ (%)': progress(c, data.tasks).percent,
      'Ghi chú': c.notes,
    };
  });
  downloadFile(`khach-hang-${today}.csv`, csv(rows), 'text/csv;charset=utf-8');
}

export function exportTasksCsv(data: AppData, today: string) {
  const nameOf = new Map(data.customers.map((c) => [c.id, c.name]));
  const rows = data.tasks.map((t) => ({
    Khách: nameOf.get(t.customerId) ?? '',
    'Giai đoạn': t.phaseCode,
    Tag: t.tag,
    'Đầu việc': t.title,
    'Bắt đầu': formatVN(t.startDate),
    Deadline: formatVN(t.deadline),
    'Trạng thái': TASK_STATUS_LABEL[t.status],
    'Ngày hoàn thành': formatVN(t.doneAt),
    'Cổng kiểm soát': t.isGate ? 'Có' : '',
    'Bắt buộc': t.isRequired ? 'Có' : '',
  }));
  downloadFile(`dau-viec-${today}.csv`, csv(rows), 'text/csv;charset=utf-8');
}

export interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
}

/** Đọc file CSV hoặc Excel thành bảng (dòng đầu là tiêu đề). */
export async function parseTableFile(file: File): Promise<ParsedTable> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text();
    const res = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: true });
    return { headers: res.meta.fields ?? [], rows: res.data };
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });
  const headers = json.length ? Object.keys(json[0]) : [];
  const rows = json.map((r) => {
    const o: Record<string, string> = {};
    for (const h of headers) o[h] = r[h] === null || r[h] === undefined ? '' : String(r[h]);
    return o;
  });
  return { headers, rows };
}

export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
