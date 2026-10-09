import { create } from 'zustand';
import { repository } from '../data';
import { normalizeData } from '../data/localStorageRepository';
import { buildDemoData } from '../data/seed/demoCustomers';
import { defaultTemplates } from '../data/seed/templates';
import { addDays, diffDays, todayStr } from '../domain/dates';
import type { DateStr } from '../domain/dates';
import {
  createCustomerFromTemplate,
  endDateOf,
  ensureRecurringTasks,
  markPastDone,
  uid,
} from '../domain/generateTasks';
import type { NewCustomerInput } from '../domain/generateTasks';
import { DEFAULT_SETTINGS } from '../domain/types';
import type {
  AppData,
  CareLog,
  Customer,
  ManualStatus,
  Settings,
  Task,
  TaskStatus,
  Template,
} from '../domain/types';

interface State {
  ready: boolean;
  today: DateStr;
  templates: Template[];
  customers: Customer[];
  tasks: Task[];
  settings: Settings;

  init(): Promise<void>;
  refreshToday(): void;

  // KhÃ¡ch hÃ ng
  addCustomer(input: NewCustomerInput, templateId: string, autoCompletePast: boolean): string | null;
  updateCustomer(id: string, patch: Partial<Customer>): void;
  deleteCustomer(id: string): void;
  setManualStatus(id: string, status: ManualStatus | null, note?: string): void;
  rescheduleStart(id: string, newStart: DateStr, reason: string): void;
  toggleMeetingConfirmed(id: string, no: 1 | 2 | 3): void;

  // Äáº§u viá»‡c
  setTaskStatus(taskId: string, status: TaskStatus): void;
  completeTask(taskId: string, overrideReason?: string): void;
  reopenTask(taskId: string): void;
  sendGateToAudit(taskId: string): void;
  gateResult(taskId: string, passed: boolean): void;
  unlockTask(taskId: string, reason: string): void;
  rescheduleTask(taskId: string, newStart: DateStr, newDeadline: DateStr, reason: string): void;
  updateTaskNote(taskId: string, note: string): void;
  addCustomTask(customerId: string, title: string, deadline: DateStr): string;
  deleteTask(taskId: string): void;
  moveCustomerToPhase(customerId: string, phaseCode: string | null): void;

  // Nháº­t kÃ½ / bÃ¡o cÃ¡o
  addCareLog(customerId: string, log: Omit<CareLog, 'id'>, createFollowUp: boolean): void;
  deleteCareLog(customerId: string, logId: string): void;
  createFollowUpFromLog(customerId: string, logId: string): void;
  updateTestReport(customerId: string, patch: Partial<Customer['testReport']>): void;
  addAIError(customerId: string, description: string): void;
  toggleAIErrorResolved(customerId: string, errId: string): void;
  deleteAIError(customerId: string, errId: string): void;
  resetAIErrorCycle(customerId: string): void;

  // Template & cÃ i Ä‘áº·t
  saveTemplate(t: Template): void;
  deleteTemplate(id: string): void;
  updateSettings(patch: Partial<Settings>): void;

  // Dá»¯ liá»‡u
  importAppData(data: Partial<AppData>): void;
  importCustomers(list: { input: NewCustomerInput; templateId: string }[], autoCompletePast: boolean): number;
  loadDemo(): void;
  removeDemo(): void;
  clearAll(): void;
}

function persistData(d: AppData) {
  void repository.replaceAll(d);
}

export const useStore = create<State>((set, get) => {
  /** Cáº­p nháº­t 1 khÃ¡ch, lÆ°u láº¡i */
  const patchCustomer = (id: string, fn: (c: Customer) => Customer) => {
    const c = get().customers.find((x) => x.id === id);
    if (!c) return;
    const next = fn(c);
    set({ customers: get().customers.map((x) => (x.id === id ? next : x)) });
    void repository.saveCustomer(next);
  };

  /** Cáº­p nháº­t 1 viá»‡c, lÆ°u láº¡i */
  const patchTask = (id: string, fn: (t: Task) => Task) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const next = fn(t);
    set({ tasks: get().tasks.map((x) => (x.id === id ? next : x)) });
    void repository.saveTasks([next]);
  };

  const addTasks = (list: Task[]) => {
    if (!list.length) return;
    set({ tasks: [...get().tasks, ...list] });
    void repository.saveTasks(list);
  };

  const applyTheme = (theme: Settings['theme']) => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  };

  const sweepRecurring = () => {
    const { customers, tasks, today } = get();
    const created: Task[] = [];
    for (const c of customers) {
      const mine = tasks.filter((t) => t.customerId === c.id);
      created.push(...ensureRecurringTasks(c, mine, today));
    }
    addTasks(created);
  };

  return {
    ready: false,
    today: todayStr(),
    templates: [],
    customers: [],
    tasks: [],
    settings: DEFAULT_SETTINGS,

    async init() {
      let data = await repository.loadAll();
      const today = todayStr();
      if (!data) {
        const templates = defaultTemplates();
        const demo = buildDemoData(templates, today);
        data = normalizeData({ templates, customers: [], tasks: [], settings: DEFAULT_SETTINGS });
        await repository.replaceAll(data);
      }
      set({
        ready: true,
        today,
        templates: data.templates,
        customers: data.customers,
        tasks: data.tasks,
        settings: data.settings,
      });
      applyTheme(data.settings.theme);
      sweepRecurring();
      // Tá»± cáº­p nháº­t khi sang ngÃ y má»›i hoáº·c khi quay láº¡i tab
      const onFocus = () => get().refreshToday();
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
      window.setInterval(onFocus, 5 * 60 * 1000);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(get().settings.theme));
    },

    refreshToday() {
      const t = todayStr();
      if (t !== get().today) {
        set({ today: t });
        sweepRecurring();
      }
    },

    // ---------------- KhÃ¡ch hÃ ng ----------------
    addCustomer(input, templateId, autoCompletePast) {
      
      
      const r = { customer: { id: Date.now().toString(), ...input, templateId: "", templateName: "", durationDays: 0, endDate: input.startDate, meetingConfirmed: {}, testReport: { testPageLink: "", simulatedConversations: 0, customerTestVideoLink: "", evidenceLinks: [] }, createdAt: new Date().toISOString(), phases: [], recurringRules: [], careLogs: [], aiErrors: [], manualStatus: undefined, isDemo: false, aiErrorBaseline: 0, rescheduleLogs: [] }, tasks: [] };
      set({ customers: [...get().customers, r.customer], tasks: [...get().tasks, ...r.tasks] });
      void repository.saveCustomer(r.customer);
      void repository.saveTasks(r.tasks);
      return r.customer.id;
    },

    updateCustomer(id, patch) {
      patchCustomer(id, (c) => ({ ...c, ...patch }));
    },

    deleteCustomer(id) {
      set({
        customers: get().customers.filter((c) => c.id !== id),
        tasks: get().tasks.filter((t) => t.customerId !== id),
      });
      void repository.deleteCustomer(id);
    },

    setManualStatus(id, status, note) {
      patchCustomer(id, (c) => ({ ...c, manualStatus: status ?? undefined, manualStatusNote: note ?? undefined }));
      if (!status) sweepRecurring();
    },

    rescheduleStart(id, newStart, reason) {
      const c = get().customers.find((x) => x.id === id);
      if (!c || newStart === c.startDate) return;
      const delta = diffDays(newStart, c.startDate);
      const changed: Task[] = [];
      const tasks = get().tasks.map((t) => {
        if (t.customerId !== id || t.status === 'done') return t;
        const nt = { ...t, startDate: addDays(t.startDate, delta), deadline: addDays(t.deadline, delta), updatedAt: get().today };
        changed.push(nt);
        return nt;
      });
      set({ tasks });
      void repository.saveTasks(changed);
      patchCustomer(id, (cu) => ({
        ...cu,
        startDate: newStart,
        endDate: endDateOf(newStart, cu.durationDays),
        recurringRules: cu.recurringRules.map((r) => ({
          ...r,
          startDate: addDays(r.startDate, delta),
          endDate: addDays(r.endDate, delta),
        })),
        rescheduleLogs: [
          ...cu.rescheduleLogs,
          { id: uid('rs'), scope: 'start', oldStart: cu.startDate, newStart, reason, at: new Date().toISOString() },
        ],
      }));
    },

    toggleMeetingConfirmed(id, no) {
      patchCustomer(id, (c) => ({ ...c, meetingConfirmed: { ...c.meetingConfirmed, [String(no)]: !c.meetingConfirmed[String(no)] } }));
    },

    // ---------------- Äáº§u viá»‡c ----------------
    setTaskStatus(taskId, status) {
      const today = get().today;
      patchTask(taskId, (t) => {
        const wasWaiting = t.status === 'waiting_customer' || t.status === 'waiting_audit';
        const isWaiting = status === 'waiting_customer' || status === 'waiting_audit';
        return {
          ...t,
          status,
          waitingSince: isWaiting ? (wasWaiting && t.waitingSince ? t.waitingSince : today) : undefined,
          doneAt: status === 'done' ? today : undefined,
          gatePassed: status === 'done' && t.isGate ? true : t.isGate && status !== 'done' ? undefined : t.gatePassed,
          updatedAt: today,
        };
      });
    },

    completeTask(taskId, overrideReason) {
      const today = get().today;
      patchTask(taskId, (t) => ({
        ...t,
        status: 'done',
        doneAt: today,
        waitingSince: undefined,
        gatePassed: t.isGate ? true : t.gatePassed,
        unlockReason: overrideReason ?? t.unlockReason,
        updatedAt: today,
      }));
    },

    reopenTask(taskId) {
      const today = get().today;
      patchTask(taskId, (t) => ({ ...t, status: 'todo', doneAt: undefined, gatePassed: undefined, updatedAt: today }));
    },

    sendGateToAudit(taskId) {
      const today = get().today;
      patchTask(taskId, (t) => ({ ...t, status: 'waiting_audit', waitingSince: today, doneAt: undefined, gatePassed: undefined, updatedAt: today }));
    },

    gateResult(taskId, passed) {
      const today = get().today;
      patchTask(taskId, (t) =>
        passed
          ? { ...t, status: 'done', doneAt: today, gatePassed: true, waitingSince: undefined, updatedAt: today }
          : {
              ...t,
              status: 'doing',
              gatePassed: false,
              waitingSince: undefined,
              doneAt: undefined,
              auditFailCount: (t.auditFailCount ?? 0) + 1,
              updatedAt: today,
            },
      );
    },

    unlockTask(taskId, reason) {
      patchTask(taskId, (t) => ({ ...t, unlockReason: reason, updatedAt: get().today }));
    },

    rescheduleTask(taskId, newStart, newDeadline, reason) {
      const t = get().tasks.find((x) => x.id === taskId);
      if (!t) return;
      const log = {
        id: uid('rs'),
        scope: 'task' as const,
        taskId,
        taskTitle: t.title,
        oldStart: t.startDate,
        newStart,
        oldDeadline: t.deadline,
        newDeadline,
        reason,
        at: new Date().toISOString(),
      };
      patchTask(taskId, (x) => ({ ...x, startDate: newStart, deadline: newDeadline, updatedAt: get().today }));
      patchCustomer(t.customerId, (c) => ({ ...c, rescheduleLogs: [...c.rescheduleLogs, log] }));
    },

    updateTaskNote(taskId, note) {
      patchTask(taskId, (t) => ({ ...t, note }));
    },

    addCustomTask(customerId, title, deadline) {
      const c = get().customers.find((x) => x.id === customerId);
      const today = get().today;
      const id = uid('task');
      const phaseCode = c ? (c.phases[0]?.code ?? '') : '';
      const task: Task = {
        id,
        customerId,
        phaseCode,
        tag: c?.phases.find((p) => p.code === phaseCode)?.tag ?? '',
        title,
        order: 9999,
        startDate: today,
        deadline,
        status: 'todo',
        isGate: false,
        isRequired: false,
        isCustom: true,
        updatedAt: today,
      };
      addTasks([task]);
      return id;
    },

    deleteTask(taskId) {
      set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
      void repository.deleteTasks([taskId]);
    },

    moveCustomerToPhase(customerId, phaseCode) {
      const c = get().customers.find((x) => x.id === customerId);
      if (!c) return;
      const today = get().today;
      const phases = [...c.phases].sort((a, b) => a.order - b.order);
      const targetOrder = phaseCode === null ? Infinity : (phases.find((p) => p.code === phaseCode)?.order ?? Infinity);
      const orderOf = (code: string) => phases.find((p) => p.code === code)?.order ?? 0;
      const changed: Task[] = [];
      const tasks = get().tasks.map((t) => {
        if (t.customerId !== customerId) return t;
        const o = orderOf(t.phaseCode);
        if (o < targetOrder && t.status !== 'done' && !t.ruleId) {
          const nt: Task = { ...t, status: 'done', doneAt: today, gatePassed: t.isGate ? true : t.gatePassed, unlockReason: t.unlockReason ?? (t.isGate ? 'Chuyá»ƒn giai Ä‘oáº¡n thá»§ cÃ´ng (Kanban)' : undefined), updatedAt: today };
          changed.push(nt);
          return nt;
        }
        if (o >= targetOrder && t.status === 'done' && !t.skipped) {
          const nt: Task = { ...t, status: 'todo', doneAt: undefined, gatePassed: undefined, updatedAt: today };
          changed.push(nt);
          return nt;
        }
        return t;
      });
      set({ tasks });
      void repository.saveTasks(changed);
    },

    // ---------------- Nháº­t kÃ½ / bÃ¡o cÃ¡o ----------------
    addCareLog(customerId, log, createFollowUp) {
      const full: CareLog = { ...log, id: uid('cl') };
      patchCustomer(customerId, (c) => ({ ...c, careLogs: [...c.careLogs, full] }));
      if (createFollowUp && log.followUp.trim()) get().createFollowUpFromLog(customerId, full.id);
    },

    deleteCareLog(customerId, logId) {
      patchCustomer(customerId, (c) => ({ ...c, careLogs: c.careLogs.filter((l) => l.id !== logId) }));
    },

    createFollowUpFromLog(customerId, logId) {
      const c = get().customers.find((x) => x.id === customerId);
      const log = c?.careLogs.find((l) => l.id === logId);
      if (!c || !log || !log.followUp.trim()) return;
      const deadline = log.followUpDate || addDays(get().today, 1);
      const taskId = get().addCustomTask(customerId, `Follow-up: ${log.followUp}`, deadline);
      patchCustomer(customerId, (cu) => ({
        ...cu,
        careLogs: cu.careLogs.map((l) => (l.id === logId ? { ...l, followUpTaskId: taskId, followUpDate: deadline } : l)),
      }));
    },

    updateTestReport(customerId, patch) {
      patchCustomer(customerId, (c) => ({ ...c, testReport: { ...c.testReport, ...patch } }));
    },

    addAIError(customerId, description) {
      patchCustomer(customerId, (c) => ({
        ...c,
        aiErrors: [...c.aiErrors, { id: uid('err'), date: get().today, description, resolved: false }],
      }));
    },

    toggleAIErrorResolved(customerId, errId) {
      patchCustomer(customerId, (c) => ({
        ...c,
        aiErrors: c.aiErrors.map((e) => (e.id === errId ? { ...e, resolved: !e.resolved } : e)),
      }));
    },

    deleteAIError(customerId, errId) {
      patchCustomer(customerId, (c) => {
        const idx = c.aiErrors.findIndex((e) => e.id === errId);
        return {
          ...c,
          aiErrors: c.aiErrors.filter((e) => e.id !== errId),
          aiErrorBaseline: idx >= 0 && idx < c.aiErrorBaseline ? c.aiErrorBaseline - 1 : c.aiErrorBaseline,
        };
      });
    },

    resetAIErrorCycle(customerId) {
      patchCustomer(customerId, (c) => ({
        ...c,
        aiErrorBaseline: c.aiErrors.length,
        aiErrors: c.aiErrors.map((e) => ({ ...e, resolved: true })),
      }));
    },

    // ---------------- Template & cÃ i Ä‘áº·t ----------------
    saveTemplate(t) {
      const exists = get().templates.some((x) => x.id === t.id);
      set({ templates: exists ? get().templates.map((x) => (x.id === t.id ? t : x)) : [...get().templates, t] });
      void repository.saveTemplate(t);
    },

    deleteTemplate(id) {
      set({ templates: get().templates.filter((t) => t.id !== id) });
      void repository.deleteTemplate(id);
    },

    updateSettings(patch) {
      const s = { ...get().settings, ...patch };
      set({ settings: s });
      void repository.saveSettings(s);
      applyTheme(s.theme);
    },

    // ---------------- Dá»¯ liá»‡u ----------------
    importAppData(data) {
      const d = normalizeData(data);
      if (!d.templates.length) d.templates = defaultTemplates();
      set({ templates: d.templates, customers: d.customers, tasks: d.tasks, settings: d.settings });
      persistData(d);
      applyTheme(d.settings.theme);
      sweepRecurring();
    },

    importCustomers(list, autoCompletePast) {
      let n = 0;
      const customers: Customer[] = [];
      const tasks: Task[] = [];
      for (const item of list) {
        const template = get().templates.find((t) => t.id === item.templateId);
        if (!template) continue;
        const r = createCustomerFromTemplate(item.input, template, { today: get().today, autoCompletePast });
        customers.push(r.customer);
        tasks.push(...r.tasks);
        n++;
      }
      set({ customers: [...get().customers, ...customers], tasks: [...get().tasks, ...tasks] });
      for (const c of customers) void repository.saveCustomer(c);
      void repository.saveTasks(tasks);
      return n;
    },

    loadDemo() {
      const demo = buildDemoData(get().templates.length ? get().templates : defaultTemplates(), get().today);
      const existing = new Set(get().customers.map((c) => c.id));
      const customers = demo.customers.filter((c) => !existing.has(c.id));
      const ids = new Set(customers.map((c) => c.id));
      const tasks = demo.tasks.filter((t) => ids.has(t.customerId));
      set({ customers: [...get().customers, ...customers], tasks: [...get().tasks, ...tasks] });
      for (const c of customers) void repository.saveCustomer(c);
      void repository.saveTasks(tasks);
    },

    removeDemo() {
      const ids = new Set(get().customers.filter((c) => c.isDemo).map((c) => c.id));
      set({
        customers: get().customers.filter((c) => !ids.has(c.id)),
        tasks: get().tasks.filter((t) => !ids.has(t.customerId)),
      });
      for (const id of ids) void repository.deleteCustomer(id);
    },

    clearAll() {
      const templates = get().templates;
      set({ customers: [], tasks: [] });
      persistData({ version: 1, templates, customers: [], tasks: [], settings: get().settings });
    },
  };
});

export { markPastDone };
