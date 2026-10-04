import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Customer } from '../domain/types';
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
  const addCustomer = useStore((s) => s.addCustomer);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const editing = !!customer;

  const [name, setName] = useState(customer?.name ?? '');
  const [sheetLink, setSheetLink] = useState(customer?.sheetLink ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');

  const valid = name.trim() !== '';

  const save = () => {
    const base = {
      name: name.trim(),
      sheetLink: sheetLink.trim(),
      notes,
    };
    if (customer) {
      updateCustomer(customer.id, base);
      onSaved?.(customer.id);
    } else {
      const id = addCustomer(
        {
          ...base,
          industry: '',
          contactPerson: '',
          phone: '',
          chatLink: '',
          summaryLink: '',
          saleId: '',
          retionId: '',
          paymentStatus: 'full',
          startDate: new Date().toISOString().substring(0, 10),
        },
        '',
        false
      );
      if (id) onSaved?.(id);
    }
    onClose();
  };

  return (
    <Modal title={editing ? 'Sửa thông tin khách' : 'Thêm khách mới'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Tên khách hàng / Doanh nghiệp *">
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Shop Mỹ Phẩm Hoa Hồng" />
        </Field>
        <Field label="Link Google Sheet khách hàng">
          <input className="input" value={sheetLink} onChange={(e) => setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
        </Field>
        <Field label="Ghi chú thêm">
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn-primary" disabled={!valid} onClick={save}>{editing ? 'Lưu' : 'Tạo khách hàng'}</button>
      </div>
    </Modal>
  );
}
