import type { DateStr } from './dates';

export type TaskStatus = 'todo' | 'doing' | 'waiting_customer' | 'waiting_audit' | 'done';
export type PaymentStatus = 'full' | 'partial';
export type ManualStatus = 'paused' | 'ticket_closed' | 'completed';
export type Anchor = 'start' | 'end';
export type Recurrence = 'none' | 'daily' | 'weekly';
export type TaskCondition = 'payment_partial';
export type TaskFeature = 'testCounter';

/** Giai đoạn trong template */
export interface Phase {
  id: string;
  /** Mã hiển thị: I, II.1, II.2 ... */
  code: string;
  name: string;
  /** Tag DV tương ứng (DV-Gets, DV – Prompt ...) */
  tag: string;
  order: number;
  /** Ghi chú thời lượng, ví dụ "tối đa 1 ngày" */
  note?: string;
}

/** Đầu việc mẫu trong template */
export interface TaskTemplate {
  id: string;
  phaseId: string;
  order: number;
  title: string;
  /** Tính từ ngày bắt đầu gói ('start') hoặc từ ngày kết thúc gói ('end') */
  startAnchor: Anchor;
  startOffset: number;
  deadlineAnchor: Anchor;
  deadlineOffset: number;
  /** Cổng kiểm soát (Hậu Kiểm) */
  isGate: boolean;
  /** Việc bắt buộc */
  isRequired: boolean;
  recurrence: Recurrence;
  /** Thứ trong tuần (0 = CN … 6 = T7) khi lặp hằng tuần */
  weekday?: number;
  meetingNo?: 1 | 2 | 3;
  /** Khóa cho đến khi gate này (id template task) đạt */
  requiresGateId?: string;
  feature?: TaskFeature;
  condition?: TaskCondition;
}

export interface Template {
  id: string;
  name: string;
  durationDays: number;
  description?: string;
  phases: Phase[];
  tasks: TaskTemplate[];
  builtIn?: boolean;
}

export interface RecurringRule {
  id: string;
  templateTaskId: string;
  title: string;
  phaseCode: string;
  tag: string;
  order: number;
  recurrence: Exclude<Recurrence, 'none'>;
  weekday?: number;
  startDate: DateStr;
  endDate: DateStr;
  isRequired: boolean;
}

export interface Task {
  id: string;
  customerId: string;
  templateTaskId?: string;
  ruleId?: string;
  occurrenceDate?: DateStr;
  phaseCode: string;
  tag: string;
  title: string;
  order: number;
  startDate: DateStr;
  deadline: DateStr;
  status: TaskStatus;
  doneAt?: DateStr;
  /** Ngày bắt đầu "Chờ khách"/"Chờ Hậu Kiểm" */
  waitingSince?: DateStr;
  isGate: boolean;
  isRequired: boolean;
  meetingNo?: 1 | 2 | 3;
  feature?: TaskFeature;
  requiresGateTaskId?: string;
  gatePassed?: boolean;
  auditFailCount?: number;
  unlockReason?: string;
  note?: string;
  isCustom?: boolean;
  skipped?: boolean;
  updatedAt: DateStr;
}

export interface CareLog {
  id: string;
  date: DateStr;
  content: string;
  result: string;
  followUp: string;
  followUpDate?: DateStr;
  followUpTaskId?: string;
}

export interface TestReport {
  testPageLink: string;
  simulatedConversations: number;
  evidenceLinks: string[];
}

export interface AIErrorLog {
  id: string;
  date: DateStr;
  description: string;
  resolved: boolean;
}

export interface RescheduleLog {
  id: string;
  scope: 'task' | 'start';
  taskId?: string;
  taskTitle?: string;
  oldStart?: DateStr;
  newStart?: DateStr;
  oldDeadline?: DateStr;
  newDeadline?: DateStr;
  reason: string;
  at: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  phone: string;
  chatLink: string;
  summaryLink: string;
  sheetLink?: string;
  saleId: string;
  retionId: string;
  templateId: string;
  templateName: string;
  durationDays: number;
  /** Bản chụp giai đoạn của template lúc tạo khách */
  phases: Phase[];
  startDate: DateStr;
  endDate: DateStr;
  paymentStatus: PaymentStatus;
  notes: string;
  manualStatus?: ManualStatus;
  manualStatusNote?: string;
  /** Ngưỡng nhắc "chưa liên hệ" riêng cho khách (nếu bỏ trống dùng mặc định) */
  contactAlertDays?: number;
  meetingConfirmed: Record<string, boolean>;
  recurringRules: RecurringRule[];
  careLogs: CareLog[];
  testReport: TestReport;
  aiErrors: AIErrorLog[];
  /** Số lỗi đã "chốt" ở các vòng cảnh báo trước (để đếm lại từ đầu) */
  aiErrorBaseline: number;
  rescheduleLogs: RescheduleLog[];
  createdAt: string;
  isDemo?: boolean;
}

export interface Settings {
  contactAlertDays: number;
  staleDays: number;
  waitingWarnDays: number;
  waitingCloseDays: number;
  handoverAlertDays: number;
  endingSoonDays: number;
  dueSoonDays: number;
  aiErrorThreshold: number;
  minTestConversations: number;
  googleScriptUrl?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface AppData {
  version: number;
  templates: Template[];
  customers: Customer[];
  tasks: Task[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  contactAlertDays: 3,
  staleDays: 5,
  waitingWarnDays: 10,
  waitingCloseDays: 15,
  handoverAlertDays: 4,
  endingSoonDays: 7,
  dueSoonDays: 3,
  aiErrorThreshold: 3,
  minTestConversations: 30,
  theme: 'system',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Chưa làm',
  doing: 'Đang làm',
  waiting_customer: 'Chờ khách',
  waiting_audit: 'Chờ Hậu Kiểm',
  done: 'Xong',
};

export type CustomerStatusKey = 'in_progress' | 'late' | 'paused' | 'ticket_closed' | 'completed';
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatusKey, string> = {
  in_progress: 'Đang triển khai',
  late: 'Chậm tiến độ',
  paused: 'Tạm dừng',
  ticket_closed: 'Tạm đóng ticket',
  completed: 'Hoàn thành',
};
