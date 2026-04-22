import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/Loading';
import { Plus, Edit2, Trash2, Box } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface EquipmentForm {
  description: string;
  totalPrice: number;
}

export function EquipmentsPage() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'equipments'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setEquipments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        totalPrice: Number(data.totalPrice),
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'equipments', id));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (equip: any) => {
    setEditingEquipment(equip);
    setIsModalOpen(true);
    reset({
      description: equip.description,
      totalPrice: equip.totalPrice,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-lg font-black text-text-main uppercase tracking-tighter italic">Gallery Gear</h2>
          <p className="text-text-muted text-[10px] mt-1 uppercase tracking-widest font-bold">Maintenance Hub</p>
        </div>
        <button
          onClick={() => { setEditingEquipment(null); reset(); setIsModalOpen(true); }}
          className="btn-primary-sophisticated h-10 px-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {equipments.map((equip) => (
            <motion.div
              layout
              key={equip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-sophisticated flex items-center gap-6"
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
                   onClick={() => handleDelete(equip.id)}
                   className="p-2 text-text-muted hover:text-red-400 transition-colors"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
          <div className="space-y-4">
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
