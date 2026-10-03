import { addDays, diffDays, todayStr, weekday } from './dates';
import type { DateStr } from './dates';
import type { Anchor, Customer, PaymentStatus, RecurringRule, Task, Template } from './types';

export function uid(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

export function endDateOf(startDate: DateStr, durationDays: number): DateStr {
  return addDays(startDate, durationDays);
}

export function resolveDate(anchor: Anchor, offset: number, startDate: DateStr, endDate: DateStr): DateStr {
  return addDays(anchor === 'start' ? startDate : endDate, offset);
}

export interface NewCustomerInput {
  name: string;
  industry: string;
  contactPerson: string;
  phone: string;
  chatLink: string;
  summaryLink: string;
  saleId: string;
  retionId: string;
  paymentStatus: PaymentStatus;
  startDate: DateStr;
  notes: string;
}

export interface GenerationResult {
  customer: Customer;
  tasks: Task[];
}

/** Tạo khách mới + sinh toàn bộ đầu việc từ template với deadline tính sẵn. */
export function createCustomerFromTemplate(
  input: NewCustomerInput,
  template: Template,
  opts: { id?: string; today?: DateStr; autoCompletePast?: boolean } = {},
): GenerationResult {
  const id = opts.id ?? uid('cus');
  const endDate = endDateOf(input.startDate, template.durationDays);
  const customer: Customer = {
    id,
    ...input,
    templateId: template.id,
    templateName: template.name,
    durationDays: template.durationDays,
    phases: template.phases.map((p) => ({ ...p })),
    endDate,
    meetingConfirmed: { '1': false, '2': false, '3': false },
    recurringRules: [],
    careLogs: [],
    testReport: { testPageLink: '', simulatedConversations: 0, evidenceLinks: [] },
    aiErrors: [],
    aiErrorBaseline: 0,
    rescheduleLogs: [],
    createdAt: new Date().toISOString(),
  };

  const today = opts.today ?? todayStr();
  const tasks: Task[] = [];
  const sorted = [...template.tasks].sort((a, b) => a.order - b.order);

  for (const t of sorted) {
    const phase = template.phases.find((p) => p.id === t.phaseId);
    if (!phase) continue;
    const start = resolveDate(t.startAnchor, t.startOffset, input.startDate, endDate);
    let deadline = resolveDate(t.deadlineAnchor, t.deadlineOffset, input.startDate, endDate);
    if (deadline < start) deadline = start;

    if (t.recurrence !== 'none') {
      const rule: RecurringRule = {
        id: `rule-${t.id}`,
        templateTaskId: t.id,
        title: t.title,
        phaseCode: phase.code,
        tag: phase.tag,
        order: t.order,
        recurrence: t.recurrence,
        weekday: t.weekday,
        startDate: start,
        endDate: deadline,
        isRequired: t.isRequired,
      };
      customer.recurringRules.push(rule);
      continue;
    }

    const task: Task = {
      id: `${id}:${t.id}`,
      customerId: id,
      templateTaskId: t.id,
      phaseCode: phase.code,
      tag: phase.tag,
      title: t.title,
      order: t.order,
      startDate: start,
      deadline,
      status: 'todo',
      isGate: t.isGate,
      isRequired: t.isRequired,
      meetingNo: t.meetingNo,
      feature: t.feature,
      requiresGateTaskId: t.requiresGateId ? `${id}:${t.requiresGateId}` : undefined,
      updatedAt: today,
    };
    if (t.condition === 'payment_partial' && input.paymentStatus === 'full') {
      task.status = 'done';
      task.doneAt = today;
      task.skipped = true;
      task.note = 'Không áp dụng (khách đã thanh toán đủ)';
    }
    tasks.push(task);
  }

  if (opts.autoCompletePast) {
    const recurring = ensureRecurringTasks(customer, tasks, today);
    tasks.push(...recurring);
    markPastDone(tasks, today);
  }
  return { customer, tasks };
}

/** Đánh dấu "Xong" mọi việc có deadline trước ngày `before` (dùng khi nhập khách đang làm dở). */
export function markPastDone(tasks: Task[], before: DateStr): void {
  for (const t of tasks) {
    if (t.status !== 'done' && t.deadline < before) {
      t.status = 'done';
      t.doneAt = t.deadline;
      if (t.isGate) t.gatePassed = true;
      t.updatedAt = before;
    }
  }
}

// ---------------- Việc lặp ----------------

/** Các ngày phát sinh của một quy tắc lặp. Hằng ngày: Thứ 2–Thứ 7. Hằng tuần: đúng thứ cấu hình. */
export function ruleDates(rule: RecurringRule): DateStr[] {
  const out: DateStr[] = [];
  const n = diffDays(rule.endDate, rule.startDate);
  for (let i = 0; i <= n; i++) {
    const d = addDays(rule.startDate, i);
    const wd = weekday(d);
    if (rule.recurrence === 'daily') {
      if (wd !== 0) out.push(d);
    } else if (wd === (rule.weekday ?? 1)) {
      out.push(d);
    }
  }
  return out;
}

export function isCustomerOpenForGeneration(c: Customer): boolean {
  return !c.manualStatus;
}

/** Trả về các việc lặp CÒN THIẾU cho đến hết hôm nay (idempotent nhờ id cố định). */
export function ensureRecurringTasks(customer: Customer, existing: Task[], today: DateStr): Task[] {
  if (!isCustomerOpenForGeneration(customer)) return [];
  const have = new Set(existing.map((t) => t.id));
  const out: Task[] = [];
  for (const rule of customer.recurringRules) {
    for (const date of ruleDates(rule)) {
      if (date > today) break;
      const id = `${customer.id}:${rule.id}:${date}`;
      if (have.has(id)) continue;
      out.push({
        id,
        customerId: customer.id,
        templateTaskId: rule.templateTaskId,
        ruleId: rule.id,
        occurrenceDate: date,
        phaseCode: rule.phaseCode,
        tag: rule.tag,
        title: rule.title,
        order: rule.order,
        startDate: date,
        deadline: date,
        status: 'todo',
        isGate: false,
        isRequired: rule.isRequired,
        updatedAt: today,
      });
    }
  }
  return out;
}
