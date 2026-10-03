import { DEFAULT_SETTINGS } from '../domain/types';
import type { AppData, Customer, Settings, Task, Template } from '../domain/types';
import { DATA_VERSION } from './repository';
import type { Repository } from './repository';

const STORAGE_KEY = 'onboarding-tracker:v1';

export function normalizeData(raw: Partial<AppData>): AppData {
  return {
    version: DATA_VERSION,
    templates: raw.templates ?? [],
    customers: (raw.customers ?? []).map((c) => ({
      ...c,
      meetingConfirmed: c.meetingConfirmed ?? { '1': false, '2': false, '3': false },
      recurringRules: c.recurringRules ?? [],
      careLogs: c.careLogs ?? [],
      aiErrors: c.aiErrors ?? [],
      aiErrorBaseline: c.aiErrorBaseline ?? 0,
      rescheduleLogs: c.rescheduleLogs ?? [],
      testReport: c.testReport ?? { testPageLink: '', simulatedConversations: 0, evidenceLinks: [] },
    })),
    tasks: raw.tasks ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
  };
}

export class LocalStorageRepository implements Repository {
  private read(): AppData | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return null;
      return normalizeData(JSON.parse(text));
    } catch {
      return null;
    }
  }

  private write(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private mutate(fn: (d: AppData) => void): Promise<void> {
    const d = this.read() ?? normalizeData({});
    fn(d);
    this.write(d);
    return Promise.resolve();
  }

  async loadAll(): Promise<AppData | null> {
    return this.read();
  }

  async replaceAll(data: AppData): Promise<void> {
    this.write(normalizeData(data));
  }

  saveCustomer(customer: Customer): Promise<void> {
    return this.mutate((d) => {
      const i = d.customers.findIndex((c) => c.id === customer.id);
      if (i >= 0) d.customers[i] = customer;
      else d.customers.push(customer);
    });
  }

  deleteCustomer(customerId: string): Promise<void> {
    return this.mutate((d) => {
      d.customers = d.customers.filter((c) => c.id !== customerId);
      d.tasks = d.tasks.filter((t) => t.customerId !== customerId);
    });
  }

  saveTasks(tasks: Task[]): Promise<void> {
    return this.mutate((d) => {
      const map = new Map(d.tasks.map((t, i) => [t.id, i] as const));
      for (const t of tasks) {
        const i = map.get(t.id);
        if (i !== undefined) d.tasks[i] = t;
        else {
          map.set(t.id, d.tasks.length);
          d.tasks.push(t);
        }
      }
    });
  }

  deleteTasks(taskIds: string[]): Promise<void> {
    const set = new Set(taskIds);
    return this.mutate((d) => {
      d.tasks = d.tasks.filter((t) => !set.has(t.id));
    });
  }

  saveTemplate(template: Template): Promise<void> {
    return this.mutate((d) => {
      const i = d.templates.findIndex((t) => t.id === template.id);
      if (i >= 0) d.templates[i] = template;
      else d.templates.push(template);
    });
  }

  deleteTemplate(templateId: string): Promise<void> {
    return this.mutate((d) => {
      d.templates = d.templates.filter((t) => t.id !== templateId);
    });
  }

  saveSettings(settings: Settings): Promise<void> {
    return this.mutate((d) => {
      d.settings = settings;
    });
  }
}
