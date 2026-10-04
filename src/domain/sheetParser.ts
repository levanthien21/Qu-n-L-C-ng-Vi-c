export interface SheetStats {
  totalTasks: number;
  completedTasks: number;
  percent: number;
  currentPhase: string;
  tasks: { phase: string; name: string; done: boolean }[];
  overdueTasks: string[];
  milestones: { name: string; start: string; end: string; status: string }[];
}

export function parseSheetData(data: Record<string, any[][]> | undefined): SheetStats {
  const result: SheetStats = {
    totalTasks: 0,
    completedTasks: 0,
    percent: 0,
    currentPhase: '',
    tasks: [],
    overdueTasks: [],
    milestones: [],
  };

  if (!data || Object.keys(data).length === 0) return result;

  const formatDate = (rawDate: any): string => {
    if (!rawDate) return '';
    if (typeof rawDate === 'string' && rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      return rawDate.substring(0, 10);
    } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return String(rawDate);
  };

  // 1. PhÃ¢n tÃ­ch sheet Lá»™ trÃ¬nh triá»ƒn khai
  const loTrinh = data['Lá»™ trÃ¬nh triá»ƒn khai'];
  if (loTrinh && loTrinh.length > 0) {
    let currentPhase = '';
    for (let i = 0; i < loTrinh.length; i++) {
      const row = loTrinh[i];
      if (row.length < 7) continue;

      const phase = String(row[0] || '').trim();
      const taskName = String(row[1] || '').trim();
      const done = row[6] === true || String(row[6]).toUpperCase() === 'TRUE';

      if (phase && !phase.toLowerCase().includes('giai Ä‘oáº¡n')) {
        currentPhase = phase;
      }

      if (taskName && !taskName.toLowerCase().includes('háº¡ng má»¥c')) {
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

  // 2. PhÃ¢n tÃ­ch sheet Timeline 30 ngÃ y (hoáº·c 14 ngÃ y)
  const timeline = data['Timeline 30 ngÃ y '] || data['Timeline 30 ngÃ y'] || data['Timeline 14 ngÃ y '] || data['Timeline 14 ngÃ y'];
  if (timeline && timeline.length > 0) {
    // 2.1 TÃ¬m báº£ng Lá»ŠCH GIAI ÄOáº N (Milestones)
    let mIdx = timeline.findIndex((r: any[]) => String(r[0]).trim() === 'Giai Ä‘oáº¡n' && String(r[1]).trim() === 'Báº¯t Ä‘áº§u');
    if (mIdx >= 0) {
      for (let i = mIdx + 1; i < mIdx + 10; i++) {
        if (!timeline[i] || !timeline[i][0]) break;
        const mName = String(timeline[i][0]).trim();
        const mStart = formatDate(timeline[i][1]);
        const mEnd = formatDate(timeline[i][2]);
        const mStatus = String(timeline[i][4] || '').trim();
        if (['Kick-off', 'Buá»•i 2', 'Nghiá»‡m thu'].includes(mName)) {
           result.milestones.push({ name: mName, start: mStart, end: mEnd, status: mStatus });
        }
      }
    }

    // 2.2 TÃ¬m viá»‡c trá»… háº¡n
    let nameIdx = -1, dateIdx = -1, statusIdx = -1;
    for (let i = 0; i < Math.min(20, timeline.length); i++) {
      for (let j = 0; j < timeline[i].length; j++) {
        const val = String(timeline[i][j] || '').toLowerCase();
        if (val.includes('háº¡ng má»¥c') || val.includes('cÃ´ng viá»‡c')) nameIdx = j;
        if (val.includes('ngÃ y hoÃ n thÃ nh') || val.includes('deadline')) dateIdx = j;
        if (val.includes('tráº¡ng thÃ¡i')) statusIdx = j;
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

        if (!name || name.toLowerCase().includes('háº¡ng má»¥c')) continue;
        if (status.includes('Ä‘Ã£ hoÃ n thÃ nh') || status.includes('xong') || status.includes('hoÃ n thÃ nh')) continue;

        if (rawDate) {
          let dateStr = '';
          if (typeof rawDate === 'string' && rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateStr = rawDate.substring(0, 10);
          } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }

          if (dateStr && dateStr < todayStr) {
            result.overdueTasks.push(name + ` (Háº¡n: ${dateStr})`);
          }
        }
      }
    }
  }

  if (result.totalTasks > 0) {
    result.percent = Math.round((result.completedTasks / result.totalTasks) * 100);
  }
  if (!result.currentPhase) result.currentPhase = 'ÄÃ£ hoÃ n thÃ nh';

  return result;
}
