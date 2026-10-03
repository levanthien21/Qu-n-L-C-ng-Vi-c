import { diffDays, formatVN, formatVNShort } from './dates';
import type { DateStr } from './dates';
import {
  aiErrorCount,
  contactThreshold,
  customerStatus,
  customerWaitingDays,
  customerTasks,
  daysLate,
  daysSinceContact,
  getCurrentPhase,
  isActiveCustomer,
  isMyOverdue,
  riskReasons,
  taskState,
} from './status';
import type { RiskReason, Severity } from './status';
import type { Customer, Settings, Task } from './types';

export interface TaskView {
  task: Task;
  customer: Customer;
}

export interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  kind: 'payment' | 'meeting' | 'meeting_confirm' | 'handover' | 'waiting_close' | 'contact' | 'ai_alert';
  severity: Severity;
  text: string;
  action?: 'close_ticket';
}

export interface Dashboard {
  overdue: TaskView[];
  today: TaskView[];
  dueSoon: TaskView[];
  waiting: TaskView[];
  risky: { customer: Customer; reasons: RiskReason[] }[];
  reminders: Reminder[];
  stats: {
    activeCustomers: number;
    overdueTasks: number;
    waitingAuditCustomers: number;
    endingSoon: number;
  };
}

export function daysToEnd(c: Customer, today: DateStr): number {
  return diffDays(c.endDate, today);
}

export function buildDashboard(customers: Customer[], tasks: Task[], today: DateStr, s: Settings): Dashboard {
  const active = customers.filter((c) => isActiveCustomer(c) && customerStatus(c, tasks, today) !== 'completed');
  const overdue: TaskView[] = [];
  const todayList: TaskView[] = [];
  const dueSoon: TaskView[] = [];
  const waiting: TaskView[] = [];
  const reminders: Reminder[] = [];

  for (const c of active) {
    const mine = customerTasks(c, tasks);
    for (const t of mine) {
      if (t.status === 'done') continue;
      const view = { task: t, customer: c };
      const st = taskState(t, today, s.dueSoonDays);
      if (st === 'overdue') overdue.push(view);
      else if (st === 'waiting_customer' || st === 'waiting_audit') waiting.push(view);
      else if (st === 'due_today' || t.startDate === today || (t.status === 'doing' && t.startDate <= today)) {
        todayList.push(view);
      } else if (st === 'due_soon') dueSoon.push(view);
    }

    // ----- Nhắc đặc biệt -----
    if (c.paymentStatus === 'partial') {
      reminders.push({
        id: `pay-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        kind: 'payment',
        severity: 'warning',
        text: 'Khách chưa thanh toán đủ — nhắc thanh toán',
      });
    }

    for (const t of mine) {
      if (!t.meetingNo) continue;
      if (t.status !== 'done') {
        const d = diffDays(t.deadline, today);
        if (d >= 0 && d <= s.dueSoonDays) {
          reminders.push({
            id: `meet-${t.id}`,
            customerId: c.id,
            customerName: c.name,
            kind: 'meeting',
            severity: d === 0 ? 'danger' : 'info',
            text: `Meeting buổi ${t.meetingNo}: ${d === 0 ? 'HÔM NAY' : `còn ${d} ngày`} (${formatVN(t.deadline)})`,
          });
        }
      } else if (!c.meetingConfirmed[String(t.meetingNo)]) {
        reminders.push({
          id: `meetc-${t.id}`,
          customerId: c.id,
          customerName: c.name,
          kind: 'meeting_confirm',
          severity: 'warning',
          text: `Khách chưa xác nhận Lộ trình triển khai sau Meeting buổi ${t.meetingNo}`,
        });
      }
    }

    const dte = daysToEnd(c, today);
    if (dte >= 0 && dte <= s.handoverAlertDays) {
      reminders.push({
        id: `hand-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        kind: 'handover',
        severity: 'info',
        text: `Sắp vào giai đoạn bàn giao — còn ${dte} ngày đến ngày kết thúc (${formatVN(c.endDate)})`,
      });
    }

    const waitDays = customerWaitingDays(c, tasks, today);
    if (waitDays >= s.waitingCloseDays) {
      reminders.push({
        id: `wc-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        kind: 'waiting_close',
        severity: 'danger',
        text: `Chờ khách đã ${waitDays} ngày liên tục. Sau khi báo sale và nhắn lên nhóm, có thể Tạm đóng ticket.`,
        action: 'close_ticket',
      });
    }

    const since = daysSinceContact(c, today);
    if (since >= contactThreshold(c, s)) {
      reminders.push({
        id: `ct-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        kind: 'contact',
        severity: 'warning',
        text: `Đã ${since} ngày chưa liên hệ khách`,
      });
    }

    const errs = aiErrorCount(c);
    if (errs >= s.aiErrorThreshold) {
      reminders.push({
        id: `ai-${c.id}`,
        customerId: c.id,
        customerName: c.name,
        kind: 'ai_alert',
        severity: 'danger',
        text: `Lỗi AI ${errs} lần: thông báo khách tạm dừng AI page chính → chuyển về page test 2 ngày → chỉnh → gửi nhóm checktest → gửi lại khách`,
      });
    }
  }

  const byLate = (a: TaskView, b: TaskView) =>
    daysLate(b.task, today) - daysLate(a.task, today) || a.task.order - b.task.order;
  overdue.sort(byLate);
  const byDeadline = (a: TaskView, b: TaskView) =>
    a.task.deadline.localeCompare(b.task.deadline) || a.customer.name.localeCompare(b.customer.name) || a.task.order - b.task.order;
  todayList.sort(byDeadline);
  dueSoon.sort(byDeadline);
  waiting.sort((a, b) => (a.task.waitingSince ?? '').localeCompare(b.task.waitingSince ?? ''));

  const risky = active
    .map((customer) => ({ customer, reasons: riskReasons(customer, tasks, today, s) }))
    .filter((r) => r.reasons.length > 0)
    .sort(
      (a, b) =>
        b.reasons.filter((r) => r.severity === 'danger').length - a.reasons.filter((r) => r.severity === 'danger').length ||
        b.reasons.length - a.reasons.length,
    );

  const sevRank: Record<Severity, number> = { danger: 0, warning: 1, info: 2 };
  reminders.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);

  return {
    overdue,
    today: todayList,
    dueSoon,
    waiting,
    risky,
    reminders,
    stats: {
      activeCustomers: active.length,
      overdueTasks: overdue.length,
      waitingAuditCustomers: active.filter((c) => customerTasks(c, tasks).some((t) => t.status === 'waiting_audit')).length,
      endingSoon: active.filter((c) => {
        const d = daysToEnd(c, today);
        return d >= 0 && d <= s.endingSoonDays;
      }).length,
    },
  };
}

/** Nhóm danh sách việc theo khách hàng (giữ thứ tự xuất hiện). */
export function groupByCustomer(list: TaskView[]): { customer: Customer; tasks: Task[] }[] {
  const map = new Map<string, { customer: Customer; tasks: Task[] }>();
  for (const v of list) {
    const g = map.get(v.customer.id) ?? { customer: v.customer, tasks: [] };
    g.tasks.push(v.task);
    map.set(v.customer.id, g);
  }
  return [...map.values()];
}

// ---------------- Báo cáo tiến độ dạng văn bản ----------------

export function buildProgressReport(c: Customer, tasks: Task[], today: DateStr, s: Settings, recentDays = 7): string {
  const mine = customerTasks(c, tasks);
  const phase = getCurrentPhase(c, mine, today);
  const done = mine.filter((t) => t.status === 'done');
  const total = mine.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;

  const recentDone = done
    .filter((t) => t.doneAt && diffDays(today, t.doneAt) <= recentDays && !t.skipped)
    .sort((a, b) => (a.doneAt! < b.doneAt! ? -1 : 1));
  const doing = mine.filter((t) => t.status === 'doing');
  const upcoming = mine
    .filter((t) => t.status !== 'done' && !t.ruleId && diffDays(t.deadline, today) >= 0 && diffDays(t.deadline, today) <= recentDays)
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.order - b.order);
  const overdue = mine.filter((t) => isMyOverdue(t, today));
  const waitCus = mine.filter((t) => t.status === 'waiting_customer');
  const waitAudit = mine.filter((t) => t.status === 'waiting_audit');

  const line = (t: Task) => `- ${t.title}${t.status === 'done' && t.doneAt ? ` (xong ${formatVNShort(t.doneAt)})` : ` (hạn ${formatVNShort(t.deadline)})`}`;
  const lines: string[] = [];
  lines.push(`📋 BÁO CÁO TIẾN ĐỘ – ${c.name}`);
  lines.push(`Gói DVHL ${c.durationDays} ngày | Bắt đầu: ${formatVN(c.startDate)} | Dự kiến kết thúc: ${formatVN(c.endDate)}`);
  lines.push(`Ngày báo cáo: ${formatVN(today)}`);
  lines.push(`Tiến độ: ${pct}% (${done.length}/${total} đầu việc)`);
  lines.push(`Giai đoạn hiện tại: ${phase ? `${phase.code} – ${phase.name} [${phase.tag}]` : 'Đã hoàn thành'}`);
  lines.push('');
  lines.push(`✅ ĐÃ LÀM (${recentDays} ngày gần đây):`);
  lines.push(...(recentDone.length ? recentDone.map(line) : ['- (chưa có)']));
  lines.push('');
  lines.push('🔄 ĐANG LÀM:');
  lines.push(...(doing.length ? doing.map(line) : ['- (không có)']));
  lines.push('');
  lines.push(`⏭ SẮP TỚI (${recentDays} ngày tới):`);
  lines.push(...(upcoming.length ? upcoming.slice(0, 10).map(line) : ['- (không có)']));
  lines.push('');
  lines.push('⚠ VƯỚNG MẮC:');
  const issues: string[] = [];
  for (const t of overdue) issues.push(`- Trễ ${daysLate(t, today)} ngày: ${t.title}`);
  for (const t of waitCus) issues.push(`- Đang chờ khách${t.waitingSince ? ` (từ ${formatVNShort(t.waitingSince)})` : ''}: ${t.title}`);
  for (const t of waitAudit) issues.push(`- Đang chờ Hậu Kiểm: ${t.title}`);
  const errs = aiErrorCount(c);
  if (errs > 0) issues.push(`- Lỗi AI phát sinh: ${errs} lần${errs >= s.aiErrorThreshold ? ' (đã vượt ngưỡng cảnh báo)' : ''}`);
  if (c.paymentStatus === 'partial') issues.push('- Khách chưa thanh toán đủ');
  if (c.testReport.simulatedConversations > 0) {
    issues.push(`- (Thông tin test) Đã giả lập ${c.testReport.simulatedConversations} hội thoại${c.testReport.testPageLink ? ` – page test: ${c.testReport.testPageLink}` : ''}`);
  }
  lines.push(...(issues.length ? issues : ['- Không có']));
  return lines.join('\n');
}
