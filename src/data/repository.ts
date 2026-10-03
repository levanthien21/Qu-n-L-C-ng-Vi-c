import type { AppData, Customer, Settings, Task, Template } from '../domain/types';

/**
 * Lớp truy cập dữ liệu. MVP dùng localStorage; giai đoạn 2 chỉ cần viết thêm
 * một lớp `SupabaseRepository` cùng interface này rồi đổi ở `data/index.ts`.
 * Tất cả hàm đều async để khớp với backend thật.
 */
export interface Repository {
  /** Trả về null nếu chưa có dữ liệu (lần chạy đầu tiên). */
  loadAll(): Promise<AppData | null>;
  replaceAll(data: AppData): Promise<void>;
  saveCustomer(customer: Customer): Promise<void>;
  /** Xóa khách và toàn bộ đầu việc của khách đó. */
  deleteCustomer(customerId: string): Promise<void>;
  saveTasks(tasks: Task[]): Promise<void>;
  deleteTasks(taskIds: string[]): Promise<void>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
}

export const DATA_VERSION = 1;
