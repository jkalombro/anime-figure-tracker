import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../../shared/services/firebase';

const STORAGE_KEY = 'kuradex_saved_shops';

export function getStoredShops(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredShop(shopName: string): void {
  if (!shopName) return;
  try {
    const existing = getStoredShops();
    const clean = shopName.trim();
    if (clean && !existing.some(s => s.toLowerCase() === clean.toLowerCase())) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, clean]));
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function usePreorderSuggestions(isModalOpen: boolean, preorders: any[]) {
  const [makersSuggestions, setMakersSuggestions] = useState<string[]>([]);
  const [animeSuggestions, setAnimeSuggestions] = useState<string[]>([]);
  const [shopsSuggestions, setShopsSuggestions] = useState<string[]>([]);

  const [showMakerSuggestions, setShowMakerSuggestions] = useState(false);
  const [showAnimeSuggestions, setShowAnimeSuggestions] = useState(false);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isModalOpen) {
        if (!auth.currentUser) {
          const localShops = getStoredShops();
          const existingPreorderShops = preorders.map(p => p.seller?.trim()).filter(Boolean);
          const uniqueShops = Array.from(new Set([...localShops, ...existingPreorderShops]));
          const uniqueMakers = Array.from(new Set(preorders.map(p => p.maker?.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(preorders.map(p => p.sourceAnime?.trim()))).filter(Boolean);

          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
          setShopsSuggestions(uniqueShops);
          return;
        }

        try {
          const makersSnap = await getDocs(collection(db, 'makers')).catch(err => {
            try { handleFirestoreError(err, OperationType.GET, 'makers'); } catch {}
            return { docs: [] } as any;
          });
          const animeSnap = await getDocs(collection(db, 'anime')).catch(err => {
            try { handleFirestoreError(err, OperationType.GET, 'anime'); } catch {}
            return { docs: [] } as any;
          });

          let dbShops: string[] = [];
          try {
            const shopsSnap = await getDocs(collection(db, 'shops'));
            dbShops = shopsSnap.docs.map(doc => doc.data().name?.trim()).filter(Boolean);
          } catch {
            // Silently fall back if remote collection rules are not configured yet
          }

          const localShops = getStoredShops();
          const existingPreorderShops = preorders.map(p => p.seller?.trim()).filter(Boolean);
          const uniqueShops = Array.from(new Set([...localShops, ...dbShops, ...existingPreorderShops]));

          const uniqueMakers = Array.from(new Set(makersSnap.docs.map((doc: any) => doc.data().name?.trim()))).filter(Boolean);
          const uniqueAnime = Array.from(new Set(animeSnap.docs.map((doc: any) => doc.data().title?.trim()))).filter(Boolean);

          setMakersSuggestions(uniqueMakers);
          setAnimeSuggestions(uniqueAnime);
          setShopsSuggestions(uniqueShops);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }
    };
    fetchSuggestions();
  }, [isModalOpen, preorders]);

  const syncNewSuggestions = async (userId: string, data: { maker?: string; sourceAnime?: string; seller?: string }) => {
    if (data.maker) {
      const makerExists = makersSuggestions.some(m => m.toLowerCase() === data.maker!.toLowerCase());
      if (!makerExists && auth.currentUser) {
        await addDoc(collection(db, 'makers'), { name: data.maker, addedBy: userId })
          .catch(err => { try { handleFirestoreError(err, OperationType.CREATE, 'makers'); } catch {} });
      }
    }

    if (data.sourceAnime) {
      const animeExists = animeSuggestions.some(a => a.toLowerCase() === data.sourceAnime!.toLowerCase());
      if (!animeExists && auth.currentUser) {
        await addDoc(collection(db, 'anime'), { title: data.sourceAnime, addedBy: userId })
          .catch(err => { try { handleFirestoreError(err, OperationType.CREATE, 'anime'); } catch {} });
      }
    }

    if (data.seller) {
      saveStoredShop(data.seller);
      const shopExists = shopsSuggestions.some(s => s.toLowerCase() === data.seller!.toLowerCase());
      if (!shopExists && auth.currentUser) {
        try {
          await addDoc(collection(db, 'shops'), { name: data.seller, addedBy: userId });
        } catch {
          // Fallback silently
        }
      }
    }
  };

  return {
    makersSuggestions,
    animeSuggestions,
    shopsSuggestions,
    showMakerSuggestions,
    setShowMakerSuggestions,
    showAnimeSuggestions,
    setShowAnimeSuggestions,
    showShopSuggestions,
    setShowShopSuggestions,
    syncNewSuggestions,
  };
}
