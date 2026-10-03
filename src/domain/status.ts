import { diffDays, maxDate } from './dates';
import type { DateStr } from './dates';
import { ruleDates } from './generateTasks';
import type { Customer, CustomerStatusKey, Phase, Settings, Task } from './types';

export type TaskState =
  | 'done'
  | 'overdue'
  | 'due_today'
  | 'due_soon'
  | 'waiting_customer'
  | 'waiting_audit'
  | 'normal';

/** Số ngày trễ (>0 nếu đã quá hạn). */
export function daysLate(task: Task, today: DateStr): number {
  return diffDays(today, task.deadline);
}

export function taskState(task: Task, today: DateStr, dueSoonDays = 3): TaskState {
  if (task.status === 'done') return 'done';
  if (task.status === 'waiting_customer') return 'waiting_customer';
  if (task.status === 'waiting_audit') return 'waiting_audit';
  const late = daysLate(task, today);
  if (late > 0) return 'overdue';
  if (late === 0) return 'due_today';
  if (-late <= dueSoonDays) return 'due_soon';
  return 'normal';
}

/** Việc đang trễ do mình (không tính chờ khách / chờ Hậu Kiểm). */
export function isMyOverdue(task: Task, today: DateStr): boolean {
  return taskState(task, today) === 'overdue';
}

/** Số ngày đã chờ (khách / Hậu Kiểm) của một việc. */
export function waitingDays(task: Task, today: DateStr): number {
  if (!task.waitingSince) return 0;
  return Math.max(0, diffDays(today, task.waitingSince));
}

export function isLocked(task: Task, byId: Map<string, Task>): boolean {
  if (!task.requiresGateTaskId || task.unlockReason) return false;
  if (task.status === 'done') return false;
  const gate = byId.get(task.requiresGateTaskId);
  if (!gate) return false;
  return !(gate.status === 'done' && gate.gatePassed !== false);
}

export function isActiveCustomer(c: Customer): boolean {
  return !c.manualStatus;
}

export function customerTasks(c: Customer, tasks: Task[]): Task[] {
  return tasks.filter((t) => t.customerId === c.id);
}

export function customerStatus(c: Customer, tasks: Task[], today: DateStr): CustomerStatusKey {
  if (c.manualStatus === 'completed') return 'completed';
  if (c.manualStatus === 'ticket_closed') return 'ticket_closed';
  if (c.manualStatus === 'paused') return 'paused';
  const mine = customerTasks(c, tasks);
  if (mine.some((t) => isMyOverdue(t, today))) return 'late';
  if (getCurrentPhase(c, mine, today) === null) return 'completed';
  return 'in_progress';
}

// ---------------- Giai đoạn ----------------

export type PhaseState = 'done' | 'current' | 'upcoming';

export interface PhaseInfo {
  phase: Phase;
  state: PhaseState;
  done: number;
  total: number;
  hasOverdue: boolean;
  hasWaiting: boolean;
}

export function phaseInfos(c: Customer, tasks: Task[], today: DateStr): PhaseInfo[] {
  const phases = [...c.phases].sort((a, b) => a.order - b.order);
  const mine = customerTasks(c, tasks);

  // Ngày bắt đầu sớm nhất của các việc không lặp, tính cho từng giai đoạn
  const firstStart = (code: string): DateStr | null => {
    const list = mine.filter((t) => t.phaseCode === code && !t.ruleId).map((t) => t.startDate);
    return list.length ? list.reduce((a, b) => (a < b ? a : b)) : null;
  };

  const infos: PhaseInfo[] = phases.map((phase, idx) => {
    const ts = mine.filter((t) => t.phaseCode === phase.code);
    const rules = c.recurringRules.filter((r) => r.phaseCode === phase.code);
    const nonRec = ts.filter((t) => !t.ruleId);
    const recDone = ts.filter((t) => t.ruleId && t.status === 'done').length;
    const expectedRec = rules.reduce((s, r) => s + ruleDates(r).length, 0);
    const done = nonRec.filter((t) => t.status === 'done').length + recDone;
    const total = nonRec.length + expectedRec;

    let allDone = nonRec.every((t) => t.status === 'done');
    if (allDone && rules.length) {
      // Giai đoạn có việc lặp: coi như xong khi mọi lần lặp đã sinh đều xong
      // và đã đến lúc giai đoạn sau bắt đầu (hoặc hết thời gian lặp).
      const recAllDone = ts.filter((t) => t.ruleId).every((t) => t.status === 'done');
      const later = phases
        .slice(idx + 1)
        .map((p) => firstStart(p.code))
        .filter((x): x is DateStr => !!x);
      const nextStart = later.length ? later.reduce((a, b) => (a < b ? a : b)) : null;
      const windowEnd = maxDate(rules.map((r) => r.endDate));
      const timeOver = (nextStart !== null && today >= nextStart) || (windowEnd !== null && today > windowEnd);
      allDone = recAllDone && timeOver;
    }
    if (nonRec.length === 0 && rules.length === 0) allDone = true;

    return {
      phase,
      state: allDone ? 'done' : 'upcoming',
      done,
      total,
      hasOverdue: ts.some((t) => isMyOverdue(t, today)),
      hasWaiting: ts.some((t) => t.status === 'waiting_customer' || t.status === 'waiting_audit'),
    };
  });

  const cur = infos.findIndex((i) => i.state !== 'done');
  if (cur >= 0) infos[cur].state = 'current';
  return infos;
}

export function getCurrentPhase(c: Customer, tasks: Task[], today: DateStr): Phase | null {
  const cur = phaseInfos(c, tasks, today).find((i) => i.state === 'current');
  return cur ? cur.phase : null;
}

// ---------------- Tiến độ ----------------

export function progress(c: Customer, tasks: Task[]): { done: number; total: number; percent: number } {
  const mine = customerTasks(c, tasks);
  const nonRec = mine.filter((t) => !t.ruleId);
  const rec = mine.filter((t) => t.ruleId);
  const expectedRec = c.recurringRules.reduce((s, r) => s + ruleDates(r).length, 0);
  const total = nonRec.length + Math.max(expectedRec, rec.length);
  const done = mine.filter((t) => t.status === 'done').length;
  const percent = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  return { done, total, percent };
}

// ---------------- Cảnh báo / rủi ro ----------------

export function aiErrorCount(c: Customer): number {
  return Math.max(0, c.aiErrors.length - c.aiErrorBaseline);
}

export function lastContactDate(c: Customer): DateStr {
  return maxDate(c.careLogs.map((l) => l.date)) ?? c.startDate;
}

export function daysSinceContact(c: Customer, today: DateStr): number {
  return Math.max(0, diffDays(today, lastContactDate(c)));
}

export function contactThreshold(c: Customer, s: Settings): number {
  return c.contactAlertDays ?? s.contactAlertDays;
}

export function lastActivityDate(c: Customer, tasks: Task[]): DateStr {
  const dates: DateStr[] = [c.startDate];
  for (const l of c.careLogs) dates.push(l.date);
  for (const t of customerTasks(c, tasks)) {
    if (t.doneAt) dates.push(t.doneAt);
    if (t.status !== 'todo') dates.push(t.updatedAt);
  }
  return maxDate(dates)!;
}

/** Số ngày khách đã ở trạng thái "Chờ khách" liên tục (theo việc chờ lâu nhất). */
export function customerWaitingDays(c: Customer, tasks: Task[], today: DateStr): number {
  const waits = customerTasks(c, tasks).filter((t) => t.status === 'waiting_customer' && t.waitingSince);
  if (!waits.length) return 0;
  const since = waits.map((t) => t.waitingSince!).reduce((a, b) => (a < b ? a : b));
  return Math.max(0, diffDays(today, since));
}

export type Severity = 'danger' | 'warning' | 'info';

export interface RiskReason {
  kind: 'overdue' | 'stale' | 'ai_errors' | 'waiting' | 'waiting_close';
  severity: Severity;
  text: string;
}

export function riskReasons(c: Customer, tasks: Task[], today: DateStr, s: Settings): RiskReason[] {
  if (!isActiveCustomer(c)) return [];
  const mine = customerTasks(c, tasks);
  const reasons: RiskReason[] = [];

  const overdue = mine.filter((t) => isMyOverdue(t, today));
  if (overdue.length) {
    const maxLate = Math.max(...overdue.map((t) => daysLate(t, today)));
    reasons.push({
      kind: 'overdue',
      severity: 'danger',
      text: `${overdue.length} việc quá hạn (trễ nhất ${maxLate} ngày)`,
    });
  }

  const errors = aiErrorCount(c);
  if (errors >= s.aiErrorThreshold) {
    reasons.push({ kind: 'ai_errors', severity: 'danger', text: `Lỗi AI phát sinh ${errors} lần (≥ ${s.aiErrorThreshold})` });
  }

  const waiting = customerWaitingDays(c, tasks, today);
  if (waiting >= s.waitingCloseDays) {
    reasons.push({
      kind: 'waiting_close',
      severity: 'danger',
      text: `Chờ khách ${waiting} ngày (đã đủ mốc ${s.waitingCloseDays} ngày — cân nhắc Tạm đóng ticket)`,
    });
  } else if (waiting >= s.waitingWarnDays) {
    reasons.push({
      kind: 'waiting',
      severity: 'warning',
      text: `Chờ khách ${waiting} ngày (sắp tới mốc ${s.waitingCloseDays} ngày)`,
    });
  }

  const idle = diffDays(today, lastActivityDate(c, tasks));
  if (idle >= s.staleDays) {
    reasons.push({ kind: 'stale', severity: 'warning', text: `${idle} ngày chưa có cập nhật nào` });
  }
  return reasons;
}

/** Điểm khẩn cấp để sắp xếp danh sách khách (cao = khẩn hơn). */
export function urgencyScore(c: Customer, tasks: Task[], today: DateStr, s: Settings): number {
  if (!isActiveCustomer(c)) return -1000;
  const mine = customerTasks(c, tasks);
  const overdue = mine.filter((t) => isMyOverdue(t, today));
  let score = 0;
  score += overdue.length * 100;
  if (overdue.length) score += Math.max(...overdue.map((t) => daysLate(t, today))) * 10;
  for (const r of riskReasons(c, tasks, today, s)) score += r.severity === 'danger' ? 50 : 20;
  const soon = mine.filter((t) => ['due_today', 'due_soon'].includes(taskState(t, today, s.dueSoonDays)));
  score += soon.length * 3;
  return score;
}
