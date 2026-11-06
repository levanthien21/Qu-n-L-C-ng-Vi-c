export interface SheetStats {
  totalTasks: number;
  completedTasks: number;
  percent: number;
  currentPhase: string;
  tasks: { phase: string; name: string; done: boolean }[];
  milestones: { name: string; start: string; end: string; status: string }[];
  startDate: string | null;
  durationDays: number;
}

export function parseSheetData(data: Record<string, any[][]> | undefined): SheetStats {
  const result: SheetStats = {
    totalTasks: 0,
    completedTasks: 0,
    percent: 0,
    currentPhase: '',
    tasks: [],
    milestones: [],
    startDate: null,
    durationDays: 30,
  };

  if (!data || Object.keys(data).length === 0) return result;

  const formatDate = (rawDate: any): string => {
    if (!rawDate) return '';
    if (typeof rawDate === 'string') {
      if (rawDate.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        return rawDate.substring(0, 10);
      }
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return String(rawDate);
  };

  const loTrinhKey = Object.keys(data).find((k) => {
    const norm = k.trim().toLowerCase();
    return norm.includes('lộ trình') || norm.includes('lo trinh');
  });
  const loTrinh = loTrinhKey ? data[loTrinhKey] : undefined;
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

  const timelineKey = Object.keys(data).find((k) => k.trim().toLowerCase().includes('timeline'));
  const timeline = timelineKey ? data[timelineKey] : undefined;

  if (timelineKey) {
    const kNorm = timelineKey.trim().toLowerCase();
    if (kNorm.includes('14')) {
      result.durationDays = 14;
    } else if (kNorm.includes('30')) {
      result.durationDays = 30;
    } else if (timeline && timeline.length > 1) {
      const r1 = timeline[1] || [];
      const tongIdx = r1.findIndex((c: any) => String(c).trim().toLowerCase() === 'tổng');
      if (tongIdx >= 0 && r1[tongIdx + 1] && !isNaN(Number(r1[tongIdx + 1]))) {
        result.durationDays = Number(r1[tongIdx + 1]);
      }
    }
  }

  if (timeline && timeline.length > 0) {
    let mIdx = timeline.findIndex((r: any[]) => {
      const c0 = String(r[0] || '').trim().toLowerCase();
      const c1 = String(r[1] || '').trim().toLowerCase();
      return (c0 === 'giai đoạn' || c0 === 'giai doan') && c1.includes('bắt đầu');
    });
    if (mIdx >= 0) {
      for (let i = mIdx + 1; i < mIdx + 15; i++) {
        if (!timeline[i] || !timeline[i][0] || String(timeline[i][0]).trim() === '') break;
        const mName = String(timeline[i][0]).trim();
        const mStart = formatDate(timeline[i][1]);
        const mEnd = formatDate(timeline[i][2]);
        const mStatus = String(timeline[i][4] || '').trim();
        
        if (mName) {
           result.milestones.push({ name: mName, start: mStart, end: mEnd, status: mStatus });
        }

        if ((mName.toLowerCase().includes('kick-off') || mName.toLowerCase().includes('kick off')) && !result.startDate) {
          result.startDate = mStart || mEnd || null;
        }
      }
    }
  }

  // ---- B2C (7 ngày): không có tab Timeline -> dựng lịch trình từ tab "Bàn giao & SLA" + "Hướng dẫn" ----
  if (result.milestones.length === 0) {
    const findTab = (kw: string) => {
      const k = Object.keys(data).find((x) => x.trim().toLowerCase().includes(kw));
      return k ? data[k] : undefined;
    };
    const labelValue = (rows: any[][] | undefined, label: string): string => {
      if (!rows) return '';
      for (const r of rows) {
        if (String(r[0] || '').trim().toLowerCase().startsWith(label)) {
          const v = r.slice(1).find((c) => c !== '' && c !== null && c !== undefined);
          return v === undefined ? '' : formatDate(v);
        }
      }
      return '';
    };
    const sla = findTab('bàn giao');
    const guide = findTab('hướng dẫn');
    const start = labelValue(sla, 'ngày bắt đầu');
    const handover = labelValue(sla, 'ngày bàn giao');
    const guideDate = labelValue(guide, 'ngày / giờ') || labelValue(guide, 'ngày');
    const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

    if (isDate(start)) {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      // Checklist bàn giao: các dòng có STT số, cột D = BBH xác nhận
      const items = (sla || []).filter((r) => /^\d+$/.test(String(r[0]).trim()) && typeof r[3] === 'boolean');
      const handoverDone = items.length > 0 && items.every((r) => r[3] === true);
      const st = (done: boolean, doing = false) => (done ? 'Hoàn thành' : doing ? 'Đang thực hiện' : 'Chưa bắt đầu');
      const g = isDate(guideDate) ? guideDate : start;
      const guideDone = g <= today || handoverDone;
      const end = isDate(handover) ? handover : start;

      result.milestones = [
        { name: 'Kick-off', start, end: start, status: st(start <= today || handoverDone) },
        { name: 'Buổi 2 (Hướng dẫn sử dụng)', start: g, end: g, status: st(guideDone) },
        { name: 'Setup & Test', start: g, end, status: st(handoverDone, guideDone) },
        { name: 'Nghiệm thu', start: end, end, status: st(handoverDone) },
      ];
      result.startDate = start;
      result.durationDays = 7;
      if (!result.totalTasks && items.length) {
        result.totalTasks = items.length;
        result.completedTasks = items.filter((r) => r[3] === true).length;
      }
    }
  }

  if (result.totalTasks > 0) {
    result.percent = Math.round((result.completedTasks / result.totalTasks) * 100);
  }
  if (!result.currentPhase) result.currentPhase = 'Đã hoàn thành';

  return result;
}
