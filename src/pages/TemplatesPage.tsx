import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { createTemplate14, createTemplate30, TEMPLATE_14_ID, TEMPLATE_30_ID } from '../data/seed/templates';
import { WEEKDAY_NAMES, addDays, formatVN } from '../domain/dates';
import { endDateOf, resolveDate, uid } from '../domain/generateTasks';
import type { Anchor, Phase, Recurrence, TaskTemplate, Template } from '../domain/types';
import { useStore } from '../store/useStore';
import { Badge, EmptyState, Field } from '../components/ui';

/** Sắp xếp lại order: theo thứ tự giai đoạn rồi theo order của việc. */
function normalize(t: Template): Template {
  const phases = [...t.phases].sort((a, b) => a.order - b.order).map((p, i) => ({ ...p, order: i }));
  const pOrder = new Map(phases.map((p) => [p.id, p.order]));
  const tasks = [...t.tasks]
    .filter((x) => pOrder.has(x.phaseId))
    .sort((a, b) => (pOrder.get(a.phaseId)! - pOrder.get(b.phaseId)!) || a.order - b.order)
    .map((x, i) => ({ ...x, order: i }));
  return { ...t, phases, tasks };
}

function cloneTemplate(t: Template): Template {
  const id = uid('tpl');
  const phaseMap = new Map<string, string>();
  const phases = t.phases.map((p) => {
    const nid = `${id}-ph-${uid('p')}`;
    phaseMap.set(p.id, nid);
    return { ...p, id: nid };
  });
  const taskMap = new Map<string, string>();
  for (const x of t.tasks) taskMap.set(x.id, `${id}-${uid('tt')}`);
  const tasks = t.tasks.map((x) => ({
    ...x,
    id: taskMap.get(x.id)!,
    phaseId: phaseMap.get(x.phaseId)!,
    requiresGateId: x.requiresGateId ? taskMap.get(x.requiresGateId) : undefined,
  }));
  return { ...t, id, name: `${t.name} (bản sao)`, phases, tasks, builtIn: false };
}

function offsetLabel(anchor: Anchor, offset: number): string {
  if (anchor === 'start') return `Ngày ${offset}`;
  if (offset === 0) return 'Ngày kết thúc';
  return `Kết thúc ${offset > 0 ? '+' : '−'}${Math.abs(offset)}`;
}

export default function TemplatesPage() {
  const templates = useStore((s) => s.templates);
  const save = useStore((s) => s.saveTemplate);
  const remove = useStore((s) => s.deleteTemplate);
  const today = useStore((s) => s.today);

  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? '');
  const [draft, setDraft] = useState<Template | null>(null);
  const [dirty, setDirty] = useState(false);
  const [sampleStart, setSampleStart] = useState(today);

  const stored = templates.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(stored ? structuredClone(stored) : null);
    setDirty(false);
  }, [selectedId, stored?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!templates.find((t) => t.id === selectedId) && templates[0]) setSelectedId(templates[0].id);
  }, [templates, selectedId]);

  const edit = (fn: (d: Template) => Template) => {
    setDraft((d) => (d ? fn(d) : d));
    setDirty(true);
  };

  const sampleEnd = draft ? endDateOf(sampleStart, draft.durationDays) : sampleStart;
  const gates = useMemo(() => (draft ? draft.tasks.filter((t) => t.isGate) : []), [draft]);

  const patchTask = (id: string, patch: Partial<TaskTemplate>) =>
    edit((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const patchPhase = (id: string, patch: Partial<Phase>) =>
    edit((d) => ({ ...d, phases: d.phases.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const moveTask = (id: string, dir: -1 | 1) =>
    edit((d) => {
      const t = d.tasks.find((x) => x.id === id)!;
      const siblings = d.tasks.filter((x) => x.phaseId === t.phaseId).sort((a, b) => a.order - b.order);
      const i = siblings.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= siblings.length) return d;
      const a = siblings[i];
      const b = siblings[j];
      return {
        ...d,
        tasks: d.tasks.map((x) => (x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x)),
      };
    });

  const movePhase = (id: string, dir: -1 | 1) =>
    edit((d) => {
      const list = [...d.phases].sort((a, b) => a.order - b.order);
      const i = list.findIndex((p) => p.id === id);
      const j = i + dir;
      if (j < 0 || j >= list.length) return d;
      const a = list[i];
      const b = list[j];
      return { ...d, phases: d.phases.map((p) => (p.id === a.id ? { ...p, order: b.order } : p.id === b.id ? { ...p, order: a.order } : p)) };
    });

  const addTask = (phaseId: string) =>
    edit((d) => {
      const max = Math.max(-1, ...d.tasks.filter((t) => t.phaseId === phaseId).map((t) => t.order));
      const nt: TaskTemplate = {
        id: `${d.id}-${uid('tt')}`,
        phaseId,
        order: max + 0.5,
        title: 'Đầu việc mới',
        startAnchor: 'start',
        startOffset: 0,
        deadlineAnchor: 'start',
        deadlineOffset: 0,
        isGate: false,
        isRequired: false,
        recurrence: 'none',
      };
      return { ...d, tasks: [...d.tasks, nt] };
    });

  const deleteTask = (id: string) =>
    edit((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== id).map((t) => (t.requiresGateId === id ? { ...t, requiresGateId: undefined } : t)),
    }));

  const addPhase = () =>
    edit((d) => ({
      ...d,
      phases: [...d.phases, { id: `${d.id}-ph-${uid('p')}`, code: `P${d.phases.length + 1}`, name: 'Giai đoạn mới', tag: 'DV – Mới', order: d.phases.length }],
    }));

  const deletePhase = (id: string) => {
    if (!window.confirm('Xóa giai đoạn này cùng toàn bộ đầu việc bên trong?')) return;
    edit((d) => {
      const removedTasks = new Set(d.tasks.filter((t) => t.phaseId === id).map((t) => t.id));
      return {
        ...d,
        phases: d.phases.filter((p) => p.id !== id),
        tasks: d.tasks.filter((t) => t.phaseId !== id).map((t) => (t.requiresGateId && removedTasks.has(t.requiresGateId) ? { ...t, requiresGateId: undefined } : t)),
      };
    });
  };

  const onSave = () => {
    if (!draft) return;
    save(normalize(draft));
    setDirty(false);
  };

  const createNew = () => {
    const base = draft ?? templates[0];
    const nt = base
      ? cloneTemplate(base)
      : ({ id: uid('tpl'), name: 'Template mới', durationDays: 30, phases: [], tasks: [] } as Template);
    nt.name = window.prompt('Tên template mới (ví dụ: Gói 60 ngày):', nt.name.replace(' (bản sao)', ' – mới')) || nt.name;
    save(nt);
    setSelectedId(nt.id);
  };

  const resetBuiltIn = () => {
    if (!draft) return;
    if (!window.confirm('Đặt lại template này về bản mặc định ban đầu? Mọi chỉnh sửa của bạn sẽ mất.')) return;
    const fresh = draft.id === TEMPLATE_30_ID ? createTemplate30() : draft.id === TEMPLATE_14_ID ? createTemplate14() : null;
    if (fresh) {
      save(fresh);
      setDraft(structuredClone(fresh));
      setDirty(false);
    }
  };

  const phasesSorted = draft ? [...draft.phases].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Template quy trình</h1>
        <button className="btn-primary" onClick={createNew}>
          <Plus size={15} /> Tạo template mới (nhân bản)
        </button>
      </div>
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        Template chỉ áp dụng cho khách <b>tạo mới sau này</b>. Khách đã tạo giữ nguyên đầu việc của họ (bạn có thể dời hạn riêng từng việc trong trang khách).
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (dirty && !window.confirm('Bạn có thay đổi chưa lưu. Bỏ qua thay đổi?')) return;
              setSelectedId(t.id);
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              t.id === selectedId ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {t.name} <span className="text-xs text-slate-500">({t.durationDays} ngày)</span>
          </button>
        ))}
      </div>

      {!draft ? (
        <EmptyState>Chưa có template nào.</EmptyState>
      ) : (
        <>
          <section className="card space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tên template">
                <input className="input" value={draft.name} onChange={(e) => edit((d) => ({ ...d, name: e.target.value }))} />
              </Field>
              <Field label="Tổng số ngày của gói">
                <input type="number" min={1} className="input" value={draft.durationDays} onChange={(e) => edit((d) => ({ ...d, durationDays: Math.max(1, Number(e.target.value) || 1) }))} />
              </Field>
              <Field label="Ngày bắt đầu mẫu (để xem trước deadline)">
                <input type="date" className="input" value={sampleStart} onChange={(e) => setSampleStart(e.target.value)} />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Mô tả">
                  <input className="input" value={draft.description ?? ''} onChange={(e) => edit((d) => ({ ...d, description: e.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-primary" disabled={!dirty} onClick={onSave}>
                <Save size={15} /> Lưu template
              </button>
              <button
                className="btn-secondary"
                disabled={!dirty}
                onClick={() => {
                  setDraft(stored ? structuredClone(stored) : null);
                  setDirty(false);
                }}
              >
                <Undo2 size={15} /> Hoàn tác
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  const c = cloneTemplate(draft);
                  save(c);
                  setSelectedId(c.id);
                }}
              >
                <Copy size={15} /> Nhân bản
              </button>
              {(draft.id === TEMPLATE_30_ID || draft.id === TEMPLATE_14_ID) && (
                <button className="btn-secondary" onClick={resetBuiltIn}>
                  <RotateCcw size={15} /> Đặt lại mặc định
                </button>
              )}
              <button
                className="btn-ghost ml-auto text-red-500"
                onClick={() => window.confirm(`Xóa template "${draft.name}"? Khách đã tạo từ template này không bị ảnh hưởng.`) && remove(draft.id)}
              >
                <Trash2 size={15} /> Xóa template
              </button>
              {dirty && <Badge tone="yellow">Chưa lưu</Badge>}
            </div>
            <div className="text-xs text-slate-500">
              Với ngày bắt đầu mẫu {formatVN(sampleStart)}, ngày kết thúc là {formatVN(sampleEnd)}. Deadline = ngày bắt đầu + offset (hoặc ngày kết thúc + offset nếu chọn "Từ ngày kết thúc").
            </div>
          </section>

          {phasesSorted.map((phase, pi) => {
            const list = draft.tasks.filter((t) => t.phaseId === phase.id).sort((a, b) => a.order - b.order);
            return (
              <section key={phase.id} className="card p-4">
                <div className="mb-3 grid gap-2 sm:grid-cols-[90px_1fr_200px_auto]">
                  <Field label="Mã">
                    <input className="input" value={phase.code} onChange={(e) => patchPhase(phase.id, { code: e.target.value })} />
                  </Field>
                  <Field label="Tên giai đoạn">
                    <input className="input" value={phase.name} onChange={(e) => patchPhase(phase.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Tag DV">
                    <input className="input" value={phase.tag} onChange={(e) => patchPhase(phase.id, { tag: e.target.value })} />
                  </Field>
                  <div className="flex items-end gap-1">
                    <button className="btn-secondary btn-sm" disabled={pi === 0} onClick={() => movePhase(phase.id, -1)} title="Lên">
                      <ArrowUp size={14} />
                    </button>
                    <button className="btn-secondary btn-sm" disabled={pi === phasesSorted.length - 1} onClick={() => movePhase(phase.id, 1)} title="Xuống">
                      <ArrowDown size={14} />
                    </button>
                    <button className="btn-ghost btn-sm text-red-500" onClick={() => deletePhase(phase.id)} title="Xóa giai đoạn">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {list.map((t, ti) => {
                    const s = resolveDate(t.startAnchor, t.startOffset, sampleStart, sampleEnd);
                    const d = resolveDate(t.deadlineAnchor, t.deadlineOffset, sampleStart, sampleEnd);
                    const bad = d < s;
                    return (
                      <div key={t.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                        <div className="flex items-start gap-2">
                          <textarea className="input" rows={2} value={t.title} onChange={(e) => patchTask(t.id, { title: e.target.value })} />
                          <div className="flex shrink-0 flex-col gap-1">
                            <div className="flex gap-1">
                              <button className="btn-secondary btn-sm" disabled={ti === 0} onClick={() => moveTask(t.id, -1)} title="Lên">
                                <ArrowUp size={13} />
                              </button>
                              <button className="btn-secondary btn-sm" disabled={ti === list.length - 1} onClick={() => moveTask(t.id, 1)} title="Xuống">
                                <ArrowDown size={13} />
                              </button>
                            </div>
                            <button className="btn-ghost btn-sm text-red-500" onClick={() => window.confirm('Xóa đầu việc này khỏi template?') && deleteTask(t.id)}>
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <div className="label">Bắt đầu (day_start)</div>
                            <div className="flex gap-1">
                              <input type="number" className="input !w-20" value={t.startOffset} onChange={(e) => patchTask(t.id, { startOffset: Number(e.target.value) || 0 })} />
                              <select className="input" value={t.startAnchor} onChange={(e) => patchTask(t.id, { startAnchor: e.target.value as Anchor })}>
                                <option value="start">Từ ngày bắt đầu</option>
                                <option value="end">Từ ngày kết thúc</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <div className="label">Deadline (day_deadline)</div>
                            <div className="flex gap-1">
                              <input type="number" className="input !w-20" value={t.deadlineOffset} onChange={(e) => patchTask(t.id, { deadlineOffset: Number(e.target.value) || 0 })} />
                              <select className="input" value={t.deadlineAnchor} onChange={(e) => patchTask(t.id, { deadlineAnchor: e.target.value as Anchor })}>
                                <option value="start">Từ ngày bắt đầu</option>
                                <option value="end">Từ ngày kết thúc</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <div className="label">Lặp lại</div>
                            <div className="flex gap-1">
                              <select className="input" value={t.recurrence} onChange={(e) => patchTask(t.id, { recurrence: e.target.value as Recurrence, weekday: e.target.value === 'weekly' ? (t.weekday ?? 1) : undefined })}>
                                <option value="none">Không lặp</option>
                                <option value="daily">Hằng ngày (T2–T7)</option>
                                <option value="weekly">Hằng tuần</option>
                              </select>
                              {t.recurrence === 'weekly' && (
                                <select className="input" value={t.weekday ?? 1} onChange={(e) => patchTask(t.id, { weekday: Number(e.target.value) })}>
                                  {WEEKDAY_NAMES.map((n, i) => (
                                    <option key={i} value={i}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="label">Khóa cho đến khi gate đạt</div>
                            <select className="input" value={t.requiresGateId ?? ''} onChange={(e) => patchTask(t.id, { requiresGateId: e.target.value || undefined })}>
                              <option value="">Không khóa</option>
                              {gates
                                .filter((g) => g.id !== t.id)
                                .map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.title.slice(0, 40)}…
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={t.isRequired} onChange={(e) => patchTask(t.id, { isRequired: e.target.checked })} /> Bắt buộc
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={t.isGate} onChange={(e) => patchTask(t.id, { isGate: e.target.checked })} /> Cổng kiểm soát (Hậu Kiểm)
                          </label>
                          <label className="flex items-center gap-1">
                            Meeting:
                            <select className="input !w-auto !py-0.5" value={t.meetingNo ?? ''} onChange={(e) => patchTask(t.id, { meetingNo: e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined })}>
                              <option value="">Không</option>
                              <option value="1">Buổi 1</option>
                              <option value="2">Buổi 2</option>
                              <option value="3">Buổi 3</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={t.feature === 'testCounter'} onChange={(e) => patchTask(t.id, { feature: e.target.checked ? 'testCounter' : undefined })} /> Cần số hội thoại test
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" checked={t.condition === 'payment_partial'} onChange={(e) => patchTask(t.id, { condition: e.target.checked ? 'payment_partial' : undefined })} /> Chỉ khi thanh toán chưa đủ
                          </label>
                          <span className={`ml-auto text-xs ${bad ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                            {offsetLabel(t.startAnchor, t.startOffset)} → {offsetLabel(t.deadlineAnchor, t.deadlineOffset)} · {formatVN(s)} → {formatVN(d)}
                            {bad && ' ⚠ deadline trước ngày bắt đầu'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn-secondary btn-sm" onClick={() => addTask(phase.id)}>
                    <Plus size={13} /> Thêm đầu việc vào giai đoạn {phase.code}
                  </button>
                </div>
              </section>
            );
          })}

          <button className="btn-secondary" onClick={addPhase}>
            <Plus size={15} /> Thêm giai đoạn
          </button>
          <div className="sticky bottom-16 z-20 flex justify-end md:bottom-3">
            <button className="btn-primary shadow-lg" disabled={!dirty} onClick={onSave}>
              <Save size={15} /> Lưu template
            </button>
          </div>
        </>
      )}
    </div>
  );
}
