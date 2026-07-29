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
import tyHairOil from "@/assets/thakur_yograj_hair_oil.png";
import tyPainOil from "@/assets/thakur_yograj_pain_oil.png";
import tyHairOilDuo from "@/assets/thakur_yograj_hair_oil_duo.png";
import tyPainOilDuo from "@/assets/thakur_yograj_pain_oil_duo.png";

export type Concern = "all" | "hairfall" | "pain" | "ritual";

export interface ProductItem {
  id: string;
  name: string;
  tag?: string;
  subtitle: string;
  price: string;
  old?: string;
  img: string;
  benefits: string[];
  rating: number;
  reviews: number;
  concern: Concern;
  stockQty?: number;
  createdAt?: unknown;
}

export function resolveProductImage(img: string | undefined, name: string): string {
  if (!img) {
    const isPain = name.toLowerCase().includes("pain") || name.toLowerCase().includes("dard");
    const isDuo = name.toLowerCase().includes("big box") || name.toLowerCase().includes("duo") || name.toLowerCase().includes("combo");
    if (isPain) {
      return isDuo ? tyPainOilDuo : tyPainOil;
    }
    return isDuo ? tyHairOilDuo : tyHairOil;
  }

  // If it's a remote URL (like Firebase Storage), use it directly
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }

  // Otherwise, it's a dev asset path (e.g. starting with /assets/, /src/assets/, relative paths, or Lovable placeholders)
  // Resolve it to the hashed production build asset imports
  const isPain = name.toLowerCase().includes("pain") || name.toLowerCase().includes("dard");
  const isDuo = name.toLowerCase().includes("big box") || name.toLowerCase().includes("duo") || name.toLowerCase().includes("combo");
  if (isPain) {
    return isDuo ? tyPainOilDuo : tyPainOil;
  }
  return isDuo ? tyHairOilDuo : tyHairOil;
}

export const DEFAULT_PRODUCTS: Omit<ProductItem, "id">[] = [
  {
    name: "Herbal Hair Oil",
    tag: "New",
    subtitle: "Get Smooth, Silky Healthy Hair — Long Hair Don't Care",
    price: "₹799",
    old: "₹999",
    img: tyHairOil,
    benefits: [
      "100% AYURVEDIC Formulation",
      "CHEMICAL FREE & Safe",
      "HAIRS STRENGTHENING from Roots",
      "Net Volume: 250ml",
    ],
    rating: 4.9,
    reviews: 2148,
    concern: "hairfall",
    stockQty: 48,
  },
  {
    name: "Dard Nivarak Tel",
    tag: "New",
    subtitle: "The Ultimate Solution For Every Pain...",
    price: "₹1,250",
    old: "₹1,499",
    img: tyPainOil,
    benefits: [
      "100% NATURALLY EFFECTIVE",
      "PAIN & INFLAMMATION RELIEF",
      "RAPID ACTION on Joints",
      "Net Wt. 250ml",
    ],
    rating: 4.8,
    reviews: 1642,
    concern: "pain",
    stockQty: 4,
  },
  {
    name: "Herbal Hair Oil - Big Box",
    tag: "Best Value",
    subtitle: "Duo Pack (2 Bottles of 250ml) — Double the Care",
    price: "₹1,599",
    old: "₹1,999",
    img: tyHairOilDuo,
    benefits: [
      "2 x 250ml Bottles Included",
      "100% AYURVEDIC Formulation",
      "CHEMICAL FREE & Safe",
      "HAIRS STRENGTHENING Ritual",
    ],
    rating: 4.9,
    reviews: 812,
    concern: "ritual",
    stockQty: 24,
  },
  {
    name: "Dard Nivarak Tel - Big Box",
    tag: "Best Value",
    subtitle: "Duo Pack (2 Bottles of 250ml) — Constant Relief",
    price: "₹2,400",
    old: "₹2,999",
    img: tyPainOilDuo,
    benefits: [
      "2 x 250ml Bottles Included",
      "100% NATURALLY EFFECTIVE",
      "PAIN & INFLAMMATION RELIEF",
      "RAPID ACTION on Joints",
    ],
    rating: 4.8,
    reviews: 539,
    concern: "ritual",
    stockQty: 18,
  },
];

const LOCAL_STORAGE_PRODUCTS_KEY = "thakur_custom_products";

const INITIAL_PRODUCTS: ProductItem[] = DEFAULT_PRODUCTS.map((p, idx) => ({
  ...p,
  id: `def-${idx + 1}`,
}));

export function useProducts() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: ProductItem[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Omit<ProductItem, "id">;
            return {
              id: doc.id,
              ...data,
              img: resolveProductImage(data.img, data.name),
            };
          });
          if (fetched.length === 0) {
            // Initial seed
            setProducts(
              DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: `def-${idx}` }))
            );
          } else {
            setProducts(fetched);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Firestore products read failed:", error);
          loadLocalProducts();
        }
      );
      return () => unsubscribe();
    } else {
      loadLocalProducts();
    }
  }, []);

  const loadLocalProducts = () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const resolved = parsed.map((p: any) => ({
          ...p,
          img: resolveProductImage(p.img, p.name),
        }));
        setProducts(resolved);
      } catch {
        setDefaultProductsLocal();
      }
    } else {
      setDefaultProductsLocal();
    }
    setLoading(false);
  };

  const setDefaultProductsLocal = () => {
    const initial = DEFAULT_PRODUCTS.map((p, i) => ({
      ...p,
      id: `local-prod-${i + 1}`,
    }));
    setProducts(initial);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(initial));
    }
  };

  const addProduct = async (productData: Omit<ProductItem, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp(),
      });
    } else {
      const newProduct: ProductItem = {
        ...productData,
        id: `prod-${Date.now()}`,
      };
      const updated = [newProduct, ...products];
      setProducts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
      }
    }
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Omit<ProductItem, "id">>
  ) => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, updates);
    } else {
      const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setProducts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
      }
    }
  };

  const deleteProduct = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "products", id));
    } else {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
      }
    }
  };

  const seedProductsToFirestore = async () => {
    if (!isFirebaseConfigured || !db) return;
    for (const p of DEFAULT_PRODUCTS) {
      await addDoc(collection(db, "products"), {
        ...p,
        createdAt: serverTimestamp(),
      });
    }
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    seedProductsToFirestore,
  };
}
