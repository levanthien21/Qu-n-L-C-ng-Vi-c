import type { Anchor, Phase, Recurrence, Template, TaskTemplate, TaskFeature, TaskCondition } from '../../domain/types';

export const TEMPLATE_30_ID = 'tpl-30';
export const TEMPLATE_14_ID = 'tpl-14';

interface TaskSpec {
  key: string;
  phase: string; // mã giai đoạn
  title: string;
  s: number; // day_start
  d: number; // day_deadline
  sa?: Anchor;
  da?: Anchor;
  gate?: boolean;
  req?: boolean;
  rec?: Recurrence;
  weekday?: number;
  meeting?: 1 | 2 | 3;
  requires?: string; // key của gate
  feature?: TaskFeature;
  condition?: TaskCondition;
}

const PHASES: Omit<Phase, 'id' | 'order'>[] = [
  { code: 'I', name: 'Nhận thông tin & chuẩn bị', tag: 'DV-Gets', note: 'tối đa 1 ngày' },
  { code: 'II.1', name: 'Khảo sát, phân tích & nâng cấp gói (Meeting buổi 1)', tag: 'DV-Gets', note: 'tối đa 1 ngày' },
  { code: 'II.2', name: 'Chuẩn bị môi trường & tài khoản (Meeting buổi 2)', tag: 'DV-Gets', note: 'ngay sau khảo sát' },
  { code: 'II.3', name: 'Chuẩn bị file training AI', tag: 'DV – CB Kiến Thức' },
  { code: 'II.4', name: 'Xây dựng Prompt AI', tag: 'DV – Prompt' },
  { code: 'II.5', name: 'Tạo page demo & test AI', tag: 'DV – Set AI', note: '3–5 ngày' },
  { code: 'II.6', name: 'Test AI với khách', tag: 'DV – Test AI' },
  { code: 'III', name: 'Triển khai thực tế', tag: 'DV – Actual Run', note: 'đến hết thời gian gói' },
  { code: 'IV', name: 'Bàn giao & nghiệm thu (Meeting buổi 3)', tag: 'DV – Done', note: 'bắt đầu trước ngày kết thúc 3–4 ngày' },
  { code: 'V', name: 'Báo cáo & hậu kiểm', tag: 'DV – Done' },
];

const E: Anchor = 'end';

const TASKS_30: TaskSpec[] = [
  // ===== Giai đoạn I =====
  { key: 'i1', phase: 'I', title: 'Tiếp nhận khách từ nhóm Support nội bộ', s: 0, d: 0 },
  { key: 'i2', phase: 'I', title: 'Vào nhóm chào hỏi, giới thiệu, hẹn lịch hỗ trợ trong vòng 15 phút sau khi tiếp nhận', s: 0, d: 0 },
  { key: 'i3', phase: 'I', title: 'Tạo ghi chú các chức năng cần triển khai lên nhóm triển khai Retion', s: 0, d: 1 },
  { key: 'i4', phase: 'I', title: 'Ghi chú gói DVHL, thời gian bắt đầu, thời gian kết thúc', s: 0, d: 1 },
  { key: 'i5', phase: 'I', title: 'Gắn tag DV-Gets cho nhóm vừa ghi chú', s: 0, d: 1 },
  { key: 'i6', phase: 'I', title: 'Điền thông tin khách vào file "Khách hàng - DV Huấn Luyện AI"', s: 0, d: 1 },
  { key: 'i7', phase: 'I', title: 'Tạo file gửi khách: Sheet tổng hợp (Timeline triển khai theo mẫu phù hợp gói, Kiến thức AI theo mẫu, Link tổng hợp triển khai dự án)', s: 0, d: 1 },
  { key: 'i8', phase: 'I', title: 'Tạo link tổng hợp "[Tên nhóm] - gói DVHL" và ghim lên CRM theo ID sale cung cấp', s: 0, d: 1 },
  {
    key: 'i9', phase: 'I', req: true, s: 0, d: 1,
    title: 'Tạo Prompt AI theo Prompt mẫu v2.1 (KHÔNG gửi cho khách). Checklist bắt buộc: thông tin doanh nghiệp; STK/thông tin thanh toán; cách chào hỏi; cách xưng hô; quy tắc tư vấn; bảo mật, không cung cấp thông tin nội bộ; không tự bịa khuyến mãi, giá tiền',
  },
  { key: 'i10', phase: 'I', title: 'Phân bổ thứ tự công việc rõ ràng và gắn tag theo từng giai đoạn', s: 1, d: 1 },

  // ===== II.1 =====
  { key: 'ii1a', phase: 'II.1', title: 'Họp kick-off (MEETING BUỔI 1), khảo sát theo bảng "[Tên nhóm] - gói DVHL"', s: 1, d: 1, meeting: 1, req: true },
  { key: 'ii1b', phase: 'II.1', title: 'Điền ngày tháng vào timeline; gửi tin nhắn xác nhận lên nhóm kèm record và thời gian cụ thể theo timeline', s: 1, d: 1 },
  { key: 'ii1c', phase: 'II.1', title: 'Clear với khách các thông tin trong doc "Clear với khách từ ban đầu"', s: 1, d: 1, req: true },
  { key: 'ii1d', phase: 'II.1', title: 'Note thông tin gói lên nhóm Retion (ID QTV, ID tổ chức...)', s: 1, d: 1 },
  { key: 'ii1e', phase: 'II.1', title: 'Nếu khách thanh toán chưa đủ: tạo nhắc lịch theo dõi nhắc thanh toán', s: 1, d: 1, condition: 'payment_partial' },
  { key: 'ii1f', phase: 'II.1', title: 'Gắn tag DV-Gets; thông báo bắt đầu DVHL và tạo ticket DVHL', s: 1, d: 1 },
  { key: 'ii1g', phase: 'II.1', title: 'Hẹn lịch hướng dẫn sử dụng Retion (1–2 giờ) cho Buổi 2', s: 1, d: 1 },

  // ===== II.2 =====
  { key: 'ii2a', phase: 'II.2', title: 'Thêm tài khoản support phụ trách vào tổ chức của khách để lấy hội thoại làm prompt, test AI', s: 1, d: 2, req: true },
  { key: 'ii2b', phase: 'II.2', title: 'Họp buổi 2 (MEETING BUỔI 2): điền đủ thông tin, yêu cầu khách xác nhận vào sheet tương ứng trong Lộ trình triển khai', s: 2, d: 2, meeting: 2, req: true },

  // ===== II.3 =====
  { key: 'ii3a', phase: 'II.3', title: 'Gửi file mẫu kiến thức và hướng dẫn cách điền', s: 2, d: 2 },
  { key: 'ii3b', phase: 'II.3', title: 'Xác nhận ai là người phụ trách làm kiến thức phía khách', s: 2, d: 3 },
  { key: 'ii3c', phase: 'II.3', title: 'Deadline khách điền kiến thức (3–5 ngày): báo rõ khách; chuyển trạng thái "Chờ khách"', s: 2, d: 7, req: true },

  // ===== II.4 =====
  { key: 'ii4a', phase: 'II.4', title: 'Xin thông tin quy trình tư vấn bán hàng, thông tin nội bộ, trường hợp đặc biệt', s: 3, d: 5 },
  { key: 'ii4b', phase: 'II.4', title: 'Support làm prompt theo thông tin nhận được', s: 5, d: 7, req: true },

  // ===== II.5 =====
  { key: 'ii5a', phase: 'II.5', title: 'Tạo page demo; báo khách cụ thể ngày gửi page test', s: 5, d: 6 },
  { key: 'ii5b', phase: 'II.5', title: 'Thông báo lên nhóm đang test AI thời gian công việc này (3–5 ngày)', s: 5, d: 6 },
  {
    key: 'ii5c', phase: 'II.5', s: 6, d: 9, req: true, feature: 'testCounter',
    title: 'BẮT BUỘC giả lập 30–50 tình huống tư vấn thực tế của khách trên page của khách, chỉnh prompt; chụp bằng chứng test và link page test đưa lên timeboxing',
  },
  { key: 'ii5d', phase: 'II.5', title: 'Ghi link test và số hội thoại đã test vào báo cáo', s: 9, d: 10, req: true, feature: 'testCounter' },
  {
    key: 'gate25', phase: 'II.5', s: 9, d: 10, gate: true, req: true,
    title: 'CỔNG KIỂM SOÁT: gửi nhóm Hậu Kiểm kiểm tra chất lượng — chỉ khi Audit đánh giá đạt mới được gửi khách test',
  },

  // ===== II.6 =====
  { key: 'ii6a', phase: 'II.6', title: 'Gửi page demo cho khách, nói rõ khách test trên tâm thế một khách hàng chứ không phải người tìm lỗi', s: 10, d: 10, requires: 'gate25', req: true },
  { key: 'ii6b', phase: 'II.6', title: 'Theo dõi khách test; nếu AI lỗi nhiều: báo khách tạm ngưng, quay lại quy trình test 1–2 ngày, tăng cường test hoàn thiện trong 2–3 ngày', s: 10, d: 13, requires: 'gate25' },
  { key: 'ii6c', phase: 'II.6', title: 'Xác nhận đưa lên page chính; trao đổi nhanh 15 phút các lưu ý', s: 12, d: 13, requires: 'gate25', req: true },
  { key: 'ii6d', phase: 'II.6', title: 'Gửi báo cáo tiến độ', s: 13, d: 13, requires: 'gate25' },

  // ===== III =====
  { key: 'iii1', phase: 'III', title: 'Cài AI lên page chính', s: 13, d: 13, req: true },
  { key: 'gate3', phase: 'III', title: 'CỔNG KIỂM SOÁT: gửi nhóm Hậu Kiểm kiểm tra chất lượng setup và các tính năng', s: 13, d: 14, gate: true, req: true },
  { key: 'iii2', phase: 'III', title: 'Theo dõi AI trên page (lặp hằng ngày)', s: 14, d: -4, da: E, rec: 'daily' },
  { key: 'iii3', phase: 'III', title: 'Kiểm tra hội thoại: khách có số điện thoại & khách chưa phản hồi (lặp hằng ngày)', s: 14, d: -4, da: E, rec: 'daily' },
  { key: 'iii4', phase: 'III', title: 'Gửi báo cáo đầu tuần', s: 14, d: -4, da: E, rec: 'weekly', weekday: 1 },
  { key: 'iii5', phase: 'III', title: 'Gửi báo cáo cuối tuần', s: 14, d: -4, da: E, rec: 'weekly', weekday: 5 },
  { key: 'iii6', phase: 'III', title: 'Chủ động hỏi thăm khách theo đúng tag giai đoạn', s: 14, d: -4, da: E, rec: 'weekly', weekday: 3 },

  // ===== IV =====
  { key: 'iv1', phase: 'IV', title: 'Chuẩn bị các phần bàn giao', s: -4, d: -2, sa: E, da: E, req: true },
  { key: 'iv2', phase: 'IV', title: 'Hẹn lịch hướng dẫn bàn giao (trước 1 ngày)', s: -3, d: -2, sa: E, da: E },
  { key: 'iv3', phase: 'IV', title: 'Họp bàn giao (MEETING BUỔI 3)', s: -1, d: -1, sa: E, da: E, meeting: 3, req: true },
  { key: 'iv4', phase: 'IV', title: 'Bàn giao: hướng dẫn chỉnh sửa & tối ưu AI', s: -1, d: -1, sa: E, da: E },
  { key: 'iv5', phase: 'IV', title: 'Bàn giao: huấn luyện bài viết', s: -1, d: -1, sa: E, da: E },
  { key: 'iv6', phase: 'IV', title: 'Bàn giao: điều chỉnh Chatbot', s: -1, d: -1, sa: E, da: E },
  { key: 'iv7', phase: 'IV', title: 'Bàn giao: sử dụng GHL', s: -1, d: -1, sa: E, da: E },
  { key: 'iv8', phase: 'IV', title: 'Nghiệm thu: yêu cầu khách xác nhận bảng nghiệm thu', s: -1, d: 0, sa: E, da: E, req: true },
  { key: 'iv9', phase: 'IV', title: 'Nghiệm thu: khóa các sheet khách đã xác nhận', s: 0, d: 0, sa: E, da: E },
  { key: 'iv10', phase: 'IV', title: 'Nghiệm thu: điền đủ thông tin vào file "Khách hàng - DV Huấn Luyện AI"', s: 0, d: 0, sa: E, da: E },
  { key: 'iv11', phase: 'IV', title: 'Nghiệm thu: gửi báo cáo lên nhóm Hậu Kiểm và xin ý kiến khách', s: 0, d: 0, sa: E, da: E, req: true },
  { key: 'iv12', phase: 'IV', title: 'Gắn tag DV – Done', s: 0, d: 0, sa: E, da: E },

  // ===== V =====
  { key: 'v1', phase: 'V', title: 'Lưu toàn bộ báo cáo, phản hồi khách', s: 0, d: 1, sa: E, da: E },
  { key: 'v2', phase: 'V', title: 'Tổng hợp đánh giá để cải tiến quy trình nội bộ', s: 1, d: 2, sa: E, da: E },
];

function buildPhases(prefix: string): Phase[] {
  return PHASES.map((p, i) => ({ ...p, id: `${prefix}-ph-${p.code}`, order: i }));
}

function build30(): Template {
  const phases = buildPhases(TEMPLATE_30_ID);
  const tasks: TaskTemplate[] = TASKS_30.map((t, i) => {
    const phase = phases.find((p) => p.code === t.phase)!;
    return {
      id: `${TEMPLATE_30_ID}-${t.key}`,
      phaseId: phase.id,
      order: i,
      title: t.title,
      startAnchor: t.sa ?? 'start',
      startOffset: t.s,
      deadlineAnchor: t.da ?? 'start',
      deadlineOffset: t.d,
      isGate: !!t.gate,
      isRequired: !!t.req,
      recurrence: t.rec ?? 'none',
      weekday: t.weekday,
      meetingNo: t.meeting,
      requiresGateId: t.requires ? `${TEMPLATE_30_ID}-${t.requires}` : undefined,
      feature: t.feature,
      condition: t.condition,
    };
  });
  return {
    id: TEMPLATE_30_ID,
    name: 'Gói 30 ngày',
    durationDays: 30,
    description: 'Quy trình chuẩn DVHL AI 30 ngày',
    phases,
    tasks,
    builtIn: true,
  };
}

/** Co offset theo tỷ lệ, giữ tối thiểu 1 ngày cho việc kéo dài, không để deadline < start. */
function scaleOffset(offset: number, anchor: Anchor, ratio: number): number {
  if (offset === 0) return 0;
  const scaled = Math.round(offset * ratio);
  if (anchor === 'end' && offset < 0) return Math.min(-1, scaled);
  if (scaled === 0) return offset > 0 ? 1 : -1;
  return scaled;
}

function build14(): Template {
  const base = build30();
  const ratio = 14 / 30;
  const phases = base.phases.map((p) => ({ ...p, id: p.id.replace(TEMPLATE_30_ID, TEMPLATE_14_ID) }));
  const tasks: TaskTemplate[] = base.tasks.map((t) => {
    const s = scaleOffset(t.startOffset, t.startAnchor, ratio);
    let d = scaleOffset(t.deadlineOffset, t.deadlineAnchor, ratio);
    // deadline cùng neo với start thì không được nhỏ hơn start
    if (t.startAnchor === t.deadlineAnchor && d < s) d = s;
    return {
      ...t,
      id: t.id.replace(TEMPLATE_30_ID, TEMPLATE_14_ID),
      phaseId: t.phaseId.replace(TEMPLATE_30_ID, TEMPLATE_14_ID),
      requiresGateId: t.requiresGateId?.replace(TEMPLATE_30_ID, TEMPLATE_14_ID),
      startOffset: s,
      deadlineOffset: d,
    };
  });
  return {
    id: TEMPLATE_14_ID,
    name: 'Gói 14 ngày',
    durationDays: 14,
    description: 'Bản rút gọn từ gói 30 ngày (offset co theo tỷ lệ) — hãy chỉnh lại theo quy trình thật.',
    phases,
    tasks,
    builtIn: true,
  };
}

export function createTemplate30(): Template {
  return build30();
}
export function createTemplate14(): Template {
  return build14();
}
export function defaultTemplates(): Template[] {
  return [build30(), build14()];
}
