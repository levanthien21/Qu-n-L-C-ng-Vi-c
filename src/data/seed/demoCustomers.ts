import { addDays } from '../../domain/dates';
import type { DateStr } from '../../domain/dates';
import { createCustomerFromTemplate, ensureRecurringTasks, markPastDone } from '../../domain/generateTasks';
import type { NewCustomerInput } from '../../domain/generateTasks';
import type { Customer, Task, Template } from '../../domain/types';
import { TEMPLATE_14_ID, TEMPLATE_30_ID } from './templates';

function baseInput(over: Partial<NewCustomerInput> & Pick<NewCustomerInput, 'name' | 'startDate'>): NewCustomerInput {
  return {
    industry: '',
    contactPerson: '',
    phone: '',
    chatLink: '',
    summaryLink: '',
    saleId: '',
    retionId: '',
    paymentStatus: 'full',
    notes: '',
    ...over,
  };
}

function doneThrough(tasks: Task[], through: DateStr, today: DateStr) {
  for (const t of tasks) {
    if (t.status !== 'done' && t.deadline <= through) {
      t.status = 'done';
      t.doneAt = t.deadline;
      if (t.isGate) t.gatePassed = true;
      t.updatedAt = today;
    }
  }
}

function patchTask(tasks: Task[], customerId: string, tplId: string, key: string, patch: Partial<Task>) {
  const t = tasks.find((x) => x.id === `${customerId}:${tplId}-${key}`);
  if (t) Object.assign(t, patch);
}

/** Tạo 4 khách mẫu ở các giai đoạn khác nhau (tính theo ngày hôm nay). */
export function buildDemoData(templates: Template[], today: DateStr): { customers: Customer[]; tasks: Task[] } {
  const t30 = templates.find((t) => t.id === TEMPLATE_30_ID);
  const t14 = templates.find((t) => t.id === TEMPLATE_14_ID);
  const customers: Customer[] = [];
  const tasks: Task[] = [];
  if (!t30 || !t14) return { customers, tasks };

  // ---------- Khách 1: gói 30 ngày, ngày thứ 9, đang trễ ----------
  {
    const id = 'demo-1';
    const start = addDays(today, -9);
    const r = createCustomerFromTemplate(
      baseInput({
        name: 'Shop Mỹ Phẩm Hoa Hồng',
        industry: 'Mỹ phẩm',
        contactPerson: 'Chị Hoa',
        phone: '0901 234 567',
        chatLink: 'https://zalo.me/g/demo-hoa-hong',
        summaryLink: 'https://docs.google.com/spreadsheets/d/demo1',
        saleId: 'SALE-012',
        retionId: 'ORG-48213',
        paymentStatus: 'partial',
        startDate: start,
        notes: 'Khách hay trả lời chậm vào buổi sáng, nên nhắn sau 14h.',
      }),
      t30,
      { id, today },
    );
    doneThrough(r.tasks, addDays(start, 5), today);
    patchTask(r.tasks, id, TEMPLATE_30_ID, 'ii3c', { status: 'waiting_customer', waitingSince: addDays(start, 3), doneAt: undefined, updatedAt: today });
    patchTask(r.tasks, id, TEMPLATE_30_ID, 'ii5c', { status: 'doing', updatedAt: today });
    r.customer.meetingConfirmed = { '1': true, '2': false, '3': false };
    r.customer.testReport = { testPageLink: 'https://facebook.com/demo.hoahong.test', simulatedConversations: 12, evidenceLinks: ['https://drive.google.com/demo-anh-test-1'] };
    r.customer.careLogs = [
      { id: 'cl-1a', date: addDays(today, -7), content: 'Họp buổi 2, hướng dẫn Retion', result: 'Khách hiểu, hẹn điền file kiến thức trong 3 ngày', followUp: 'Nhắc khách điền kiến thức' },
      { id: 'cl-1b', date: addDays(today, -4), content: 'Nhắc khách điền file kiến thức', result: 'Khách báo bận, sẽ điền cuối tuần', followUp: 'Hỏi lại sau 2 ngày' },
    ];
    r.customer.isDemo = true;
    customers.push(r.customer);
    tasks.push(...r.tasks);
  }

  // ---------- Khách 2: gói 30 ngày, ngày thứ 26 (sắp bàn giao, lỗi AI ≥ 3) ----------
  {
    const id = 'demo-2';
    const start = addDays(today, -26);
    const r = createCustomerFromTemplate(
      baseInput({
        name: 'Spa & Clinic Ánh Dương',
        industry: 'Spa / Thẩm mỹ',
        contactPerson: 'Anh Dương',
        phone: '0988 765 432',
        chatLink: 'https://zalo.me/g/demo-anh-duong',
        summaryLink: 'https://docs.google.com/spreadsheets/d/demo2',
        saleId: 'SALE-007',
        retionId: 'ORG-39120',
        startDate: start,
        notes: 'Khách khá phối hợp. Cần chốt lịch bàn giao sớm.',
      }),
      t30,
      { id, today, autoCompletePast: true },
    );
    r.customer.meetingConfirmed = { '1': true, '2': true, '3': false };
    r.customer.testReport = { testPageLink: 'https://facebook.com/demo.anhduong.test', simulatedConversations: 42, evidenceLinks: ['https://drive.google.com/demo-anh-test-2', 'https://drive.google.com/demo-anh-test-3'] };
    r.customer.aiErrors = [
      { id: 'err-2a', date: addDays(today, -6), description: 'AI báo sai giá liệu trình triệt lông (thiếu kiến thức)', resolved: true },
      { id: 'err-2b', date: addDays(today, -3), description: 'AI không biết trả lời câu hỏi về bảo hành', resolved: false },
      { id: 'err-2c', date: addDays(today, -1), description: 'Lặp lại lỗi báo sai giá ở combo mới', resolved: false },
    ];
    r.customer.careLogs = [
      { id: 'cl-2a', date: addDays(today, -12), content: 'Gửi báo cáo cuối tuần', result: 'Khách hài lòng', followUp: '' },
      { id: 'cl-2b', date: addDays(today, -5), content: 'Hỏi thăm tình hình hội thoại', result: 'Khách phản hồi AI trả lời ổn, nhưng còn vài lỗi giá', followUp: 'Kiểm tra lại bảng giá combo' },
    ];
    r.customer.isDemo = true;
    customers.push(r.customer);
    tasks.push(...r.tasks);
  }

  // ---------- Khách 3: gói 14 ngày, ngày thứ 5, chờ Hậu Kiểm ----------
  {
    const id = 'demo-3';
    const start = addDays(today, -5);
    const r = createCustomerFromTemplate(
      baseInput({
        name: 'Nội Thất Gỗ Việt',
        industry: 'Nội thất',
        contactPerson: 'Chị Lan',
        phone: '0912 345 678',
        chatLink: 'https://zalo.me/g/demo-go-viet',
        summaryLink: 'https://docs.google.com/spreadsheets/d/demo3',
        saleId: 'SALE-021',
        retionId: 'ORG-51007',
        startDate: start,
      }),
      t14,
      { id, today, autoCompletePast: true },
    );
    patchTask(r.tasks, id, TEMPLATE_14_ID, 'gate25', { status: 'waiting_audit', waitingSince: addDays(today, -1), doneAt: undefined, gatePassed: undefined, updatedAt: today });
    r.customer.meetingConfirmed = { '1': true, '2': true, '3': false };
    r.customer.testReport = { testPageLink: 'https://facebook.com/demo.govietnoithat', simulatedConversations: 35, evidenceLinks: ['https://drive.google.com/demo-anh-test-4'] };
    r.customer.careLogs = [{ id: 'cl-3a', date: addDays(today, -1), content: 'Báo khách đang chờ Hậu Kiểm kiểm tra chất lượng', result: 'Khách đồng ý chờ', followUp: 'Gửi page test cho khách sau khi Audit đạt' }];
    r.customer.isDemo = true;
    customers.push(r.customer);
    tasks.push(...r.tasks);
  }

  // ---------- Khách 4: gói 14 ngày, ngày thứ 12, khách chờ 10 ngày & trễ ----------
  {
    const id = 'demo-4';
    const start = addDays(today, -12);
    const r = createCustomerFromTemplate(
      baseInput({
        name: 'Cafe Rang Xay Hạt Nâu',
        industry: 'F&B',
        contactPerson: 'Anh Tùng',
        phone: '0977 111 222',
        chatLink: 'https://zalo.me/g/demo-hat-nau',
        summaryLink: 'https://docs.google.com/spreadsheets/d/demo4',
        saleId: 'SALE-003',
        retionId: 'ORG-27744',
        paymentStatus: 'partial',
        startDate: start,
        notes: 'Khách chưa điền file kiến thức dù đã nhắc nhiều lần.',
      }),
      t14,
      { id, today },
    );
    doneThrough(r.tasks, addDays(start, 2), today);
    patchTask(r.tasks, id, TEMPLATE_14_ID, 'ii3c', { status: 'waiting_customer', waitingSince: addDays(today, -10), doneAt: undefined, updatedAt: today });
    r.customer.meetingConfirmed = { '1': true, '2': true, '3': false };
    r.customer.careLogs = [
      { id: 'cl-4a', date: addDays(today, -9), content: 'Gửi file kiến thức mẫu và hướng dẫn', result: 'Khách hẹn điền trong 3 ngày', followUp: 'Nhắc lại' },
      { id: 'cl-4b', date: addDays(today, -6), content: 'Nhắc điền kiến thức lần 2', result: 'Khách chưa phản hồi', followUp: 'Báo sale nếu tiếp tục không phản hồi' },
    ];
    r.customer.isDemo = true;
    customers.push(r.customer);
    tasks.push(...r.tasks);
  }

  // Sinh việc lặp còn thiếu (nếu có) và đánh dấu việc quá khứ của khách 2/3 đã xong
  for (const c of customers) {
    const mine = tasks.filter((t) => t.customerId === c.id);
    tasks.push(...ensureRecurringTasks(c, mine, today));
  }
  // Khách 2: các lần lặp quá khứ đã làm xong
  markPastDone(
    tasks.filter((t) => t.customerId === 'demo-2' && !!t.ruleId),
    today,
  );
  return { customers, tasks };
}
