/**
 * Tiện ích ngày tháng. Toàn bộ ngày được lưu dạng chuỗi "yyyy-MM-dd" (không kèm giờ)
 * và tính theo múi giờ GMT+7 để tránh lỗi lệch ngày.
 */
export type DateStr = string;

const DAY_MS = 86400000;
const TZ_OFFSET_MS = 7 * 3600 * 1000;

/** Hôm nay theo giờ Việt Nam (GMT+7). */
export function todayStr(now: number = Date.now()): DateStr {
  return new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

export function dayNum(s: DateStr): number {
  const [y, m, d] = s.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNum(n: number): DateStr {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(s: DateStr, n: number): DateStr {
  return fromDayNum(dayNum(s) + n);
}

/** a - b (số ngày). */
export function diffDays(a: DateStr, b: DateStr): number {
  return dayNum(a) - dayNum(b);
}

/** 0 = Chủ nhật ... 6 = Thứ 7 */
export function weekday(s: DateStr): number {
  return (((dayNum(s) % 7) + 7 + 4) % 7);
}

const WEEKDAY_VN = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export function weekdayVN(s: DateStr): string {
  return WEEKDAY_VN[weekday(s)];
}
export const WEEKDAY_NAMES = WEEKDAY_VN;

/** Định dạng dd/mm/yyyy */
export function formatVN(s?: DateStr | null): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

/** Định dạng dd/mm */
export function formatVNShort(s?: DateStr | null): string {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

export function formatDateTimeVN(iso?: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const d = new Date(t + TZ_OFFSET_MS);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${formatVN(date)} ${time}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function validYMD(y: number, m: number, d: number): DateStr | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Đọc ngày từ nhiều dạng: dd/mm/yyyy, d-m-yyyy, yyyy-mm-dd, số serial Excel.
 * Trả về null nếu không đọc được.
 */
export function parseDateInput(input: unknown): DateStr | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    if (input > 20000 && input < 80000) {
      // số serial Excel (1900 date system)
      return fromDayNum(Math.round(input) - 25569);
    }
    return null;
  }
  const s = String(input).trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return validYMD(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
  if (m) return validYMD(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2})$/);
  if (m) return validYMD(2000 + +m[3], +m[2], +m[1]);
  return null;
}

export function maxDate(list: DateStr[]): DateStr | null {
  if (!list.length) return null;
  return list.reduce((a, b) => (a > b ? a : b));
}
