import type { DateStr } from './dates';

export type TaskStatus = 'todo' | 'doing' | 'waiting_customer' | 'waiting_audit' | 'done';
export type PaymentStatus = 'full' | 'partial';
export type ManualStatus = 'paused' | 'ticket_closed' | 'completed';
export type Anchor = 'start' | 'end';
export type Recurrence = 'none' | 'daily' | 'weekly';
export type TaskCondition = 'payment_partial';
export type TaskFeature = 'testCounter';

/** Giai Ä‘oáº¡n trong template */
export interface Phase {
  id: string;
  /** MÃ£ hiá»ƒn thá»‹: I, II.1, II.2 ... */
  code: string;
  name: string;
  /** Tag DV tÆ°Æ¡ng á»©ng (DV-Gets, DV â€“ Prompt ...) */
  tag: string;
  order: number;
  /** Ghi chÃº thá»i lÆ°á»£ng, vÃ­ dá»¥ "tá»‘i Ä‘a 1 ngÃ y" */
  note?: string;
}

/** Äáº§u viá»‡c máº«u trong template */
export interface TaskTemplate {
  id: string;
  phaseId: string;
  order: number;
  title: string;
  /** TÃ­nh tá»« ngÃ y báº¯t Ä‘áº§u gÃ³i ('start') hoáº·c tá»« ngÃ y káº¿t thÃºc gÃ³i ('end') */
  startAnchor: Anchor;
  startOffset: number;
  deadlineAnchor: Anchor;
  deadlineOffset: number;
  /** Cá»•ng kiá»ƒm soÃ¡t (Háº­u Kiá»ƒm) */
  isGate: boolean;
  /** Viá»‡c báº¯t buá»™c */
  isRequired: boolean;
  recurrence: Recurrence;
  /** Thá»© trong tuáº§n (0 = CN â€¦ 6 = T7) khi láº·p háº±ng tuáº§n */
  weekday?: number;
  meetingNo?: 1 | 2 | 3;
  /** KhÃ³a cho Ä‘áº¿n khi gate nÃ y (id template task) Ä‘áº¡t */
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
  handoverDate?: DateStr;
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
  /** NgÃ y báº¯t Ä‘áº§u "Chá» khÃ¡ch"/"Chá» Háº­u Kiá»ƒm" */
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
  sheetData?: Record<string, any[][]>;
  lastSheetSync?: string;
  templateId: string;
  templateName: string;
  durationDays: number;
  /** Báº£n chá»¥p giai Ä‘oáº¡n cá»§a template lÃºc táº¡o khÃ¡ch */
  phases: Phase[];
  startDate: DateStr;
  endDate: DateStr;
  handoverDate?: DateStr;
  paymentStatus: PaymentStatus;
  notes: string;
  manualStatus?: ManualStatus;
  manualStatusNote?: string;
  /** NgÆ°á»¡ng nháº¯c "chÆ°a liÃªn há»‡" riÃªng cho khÃ¡ch (náº¿u bá» trá»‘ng dÃ¹ng máº·c Ä‘á»‹nh) */
  contactAlertDays?: number;
  meetingConfirmed: Record<string, boolean>;
  recurringRules: RecurringRule[];
  careLogs: CareLog[];
  testReport: TestReport;
  aiErrors: AIErrorLog[];
  /** Sá»‘ lá»—i Ä‘Ã£ "chá»‘t" á»Ÿ cÃ¡c vÃ²ng cáº£nh bÃ¡o trÆ°á»›c (Ä‘á»ƒ Ä‘áº¿m láº¡i tá»« Ä‘áº§u) */
  aiErrorBaseline: number;
  rescheduleLogs: RescheduleLog[];
  createdAt: string;
  completedAt?: string;
  isDemo?: boolean;
  sopChecklist?: Record<string, boolean>;
  meetingNotes?: { id: string; date: string; note: string; notified?: boolean; notified10?: boolean; type?: string; done?: boolean }[];
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
  telegramToken?: string;
  telegramChatId?: string;
  telegramNotifyProgress?: boolean;
  telegramNotifyMeetings?: boolean;
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
  todo: 'ChÆ°a lÃ m',
  doing: 'Äang lÃ m',
  waiting_customer: 'Chá» khÃ¡ch',
  waiting_audit: 'Chá» Háº­u Kiá»ƒm',
  done: 'Xong',
};

export type CustomerStatusKey = 'in_progress' | 'late' | 'paused' | 'ticket_closed' | 'completed';
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatusKey, string> = {
  in_progress: 'Äang triá»ƒn khai',
  late: 'Cháº­m tiáº¿n Ä‘á»™',
  paused: 'Táº¡m dá»«ng',
  ticket_closed: 'Táº¡m Ä‘Ã³ng ticket',
  completed: 'HoÃ n thÃ nh',
};
