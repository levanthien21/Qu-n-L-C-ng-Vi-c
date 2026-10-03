import { describe, expect, it } from 'vitest';
import { buildDemoData } from '../data/seed/demoCustomers';
import { createTemplate14, createTemplate30, defaultTemplates } from '../data/seed/templates';
import { addDays, diffDays, formatVN, parseDateInput, todayStr, weekday } from './dates';
import { buildDashboard, buildProgressReport } from './alerts';
import { createCustomerFromTemplate, ensureRecurringTasks, ruleDates } from './generateTasks';
import {
  aiErrorCount,
  customerStatus,
  customerWaitingDays,
  getCurrentPhase,
  isLocked,
  progress,
  riskReasons,
  taskState,
} from './status';
import { DEFAULT_SETTINGS } from './types';

const input = (startDate: string, paymentStatus: 'full' | 'partial' = 'full') => ({
  name: 'Khách test',
  industry: '',
  contactPerson: '',
  phone: '',
  chatLink: '',
  summaryLink: '',
  saleId: '',
  retionId: '',
  paymentStatus,
  startDate,
  notes: '',
});

describe('ngày tháng', () => {
  it('định dạng dd/mm/yyyy và cộng ngày', () => {
    expect(formatVN('2026-10-03')).toBe('03/10/2026');
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(diffDays('2026-10-10', '2026-10-03')).toBe(7);
  });
  it('đọc nhiều định dạng ngày', () => {
    expect(parseDateInput('3/10/2026')).toBe('2026-10-03');
    expect(parseDateInput('2026-10-03')).toBe('2026-10-03');
    expect(parseDateInput('31/02/2026')).toBeNull();
  });
  it('thứ trong tuần đúng', () => {
    expect(weekday('2026-10-03')).toBe(6); // Thứ 7
    expect(weekday('2026-10-05')).toBe(1); // Thứ 2
  });
  it('hôm nay theo GMT+7', () => {
    // 20:00 UTC ngày 1 = 03:00 ngày 2 giờ Việt Nam
    expect(todayStr(Date.UTC(2026, 0, 1, 20, 0, 0))).toBe('2026-01-02');
  });
});

describe('sinh việc từ template', () => {
  const t30 = createTemplate30();
  const start = '2026-10-01';
  const { customer, tasks } = createCustomerFromTemplate(input(start), t30, { id: 'c1', today: start });

  it('tính ngày kết thúc = bắt đầu + 30', () => {
    expect(customer.endDate).toBe('2026-10-31');
  });
  it('deadline theo offset: II.5 gate ngày 10, Meeting 3 = tổng − 1', () => {
    const gate = tasks.find((t) => t.templateTaskId === 'tpl-30-gate25')!;
    expect(gate.deadline).toBe(addDays(start, 10));
    expect(gate.isGate).toBe(true);
    const m3 = tasks.find((t) => t.meetingNo === 3)!;
    expect(m3.deadline).toBe(addDays(start, 29));
  });
  it('giai đoạn IV bắt đầu trước kết thúc 4 ngày', () => {
    const iv1 = tasks.find((t) => t.templateTaskId === 'tpl-30-iv1')!;
    expect(iv1.startDate).toBe(addDays(start, 26));
  });
  it('việc hằng ngày/tuần không sinh sẵn, mà thành quy tắc lặp', () => {
    expect(customer.recurringRules.length).toBe(5);
    expect(tasks.some((t) => t.ruleId)).toBe(false);
  });
  it('việc "Gửi khách test" bị khóa đến khi gate đạt', () => {
    const map = new Map(tasks.map((t) => [t.id, t]));
    const send = tasks.find((t) => t.templateTaskId === 'tpl-30-ii6a')!;
    expect(isLocked(send, map)).toBe(true);
    const gate = tasks.find((t) => t.templateTaskId === 'tpl-30-gate25')!;
    gate.status = 'done';
    gate.gatePassed = true;
    expect(isLocked(send, map)).toBe(false);
  });
  it('việc nhắc thanh toán tự hoàn thành nếu khách đã thanh toán đủ', () => {
    const t = tasks.find((x) => x.templateTaskId === 'tpl-30-ii1e')!;
    expect(t.status).toBe('done');
    const r2 = createCustomerFromTemplate(input(start, 'partial'), t30, { id: 'c2', today: start });
    expect(r2.tasks.find((x) => x.templateTaskId === 'tpl-30-ii1e')!.status).toBe('todo');
  });
});

describe('template 14 ngày', () => {
  const t14 = createTemplate14();
  it('co theo tỷ lệ, giữ thứ tự hợp lệ', () => {
    const { customer, tasks } = createCustomerFromTemplate(input('2026-10-01'), t14, { id: 'c', today: '2026-10-01' });
    expect(customer.endDate).toBe('2026-10-15');
    for (const t of tasks) expect(t.deadline >= t.startDate).toBe(true);
    const m3 = tasks.find((t) => t.meetingNo === 3)!;
    expect(m3.deadline).toBe('2026-10-14');
    const gate = tasks.find((t) => t.isGate && t.phaseCode === 'II.5')!;
    expect(diffDays(gate.deadline, '2026-10-01')).toBeLessThan(10);
  });
});

describe('việc lặp', () => {
  it('hằng ngày bỏ Chủ nhật, hằng tuần đúng thứ', () => {
    const { customer } = createCustomerFromTemplate(input('2026-10-01'), createTemplate30(), { id: 'c', today: '2026-10-01' });
    const daily = customer.recurringRules.find((r) => r.recurrence === 'daily')!;
    const dates = ruleDates(daily);
    expect(dates.every((d) => weekday(d) !== 0)).toBe(true);
    const weekly = customer.recurringRules.find((r) => r.recurrence === 'weekly' && r.weekday === 1)!;
    expect(ruleDates(weekly).every((d) => weekday(d) === 1)).toBe(true);
  });
  it('sinh việc đến hôm nay, không trùng khi chạy lại', () => {
    const { customer, tasks } = createCustomerFromTemplate(input('2026-10-01'), createTemplate30(), { id: 'c', today: '2026-10-01' });
    const today = '2026-10-20';
    const first = ensureRecurringTasks(customer, tasks, today);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((t) => t.deadline <= today)).toBe(true);
    const again = ensureRecurringTasks(customer, [...tasks, ...first], today);
    expect(again.length).toBe(0);
  });
});

describe('trạng thái & cảnh báo', () => {
  it('Chờ khách / Chờ Hậu Kiểm không bị coi là trễ', () => {
    const { tasks } = createCustomerFromTemplate(input('2026-10-01'), createTemplate30(), { id: 'c', today: '2026-10-01' });
    const t = tasks[0];
    const today = addDays(t.deadline, 5);
    expect(taskState({ ...t, status: 'todo' }, today)).toBe('overdue');
    expect(taskState({ ...t, status: 'waiting_customer' }, today)).toBe('waiting_customer');
    expect(taskState({ ...t, status: 'waiting_audit' }, today)).toBe('waiting_audit');
    expect(taskState({ ...t, status: 'done' }, today)).toBe('done');
  });

  const today = todayStr();
  const templates = defaultTemplates();
  const demo = buildDemoData(templates, today);
  const get = (id: string) => demo.customers.find((c) => c.id === id)!;

  it('dữ liệu mẫu: khách 1 đang trễ, khách 3 chờ Hậu Kiểm', () => {
    expect(customerStatus(get('demo-1'), demo.tasks, today)).toBe('late');
    expect(customerStatus(get('demo-4'), demo.tasks, today)).toBe('late');
    const d = buildDashboard(demo.customers, demo.tasks, today, DEFAULT_SETTINGS);
    expect(d.stats.overdueTasks).toBeGreaterThan(0);
    expect(d.stats.waitingAuditCustomers).toBe(1);
  });
  it('lỗi AI >= 3 → cảnh báo; chờ khách >= 10 ngày → cảnh báo sớm', () => {
    expect(aiErrorCount(get('demo-2'))).toBe(3);
    expect(riskReasons(get('demo-2'), demo.tasks, today, DEFAULT_SETTINGS).some((r) => r.kind === 'ai_errors')).toBe(true);
    expect(customerWaitingDays(get('demo-4'), demo.tasks, today)).toBe(10);
    expect(riskReasons(get('demo-4'), demo.tasks, today, DEFAULT_SETTINGS).some((r) => r.kind === 'waiting')).toBe(true);
  });
  it('giai đoạn hiện tại và % hoàn thành hợp lệ', () => {
    const c1 = get('demo-1');
    const phase = getCurrentPhase(c1, demo.tasks, today)!;
    expect(['II.3', 'II.4', 'II.5']).toContain(phase.code);
    const p = progress(c1, demo.tasks);
    expect(p.percent).toBeGreaterThan(0);
    expect(p.percent).toBeLessThan(100);
  });
  it('báo cáo tiến độ có đủ 4 mục', () => {
    const text = buildProgressReport(get('demo-1'), demo.tasks, today, DEFAULT_SETTINGS);
    for (const k of ['ĐÃ LÀM', 'ĐANG LÀM', 'SẮP TỚI', 'VƯỚNG MẮC']) expect(text).toContain(k);
  });
});
