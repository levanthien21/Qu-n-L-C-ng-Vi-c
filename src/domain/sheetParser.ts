export interface SheetStats {
  totalTasks: number;
  completedTasks: number;
  percent: number;
  currentPhase: string;
  tasks: { phase: string; name: string; done: boolean }[];
  overdueTasks: string[];
}

export function parseSheetData(data: Record<string, any[][]> | undefined): SheetStats {
  const result: SheetStats = {
    totalTasks: 0,
    completedTasks: 0,
    percent: 0,
    currentPhase: '',
    tasks: [],
    overdueTasks: [],
  };

  if (!data || Object.keys(data).length === 0) return result;

  // 1. Phân tích sheet Lộ trình triển khai để đếm tiến độ
  const loTrinh = data['Lộ trình triển khai'];
  if (loTrinh && loTrinh.length > 0) {
    let currentPhase = '';
    for (let i = 0; i < loTrinh.length; i++) {
      const row = loTrinh[i];
      if (row.length < 7) continue;

      const phase = String(row[0] || '').trim();
      const taskName = String(row[1] || '').trim();
      const done = row[6] === true || String(row[6]).toUpperCase() === 'TRUE';

      if (phase && !phase.toLowerCase().includes('giai đoạn')) {
        currentPhase = phase;
      }

      if (taskName && !taskName.toLowerCase().includes('hạng mục')) {
        result.tasks.push({ phase: currentPhase, name: taskName, done });
        result.totalTasks++;
        if (done) {
          result.completedTasks++;
        } else if (!result.currentPhase) {
          result.currentPhase = currentPhase;
        }
      }
    }
  }

  // 2. Phân tích sheet Timeline 30 ngày (hoặc 14 ngày) để tìm việc trễ hạn
  const timeline = data['Timeline 30 ngày'] || data['Timeline 14 ngày'];
  if (timeline && timeline.length > 0) {
    let nameIdx = -1,
      dateIdx = -1,
      statusIdx = -1;

    // Tìm cột Header
    for (let i = 0; i < Math.min(10, timeline.length); i++) {
      for (let j = 0; j < timeline[i].length; j++) {
        const val = String(timeline[i][j] || '').toLowerCase();
        if (val.includes('hạng mục') || val.includes('công việc')) nameIdx = j;
        if (val.includes('ngày hoàn thành') || val.includes('deadline')) dateIdx = j;
        if (val.includes('trạng thái')) statusIdx = j;
      }
      if (nameIdx >= 0 && dateIdx >= 0) break;
    }

    if (nameIdx >= 0 && dateIdx >= 0) {
      const todayStr = new Date().toISOString().substring(0, 10);
      for (let i = 0; i < timeline.length; i++) {
        const row = timeline[i];
        const name = String(row[nameIdx] || '').trim();
        const rawDate = row[dateIdx];
        const status = statusIdx >= 0 ? String(row[statusIdx] || '').trim().toLowerCase() : '';

        if (!name || name.toLowerCase().includes('hạng mục')) continue;
        if (status.includes('đã hoàn thành') || status.includes('xong') || status.includes('hoàn thành')) continue;

        if (rawDate) {
          let dateStr = '';
          // Nếu Google Script trả về string dạng ISO
          if (typeof rawDate === 'string' && rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateStr = rawDate.substring(0, 10);
          } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
            // dd/mm/yyyy
            const parts = rawDate.split('/');
            if (parts.length === 3) dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }

          if (dateStr && dateStr < todayStr) {
            result.overdueTasks.push(name + ` (Hạn: ${dateStr})`);
          }
        }
      }
    }
  }

  if (result.totalTasks > 0) {
    result.percent = Math.round((result.completedTasks / result.totalTasks) * 100);
  }
  if (!result.currentPhase) result.currentPhase = 'Đã hoàn thành';

  return result;
}
