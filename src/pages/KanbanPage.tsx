import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { customerStatus, customerTasks, getCurrentPhase, progress } from '../domain/status';
import type { Customer } from '../domain/types';
import { useStore } from '../store/useStore';
import { Badge, CustomerStatusBadge, ProgressBar } from '../components/ui';

const DONE_COL = '__done__';

interface Item {
  customer: Customer;
  col: string;
}

function CardView({
  item,
  overlay,
  dragging,
  onClick,
  innerRef,
  handlers,
}: {
  item: Item;
  overlay?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  innerRef?: (el: HTMLElement | null) => void;
  handlers?: Record<string, unknown>;
}) {
  const tasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const c = item.customer;
  const status = customerStatus(c, tasks, today);
  const prog = progress(c, tasks);
  return (
    <div
      ref={innerRef}
      {...handlers}
      onClick={onClick}
      className={`card cursor-grab touch-none p-2.5 text-sm active:cursor-grabbing ${dragging ? 'opacity-40' : ''} ${overlay ? 'shadow-xl' : ''} ${
        status === 'late' ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      <div className="font-semibold leading-tight">{c.name}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge tone="slate">{c.durationDays} ngày</Badge>
        <CustomerStatusBadge status={status} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar percent={prog.percent} tone={status === 'late' ? 'red' : 'indigo'} />
        </div>
        <span className="text-[11px]">{prog.percent}%</span>
      </div>
    </div>
  );
}

function Card({ item }: { item: Item }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.customer.id });
  return (
    <CardView
      item={item}
      dragging={isDragging}
      innerRef={setNodeRef}
      handlers={{ ...listeners, ...attributes }}
      onClick={() => navigate(`/khach-hang/${item.customer.id}`)}
    />
  );
}

function Column({ id, title, tag, items }: { id: string; title: string; tag?: string; items: Item[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-xl border p-2 transition ${
        isOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/60'
      }`}
    >
      <div className="mb-2 px-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold">{title}</div>
          <Badge tone="slate">{items.length}</Badge>
        </div>
        {tag && <div className="text-[11px] text-slate-500">{tag}</div>}
      </div>
      <div className="min-h-[60px] flex-1 space-y-2">
        {items.map((it) => (
          <Card key={it.customer.id} item={it} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const customers = useStore((s) => s.customers);
  const tasks = useStore((s) => s.tasks);
  const today = useStore((s) => s.today);
  const move = useStore((s) => s.moveCustomerToPhase);
  const [dragging, setDragging] = useState<Item | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const columns = useMemo(() => {
    const map = new Map<string, { code: string; name: string; tag: string; order: number }>();
    for (const c of customers) for (const p of c.phases) if (!map.has(p.code)) map.set(p.code, { code: p.code, name: p.name, tag: p.tag, order: p.order });
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [customers]);

  const items: Item[] = useMemo(
    () =>
      customers
        .filter((c) => showInactive || c.manualStatus !== 'ticket_closed')
        .map((c) => {
          const ph = c.manualStatus === 'completed' ? null : getCurrentPhase(c, customerTasks(c, tasks), today);
          return { customer: c, col: ph ? ph.code : DONE_COL };
        }),
    [customers, tasks, today, showInactive],
  );

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const overId = e.over?.id as string | undefined;
    if (!overId) return;
    const item = items.find((i) => i.customer.id === e.active.id);
    if (!item || item.col === overId) return;
    const target = overId === DONE_COL ? null : overId;
    const label = target ?? 'Hoàn thành';
    const forward =
      overId === DONE_COL || (columns.findIndex((c) => c.code === overId) > columns.findIndex((c) => c.code === item.col) && item.col !== DONE_COL);
    const msg = forward
      ? `Chuyển "${item.customer.name}" sang giai đoạn ${label}?\n\nMọi việc ở các giai đoạn trước sẽ được đánh dấu XONG (kể cả cổng kiểm soát).`
      : `Chuyển "${item.customer.name}" về giai đoạn ${label}?\n\nCác việc đã xong từ giai đoạn này trở đi sẽ được MỞ LẠI.`;
    if (window.confirm(msg)) move(item.customer.id, target);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Kanban theo giai đoạn</h1>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Hiện cả khách đã đóng ticket
        </label>
      </div>
      <p className="text-xs text-slate-500">Kéo thẻ khách sang cột khác để chuyển giai đoạn (có hỏi xác nhận). Bấm vào thẻ để xem chi tiết. Trên điện thoại: nhấn giữ rồi kéo.</p>
      <DndContext sensors={sensors} onDragStart={(e) => setDragging(items.find((i) => i.customer.id === e.active.id) ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-4 sm:mx-0 sm:px-0">
          {columns.map((col) => (
            <Column key={col.code} id={col.code} title={`${col.code} – ${col.name.split('(')[0].trim()}`} tag={col.tag} items={items.filter((i) => i.col === col.code)} />
          ))}
          <Column id={DONE_COL} title="Hoàn thành" items={items.filter((i) => i.col === DONE_COL)} />
        </div>
        <DragOverlay>{dragging ? <CardView item={dragging} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
