import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export interface StoreSettings {
  isCodEnabled: boolean;
  deliveryFee: number;
  freeShippingThreshold: number;
  gstPercentage: number;
  isGstIncluded: boolean;
}

const LOCAL_STORAGE_SETTINGS_KEY = "thakur_store_settings";

const DEFAULT_SETTINGS: StoreSettings = {
  isCodEnabled: true,
  deliveryFee: 49,
  freeShippingThreshold: 2500,
  gstPercentage: 18,
  isGstIncluded: true,
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const unsub = onSnapshot(
        doc(db, "config", "storeSettings"),
        (snap) => {
          if (snap.exists()) {
            const data = { ...DEFAULT_SETTINGS, ...snap.data() } as StoreSettings;
            setSettings(data);
            if (typeof window !== "undefined") {
              localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(data));
            }
          } else if (db) {
            // Seed default settings doc in Firestore
            setDoc(doc(db, "config", "storeSettings"), DEFAULT_SETTINGS, { merge: true });
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore storeSettings error, fallback to local:", err);
          setLoading(false);
        }
      );
      return () => unsub();
    } else {
      setLoading(false);
    }
  }, []);

  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    const updated: StoreSettings = { ...settings, ...updates };
    setSettings(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "config", "storeSettings"), updates, { merge: true });
    }
  };

  const updateCodSetting = async (isCodEnabled: boolean) => {
    await updateStoreSettings({ isCodEnabled });
  };

  return {
    settings,
    loading,
    updateCodSetting,
    updateStoreSettings,
  };
}
