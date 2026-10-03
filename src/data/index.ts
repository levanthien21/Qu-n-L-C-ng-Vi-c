import { LocalStorageRepository } from './localStorageRepository';
import type { Repository } from './repository';

/** Đổi dòng này sang SupabaseRepository ở giai đoạn 2. */
export const repository: Repository = new LocalStorageRepository();
