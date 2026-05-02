import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { Modal } from '../../shared/components/Modal';
import { LoadingSpinner } from '../../shared/components/Loading';
import { Plus, Edit2, Trash2, Box } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';

interface EquipmentForm {
  description: string;
  totalPrice: number | null;
}

export function EquipmentsPage() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipToDelete, setEquipToDelete] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setInitialLoading(true);
    const q = query(collection(db, 'equipments'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setEquipments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    });
  }, [user]);

  const { register, handleSubmit, reset, formState: { isValid } } = useForm<EquipmentForm>({
    mode: 'onChange'
  });

  const onSubmit = async (data: EquipmentForm) => {
    if (!user) return;
    setLoading(true);
    try {
      const equipData = {
        userId: user.uid,
        description: data.description,
        totalPrice: data.totalPrice !== null ? Number(data.totalPrice) : 0,
        createdAt: editingEquipment ? editingEquipment.createdAt : serverTimestamp(),
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'equipments', editingEquipment.id), equipData);
      } else {
        await addDoc(collection(db, 'equipments'), equipData);
      }

      setIsModalOpen(false);
      setEditingEquipment(null);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (equip: any) => {
    setEquipToDelete(equip);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!equipToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'equipments', equipToDelete.id));
      setIsDeleteModalOpen(false);
      setEquipToDelete(null);
    } catch (error) {
      console.error("Error deleting equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equip: any) => {
    setEditingEquipment(equip);
    setIsModalOpen(true);
    reset({
      description: equip.description,
      totalPrice: equip.totalPrice ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex sticky top-0 md:relative z-30 bg-bg-deep/80 backdrop-blur-md md:bg-transparent py-4 md:py-0 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Gallery Gear</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Maintenance Hub</p>
        </div>
        <button
          onClick={() => { setEditingEquipment(null); reset({ description: '', totalPrice: null }); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
            <LoadingSpinner variant="brand" />
            <p className="text-xs font-black uppercase tracking-widest italic animate-pulse">Inventory Check...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {equipments.map((equip) => (
            <motion.div
              layout
              key={equip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated p-4 flex items-center gap-6"
            >
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-soft shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-main truncate">{equip.description}</h3>
                <p className="text-accent-soft font-bold text-xs mt-1">{formatCurrency(equip.totalPrice)} investment</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(equip)}
                  className="p-2 text-text-muted hover:text-accent-soft transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                   onClick={() => handleDelete(equip)}
                   className="p-2 text-text-muted hover:text-red-400 transition-colors"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      {!initialLoading && equipments.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 border-2 border-dashed border-border-subtle rounded-3xl">
          Your equipment locker is currently empty.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        disabled={loading}
        title={editingEquipment ? "Modify Gear" : "Equip Gallery"}
        footer={
          <button
            disabled={loading || !isValid}
            form="equipment-form"
            type="submit"
            className="w-full h-14 bg-accent-primary text-white rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner variant="white" /> : 'Confirm Gear'}
          </button>
        }
      >
        <form id="equipment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Description</label>
              <input
                {...register('description', { required: true })}
                autoComplete="off"
                className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-text-main outline-none focus:ring-1 focus:ring-accent-primary"
                placeholder="e.g. Detolf Glass Cabinet"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Total Price</label>
              <input
                type="number" step="0.01"
                {...register('totalPrice', { required: true })}
                autoComplete="off"
                className="w-full h-12 bg-bg-surface border border-border-subtle rounded-2xl px-4 text-text-main outline-none focus:ring-1 focus:ring-accent-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                placeholder="0.00"
              />
            </div>
          </fieldset>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !loading && setIsDeleteModalOpen(false)}
        title="Safe Disposal"
        className="md:max-w-md"
        disabled={loading}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-bg-card transition-all disabled:opacity-30"
            >
              Abort
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner variant="white" /> : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Scrap
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-main italic tracking-tighter">DECOMMISSIONING GEAR</h3>
          <p className="text-text-muted text-sm leading-relaxed">
            Are you sure you want to remove <span className="text-text-main font-bold">"{equipToDelete?.description}"</span>? This will permanently erase it from maintenance records.
          </p>
        </div>
      </Modal>
    </div>
  );
}
