import { createClient } from '@supabase/supabase-js';
import type { AppData, Customer, Settings, Task, Template } from '../domain/types';
import { normalizeData } from './localStorageRepository';
import type { Repository } from './repository';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseRepository implements Repository {
  private async read(): Promise<AppData | null> {
    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', localStorage.getItem('dvhl_workspace') || 'global')
        .single();
      
      if (error || !data) return null;
      return normalizeData(data.data as Partial<AppData>);
    } catch {
      return null;
    }
  }

  private async write(appData: AppData): Promise<void> {
    await supabase
      .from('app_data')
      .upsert({ id: localStorage.getItem('dvhl_workspace') || 'global', data: appData });
  }

  private async mutate(fn: (d: AppData) => void): Promise<void> {
    const d = (await this.read()) ?? normalizeData({});
    fn(d);
    await this.write(d);
  }

  async loadAll(): Promise<AppData | null> {
    return this.read();
  }

  async replaceAll(data: AppData): Promise<void> {
    await this.write(normalizeData(data));
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
