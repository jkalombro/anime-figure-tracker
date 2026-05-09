import { Modal } from '../../../shared/components/Modal';
import { LoadingSpinner } from '../../../shared/components/Loading';
import { CheckCircle2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../shared/utils/utils';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  tempShowcases: any[];
  onDragEnd: (event: any) => void;
  onSave: () => Promise<void>;
  sensors: any;
}

export function ReorderModal({
  isOpen,
  onClose,
  loading,
  tempShowcases,
  onDragEnd,
  onSave,
  sensors,
}: ReorderModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sequence Exhibition"
      className="md:max-w-md"
      disabled={loading}
      footer={
        <button
          disabled={loading}
          onClick={onSave}
          className="w-full h-14 bg-accent-soft text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-soft/20"
        >
          {loading ? <LoadingSpinner variant="white" /> : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Commit Order
            </>
          )}
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest italic mb-6">Drag and drop to sequence your exhibition priority.</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={tempShowcases.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {tempShowcases.map((showcase) => (
                <SortableItem key={showcase.id} showcase={showcase} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </Modal>
  );
}

function SortableItem({ showcase }: { showcase: any; [key: string]: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: showcase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 bg-bg-surface border border-border-subtle rounded-2xl flex items-center gap-4 group hover:border-accent-primary/30 transition-all shadow-sm",
        isDragging && "shadow-2xl border-accent-primary/50"
      )}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-subtle shrink-0">
         <img 
           src={showcase.thumbnailUrl || showcase.imageUrls?.[0]} 
           className="w-full h-full object-cover" 
           referrerPolicy="no-referrer" 
         />
      </div>
      <div className="min-w-0 flex-1">
         <h5 className="text-[11px] font-black uppercase tracking-tight italic text-text-main truncate">{showcase.name}</h5>
         <p className="text-[9px] text-text-muted font-medium uppercase tracking-[0.1em]">Priority Position</p>
      </div>
    </div>
  );
}
