import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export interface CouponItem {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const LOCAL_STORAGE_COUPONS_KEY = "thakur_custom_coupons";


export function useCoupons() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "coupons"), orderBy("code", "asc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: CouponItem[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<CouponItem, "id">),
          }));
          setCoupons(fetched);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore coupons read error:", error);
          loadLocalCoupons();
        }
      );
      return () => unsubscribe();
    } else {
      loadLocalCoupons();
    }
  }, []);

  const loadLocalCoupons = () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
    if (saved) {
      try {
        const parsed: CouponItem[] = JSON.parse(saved);
        const realOnly = parsed.filter((c) => !c.id.startsWith("coup-"));
        setCoupons(realOnly);
        localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(realOnly));
      } catch {
        setCoupons([]);
        localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify([]));
      }
    } else {
      setCoupons([]);
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify([]));
    }
    setLoading(false);
  };

  const addCoupon = async (couponData: Omit<CouponItem, "id" | "usedCount">) => {
    const payload = {
      ...couponData,
      usedCount: 0,
      code: couponData.code.toUpperCase().trim(),
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "coupons"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      const newCoupon: CouponItem = {
        ...payload,
        id: `coup-${Date.now()}`,
      };
      const updated = [newCoupon, ...coupons];
      setCoupons(updated);
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(updated));
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "coupons", id), { isActive: !currentStatus });
    } else {
      const updated = coupons.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c));
      setCoupons(updated);
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(updated));
    }
  };

  const deleteCoupon = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "coupons", id));
    } else {
      const updated = coupons.filter((c) => c.id !== id);
      setCoupons(updated);
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(updated));
    }
  };

  return {
    coupons,
    loading,
    addCoupon,
    toggleCouponStatus,
    deleteCoupon,
  };
}
