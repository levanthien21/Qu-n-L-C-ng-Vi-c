import { useState } from 'react';
import { useStore } from '../store/useStore';
import { addDays, formatVN } from '../domain/dates';
import type { Customer, PaymentStatus } from '../domain/types';
import { endDateOf } from '../domain/generateTasks';
import { Field, Modal } from './ui';

export function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer?: Customer;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const templates = useStore((s) => s.templates);
  const today = useStore((s) => s.today);
  const addCustomer = useStore((s) => s.addCustomer);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const editing = !!customer;

  const [name, setName] = useState(customer?.name ?? '');
  const [industry, setIndustry] = useState(customer?.industry ?? '');
  const [contactPerson, setContactPerson] = useState(customer?.contactPerson ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [chatLink, setChatLink] = useState(customer?.chatLink ?? '');
  const [summaryLink, setSummaryLink] = useState(customer?.summaryLink ?? '');
  const [sheetLink, setSheetLink] = useState(customer?.sheetLink ?? '');
  const [saleId, setSaleId] = useState(customer?.saleId ?? '');
  const [retionId, setRetionId] = useState(customer?.retionId ?? '');
  const [templateId, setTemplateId] = useState(customer?.templateId ?? templates[0]?.id ?? '');
  const [startDate, setStartDate] = useState(customer?.startDate ?? today);
  const [payment, setPayment] = useState<PaymentStatus>(customer?.paymentStatus ?? 'full');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [contactAlertDays, setContactAlertDays] = useState<string>(customer?.contactAlertDays?.toString() ?? '');
  const [autoPast, setAutoPast] = useState(false);

  const tpl = templates.find((t) => t.id === templateId);
  const end = tpl && startDate ? endDateOf(startDate, tpl.durationDays) : '';
  const valid = name.trim() && startDate && (editing || tpl);

  const save = () => {
    const base = {
      name: name.trim(),
      industry: industry.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      chatLink: chatLink.trim(),
      summaryLink: summaryLink.trim(),
      sheetLink: sheetLink.trim(),
      saleId: saleId.trim(),
      retionId: retionId.trim(),
      paymentStatus: payment,
      notes,
    };
    if (customer) {
      updateCustomer(customer.id, {
        ...base,
        contactAlertDays: contactAlertDays.trim() === '' ? undefined : Math.max(1, Number(contactAlertDays) || 3),
      });
      onSaved?.(customer.id);
    } else {
      const id = addCustomer({ ...base, startDate }, templateId, autoPast);
      if (id) onSaved?.(id);
    }
    onClose();
  };

  return (
    <Modal title={editing ? 'Sửa thông tin khách' : 'Thêm khách mới'} onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Tên nhóm / doanh nghiệp *">
            <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Shop Mỹ Phẩm Hoa Hồng" />
          </Field>
        </div>
        <Field label="Ngành hàng">
          <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </Field>
        <Field label="Người liên hệ">
          <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </Field>
        <Field label="SĐT / Zalo">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Link nhóm chat">
          <input className="input" value={chatLink} onChange={(e) => setChatLink(e.target.value)} placeholder="https://..." />
        </Field>
        <div className="sm:col-span-2">
          <Field label='Link tổng hợp "[Tên nhóm] - gói DVHL"'>
            <input className="input" value={summaryLink} onChange={(e) => setSummaryLink(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Link Google Sheet khách hàng">
            <input className="input" value={sheetLink} onChange={(e) => setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
          </Field>
        </div>
        <Field label="ID sale">
          <input className="input" value={saleId} onChange={(e) => setSaleId(e.target.value)} />
        </Field>
        <Field label="ID QTV / ID tổ chức Retion">
          <input className="input" value={retionId} onChange={(e) => setRetionId(e.target.value)} />
        </Field>
        <Field label="Gói dịch vụ *" hint={editing ? 'Không đổi được sau khi đã sinh đầu việc.' : undefined}>
          <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={editing}>
            {editing && <option value={customer!.templateId}>{customer!.templateName}</option>}
            {!editing &&
              templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.durationDays} ngày)
                </option>
              ))}
          </select>
        </Field>
        <Field label="Ngày bắt đầu *" hint={editing ? 'Muốn dời ngày bắt đầu: dùng nút "Dời ngày bắt đầu" ở trang chi tiết (có ghi lý do).' : undefined}>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={editing} />
        </Field>
        <Field label="Tình trạng thanh toán">
          <select className="input" value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus)}>
            <option value="full">Đủ</option>
            <option value="partial">Chưa đủ</option>
          </select>
        </Field>
        {editing ? (
          <Field label="Ngưỡng nhắc 'chưa liên hệ' (ngày)" hint="Bỏ trống = dùng mặc định trong Cài đặt.">
            <input type="number" min={1} className="input" value={contactAlertDays} onChange={(e) => setContactAlertDays(e.target.value)} />
          </Field>
        ) : (
          <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {end ? (
              <>
                Ngày kết thúc dự kiến: <b>{formatVN(end)}</b>
                <br />
                Giai đoạn IV bắt đầu khoảng: <b>{formatVN(addDays(end, -4))}</b>
              </>
            ) : (
              'Chọn gói và ngày bắt đầu để xem ngày kết thúc dự kiến.'
            )}
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Ghi chú">
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        {!editing && startDate < today && (
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="mt-1" checked={autoPast} onChange={(e) => setAutoPast(e.target.checked)} />
            <span>
              Ngày bắt đầu đã qua: <b>tự đánh dấu "Xong"</b> các việc có deadline trước hôm nay (dùng khi nhập khách đang triển khai dở). Nếu không chọn, các việc đó sẽ hiện là quá hạn.
            </span>
          </label>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button className="btn-primary" disabled={!valid} onClick={save}>
          {editing ? 'Lưu' : 'Tạo khách & sinh đầu việc'}
        </button>
      </div>
    </Modal>
  );
}
