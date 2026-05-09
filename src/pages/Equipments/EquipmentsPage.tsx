import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/services/firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { LoadingSpinner } from '../../shared/components/Loading';
import { AddItemButton } from '../../shared/components/AddItemButton.tsx';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'motion/react';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentModal } from './components/EquipmentModal';
import { DeleteEquipmentModal } from './components/DeleteEquipmentModal';

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

  const formMethods = useForm<EquipmentForm>({
    mode: 'onChange'
  });
  const { reset } = formMethods;

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
      <div className="flex sticky top-[56px] md:top-0 z-30 bg-bg-deep/80 backdrop-blur-md py-4 justify-between items-end mb-8 transition-all">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-text-main uppercase tracking-tighter italic">Gallery Gear</h2>
          <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Maintenance Hub</p>
        </div>
        <AddItemButton 
          onClick={() => { setEditingEquipment(null); reset({ description: '', totalPrice: null }); setIsModalOpen(true); }}
          label="Add Equipment"
        />
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
              <EquipmentCard
                key={equip.id}
                equip={equip}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!initialLoading && equipments.length === 0 && (
        <div className="py-20 text-center text-text-muted italic opacity-50 border-2 border-dashed border-border-subtle rounded-3xl">
          Your equipment locker is currently empty.
        </div>
      )}

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingEquipment={editingEquipment}
        loading={loading}
        formMethods={formMethods}
        onSubmit={onSubmit}
      />

      <DeleteEquipmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loading={loading}
        equipToDelete={equipToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
