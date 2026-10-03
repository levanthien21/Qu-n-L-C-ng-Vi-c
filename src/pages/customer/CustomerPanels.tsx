import { useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronRight, Copy, Link2, MessageSquarePlus, Plus, Trash2, Bug, FlaskConical, History, PhoneCall, AlertOctagon } from 'lucide-react';
import { addDays, formatVN, formatVNShort, diffDays } from '../../domain/dates';
import { buildProgressReport } from '../../domain/alerts';
import { aiErrorCount, contactThreshold, daysSinceContact } from '../../domain/status';
import type { Customer, Task } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { Badge, EmptyState, Field, Modal, ProgressBar } from '../../components/ui';

export function Panel({
  title,
  icon,
  right,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-3 sm:p-4"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(!open)}
      >
        <h2 className="section-title !mb-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          {icon} {title}
        </h2>
        {right && <div onClick={(e) => e.stopPropagation()}>{right}</div>}
      </div>
      {open && <div className="border-t border-slate-100 p-3 dark:border-slate-800 sm:p-4">{children}</div>}
    </section>
  );
}

// ---------------------------------------------------------------- Nhật ký chăm sóc
export function CareLogPanel({ customer }: { customer: Customer }) {
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  const addCareLog = useStore((s) => s.addCareLog);
  const deleteCareLog = useStore((s) => s.deleteCareLog);
  const createFollowUp = useStore((s) => s.createFollowUpFromLog);
  const updateCustomer = useStore((s) => s.updateCustomer);

  const [date, setDate] = useState(today);
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [followDate, setFollowDate] = useState(addDays(today, 1));
  const [makeTask, setMakeTask] = useState(true);

  const threshold = contactThreshold(customer, settings);
  const since = daysSinceContact(customer, today);
  const logs = [...customer.careLogs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Nhật ký chăm sóc"
      defaultOpen={since >= threshold}
      icon={<PhoneCall size={15} />}
      right={
        <div className="flex items-center gap-2 text-xs">
          <Badge tone={since >= threshold ? 'yellow' : 'green'}>
            {since >= threshold ? `Đã ${since} ngày chưa liên hệ` : `Liên hệ gần nhất ${since} ngày trước`}
          </Badge>
          <label className="flex items-center gap-1 text-slate-500">
            Nhắc sau
            <input
              type="number"
              min={1}
              className="input !w-14 !px-1.5 !py-0.5 text-xs"
              value={customer.contactAlertDays ?? settings.contactAlertDays}
              onChange={(e) => updateCustomer(customer.id, { contactAlertDays: Math.max(1, Number(e.target.value) || 1) })}
            />
            ngày
          </label>
        </div>
      }
    >
      <div className="grid gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 sm:grid-cols-2">
        <Field label="Ngày liên hệ">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Nội dung">
          <input className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Đã trao đổi gì với khách?" />
        </Field>
        <Field label="Kết quả">
          <input className="input" value={result} onChange={(e) => setResult(e.target.value)} placeholder="Khách phản hồi thế nào?" />
        </Field>
        <Field label="Cần follow-up">
          <input className="input" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Việc cần làm tiếp (nếu có)" />
        </Field>
        {followUp.trim() && (
          <>
            <Field label="Hạn follow-up">
              <input type="date" className="input" value={followDate} onChange={(e) => setFollowDate(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={makeTask} onChange={(e) => setMakeTask(e.target.checked)} />
              Tạo luôn việc follow-up
            </label>
          </>
        )}
        <div className="sm:col-span-2">
          <button
            className="btn-primary"
            disabled={!content.trim()}
            onClick={() => {
              addCareLog(customer.id, { date, content: content.trim(), result: result.trim(), followUp: followUp.trim(), followUpDate: followUp.trim() ? followDate : undefined }, makeTask);
              setContent('');
              setResult('');
              setFollowUp('');
            }}
          >
            <MessageSquarePlus size={15} /> Ghi lần liên hệ
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {logs.length === 0 && <EmptyState>Chưa có lần liên hệ nào.</EmptyState>}
        {logs.map((l) => (
          <div key={l.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{formatVN(l.date)}</div>
              <button className="btn-ghost btn-sm text-red-500" onClick={() => window.confirm('Xóa dòng nhật ký này?') && deleteCareLog(customer.id, l.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            <div>{l.content}</div>
            {l.result && <div className="text-slate-500">→ {l.result}</div>}
            {l.followUp && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="blue">Follow-up{l.followUpDate ? ` ${formatVNShort(l.followUpDate)}` : ''}</Badge>
                <span>{l.followUp}</span>
                {l.followUpTaskId ? (
                  <Badge tone="green">Đã tạo việc</Badge>
                ) : (
                  <button className="btn-secondary btn-sm" onClick={() => createFollowUp(customer.id, l.id)}>
                    <Plus size={12} /> Tạo việc follow-up
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Báo cáo test
export function TestReportPanel({ customer }: { customer: Customer }) {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateTestReport);
  const [evidence, setEvidence] = useState('');
  const r = customer.testReport;
  const min = settings.minTestConversations;
  const pct = Math.min(100, Math.round((r.simulatedConversations / min) * 100));
  return (
    <Panel title="Báo cáo test AI" icon={<FlaskConical size={15} />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Link page test">
          <div className="flex gap-1">
            <input className="input" value={r.testPageLink} onChange={(e) => update(customer.id, { testPageLink: e.target.value })} placeholder="https://..." />
            {r.testPageLink && (
              <a className="btn-secondary" href={r.testPageLink} target="_blank" rel="noreferrer" title="Mở link">
                <Link2 size={15} />
              </a>
            )}
          </div>
        </Field>
        <Field label={`Số hội thoại giả lập đã test (tối thiểu ${min})`}>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              className="input"
              value={r.simulatedConversations}
              onChange={(e) => update(customer.id, { simulatedConversations: Math.max(0, Number(e.target.value) || 0) })}
            />
            <button className="btn-secondary" onClick={() => update(customer.id, { simulatedConversations: r.simulatedConversations + 1 })}>
              +1
            </button>
            <button className="btn-secondary" onClick={() => update(customer.id, { simulatedConversations: r.simulatedConversations + 5 })}>
              +5
            </button>
          </div>
        </Field>
      </div>
      <div className="mt-2">
        <ProgressBar percent={pct} tone={r.simulatedConversations >= min ? 'green' : 'indigo'} />
        <div className="mt-1 text-xs text-slate-500">
          {r.simulatedConversations >= min ? 'Đã đủ số hội thoại tối thiểu ✔' : `Còn thiếu ${min - r.simulatedConversations} hội thoại so với yêu cầu`}
        </div>
      </div>
      <div className="mt-3">
        <div className="label">Ảnh bằng chứng (lưu link)</div>
        <div className="flex gap-1">
          <input className="input" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Dán link ảnh / thư mục bằng chứng" />
          <button
            className="btn-secondary"
            disabled={!evidence.trim()}
            onClick={() => {
              update(customer.id, { evidenceLinks: [...r.evidenceLinks, evidence.trim()] });
              setEvidence('');
            }}
          >
            <Plus size={15} /> Thêm
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {r.evidenceLinks.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <a href={l} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-indigo-600 hover:underline dark:text-indigo-400">
                {l}
              </a>
              <button className="btn-ghost btn-sm text-red-500" onClick={() => update(customer.id, { evidenceLinks: r.evidenceLinks.filter((_, j) => j !== i) })}>
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Lỗi AI
export function AIErrorPanel({ customer }: { customer: Customer }) {
  const settings = useStore((s) => s.settings);
  const add = useStore((s) => s.addAIError);
  const toggle = useStore((s) => s.toggleAIErrorResolved);
  const del = useStore((s) => s.deleteAIError);
  const reset = useStore((s) => s.resetAIErrorCycle);
  const [desc, setDesc] = useState('');
  const count = aiErrorCount(customer);
  const over = count >= settings.aiErrorThreshold;
  const list = [...customer.aiErrors].reverse();

  return (
    <Panel
      title="Nhật ký lỗi AI (giai đoạn thực tế)"
      defaultOpen={over}
      icon={<Bug size={15} />}
      right={<Badge tone={over ? 'red' : count > 0 ? 'yellow' : 'green'}>Lỗi vòng hiện tại: {count}/{settings.aiErrorThreshold}</Badge>}
    >
      {over && (
        <div className="mb-3 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300">
            <AlertOctagon size={16} /> CẢNH BÁO: AI lỗi {count} lần — làm theo quy trình:
          </div>
          <ol className="ml-5 list-decimal space-y-0.5 text-red-700 dark:text-red-300">
            <li>Thông báo khách tạm dừng AI trên page chính</li>
            <li>Chuyển AI về page test trong 2 ngày</li>
            <li>Support chỉnh sửa (kiến thức / prompt)</li>
            <li>Gửi nhóm Hậu Kiểm (checktest)</li>
            <li>Gửi lại khách</li>
          </ol>
          <button
            className="btn-secondary btn-sm mt-2"
            onClick={() => window.confirm('Đã hoàn tất quy trình xử lý? Hệ thống sẽ đếm lỗi lại từ đầu (lịch sử vẫn được giữ).') && reset(customer.id)}
          >
            <Check size={13} /> Đã xử lý xong, đếm lại từ đầu
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả lỗi (thiếu kiến thức, prompt thiếu thông tin, lỗi lặp lại…)" onKeyDown={(e) => e.key === 'Enter' && desc.trim() && (add(customer.id, desc.trim()), setDesc(''))} />
        <button
          className="btn-danger whitespace-nowrap"
          onClick={() => {
            add(customer.id, desc.trim() || 'Lỗi phát sinh (chưa mô tả)');
            setDesc('');
          }}
        >
          <Bug size={15} /> Ghi lỗi phát sinh
        </button>
      </div>
      <div className="mt-3 space-y-1.5">
        {list.length === 0 && <EmptyState>Chưa ghi nhận lỗi nào.</EmptyState>}
        {list.map((e) => (
          <div key={e.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
            <input type="checkbox" className="mt-1" checked={e.resolved} onChange={() => toggle(customer.id, e.id)} title="Đã xử lý" />
            <div className="min-w-0 flex-1">
              <div className={e.resolved ? 'text-slate-500 line-through' : ''}>{e.description}</div>
              <div className="text-[11px] text-slate-500">{formatVN(e.date)} · {e.resolved ? 'Đã xử lý' : 'Chưa xử lý'}</div>
            </div>
            <button className="btn-ghost btn-sm text-red-500" onClick={() => window.confirm('Xóa lỗi này khỏi nhật ký?') && del(customer.id, e.id)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Playbook
const PLAYBOOK = [
  {
    code: 'TH1',
    title: 'Khách phối hợp',
    steps: ['Nhận góp ý của khách', 'Chỉnh prompt / kiến thức theo góp ý', 'Cho khách test tiếp', 'Test thêm hội thoại giả lập để bổ sung'],
  },
  {
    code: 'TH2',
    title: 'Khách không phối hợp',
    steps: ['Quay video test AI', 'Đưa số liệu: đã test bao nhiêu khách, giả lập bao nhiêu hội thoại', 'Hỏi khách có thể đưa lên page chính chưa'],
  },
  {
    code: 'TH3',
    title: 'Khách không đồng nhất ý kiến',
    steps: ['Dựa trên form khảo sát mong muốn AI của khách', 'Chỉnh AI theo form khảo sát làm căn cứ chung'],
  },
  {
    code: 'TH4',
    title: 'Khách cố tình làm khó',
    steps: ['Luôn đưa số liệu test cụ thể làm căn cứ (số hội thoại, tỷ lệ đạt, bằng chứng test)'],
  },
];

export function PlaybookPanel({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <Panel title="Playbook tình huống (Test AI với khách)" icon={<BookOpen size={15} />} defaultOpen={defaultOpen}>
      <div className="grid gap-3 md:grid-cols-2">
        {PLAYBOOK.map((p) => (
          <div key={p.code} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Badge tone="purple">{p.code}</Badge> {p.title}
            </div>
            <ul className="ml-4 list-disc space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
              {p.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Lịch sử dời ngày
export function RescheduleHistoryPanel({ customer }: { customer: Customer }) {
  const logs = [...customer.rescheduleLogs].reverse();
  if (!logs.length) return null;
  return (
    <Panel title="Lịch sử dời ngày" icon={<History size={15} />}>
      <ul className="space-y-2 text-sm">
        {logs.map((l) => (
          <li key={l.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">{new Date(l.at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
            {l.scope === 'start' ? (
              <div>
                Dời <b>ngày bắt đầu</b>: {formatVN(l.oldStart)} → {formatVN(l.newStart)}
              </div>
            ) : (
              <div>
                <b>{l.taskTitle}</b>: {formatVN(l.oldStart)}–{formatVN(l.oldDeadline)} → {formatVN(l.newStart)}–{formatVN(l.newDeadline)}
                {l.oldDeadline && l.newDeadline && ` (${diffDays(l.newDeadline, l.oldDeadline) >= 0 ? '+' : ''}${diffDays(l.newDeadline, l.oldDeadline)} ngày)`}
              </div>
            )}
            <div className="text-slate-500">Lý do: {l.reason}</div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------- Báo cáo tiến độ
export function ProgressReportModal({ customer, tasks, onClose }: { customer: Customer; tasks: Task[]; onClose: () => void }) {
  const today = useStore((s) => s.today);
  const settings = useStore((s) => s.settings);
  const [days, setDays] = useState(7);
  const [copied, setCopied] = useState(false);
  const text = buildProgressReport(customer, tasks, today, settings, days);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.getElementById('report-text') as HTMLTextAreaElement | null;
      ta?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal title="Báo cáo tiến độ" onClose={onClose} wide>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span>Tính trong</span>
        <select className="input !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[3, 7, 14].map((d) => (
            <option key={d} value={d}>
              {d} ngày
            </option>
          ))}
        </select>
        <span className="text-slate-500">(đã làm gần đây / sắp tới)</span>
      </div>
      <textarea id="report-text" readOnly className="input font-mono text-xs" rows={18} value={text} />
      <div className="mt-3 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Đóng
        </button>
        <button className="btn-primary" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Đã copy!' : 'Copy báo cáo'}
        </button>
      </div>
    </Modal>
  );
}
