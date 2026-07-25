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

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: { name: string; price: string; qty: number; img: string }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  courierName?: string;
  trackingNumber?: string;
}

const LOCAL_STORAGE_ORDERS_KEY = "thakur_custom_orders";

const INITIAL_DEMO_ORDERS: OrderItem[] = [
  {
    id: "ORD-9281",
    customerName: "Ananya Sharma",
    customerEmail: "ananya.sharma@example.com",
    customerPhone: "+91 98765 43210",
    shippingAddress: "B-402, Green Valley Apartments, Bandra West, Mumbai - 400050",
    items: [
      {
        name: "Herbal Hair Oil",
        price: "₹799",
        qty: 2,
        img: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/acceb3d6-0ead-46f6-a2cd-d5575bee4650/id-preview-c31f3cc3--40643ab3-0a60-4170-a97f-c32eaab445a3.lovable.app-1783919364369.png",
      },
    ],
    total: 1598,
    status: "Shipped",
    createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  },
  {
    id: "ORD-9282",
    customerName: "Vikramaditya Singh",
    customerEmail: "vikram.singh@example.com",
    customerPhone: "+91 91234 56789",
    shippingAddress: "12/A Civil Lines, Near City Palace, Jaipur, Rajasthan - 302006",
    items: [
      {
        name: "Dard Nivarak Tel - Big Box",
        price: "₹2,400",
        qty: 1,
        img: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/acceb3d6-0ead-46f6-a2cd-d5575bee4650/id-preview-c31f3cc3--40643ab3-0a60-4170-a97f-c32eaab445a3.lovable.app-1783919364369.png",
      },
    ],
    total: 2400,
    status: "Pending",
    createdAt: new Date(Date.now() - 3600000 * 4).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  },
];

export function useOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: OrderItem[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<OrderItem, "id">),
          }));
          setOrders(fetched);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore orders read error:", error);
          loadLocalOrders();
        }
      );
      return () => unsubscribe();
    } else {
      loadLocalOrders();
    }
  }, []);

  const loadLocalOrders = () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (saved) {
      try {
        const parsed: OrderItem[] = JSON.parse(saved);
        const realOnly = parsed.filter((o) => !o.id.startsWith("ORD-928"));
        setOrders(realOnly);
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(realOnly));
      } catch {
        setOrders([]);
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));
      }
    } else {
      setOrders([]);
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));
    }
    setLoading(false);
  };

  const createOrder = async (
    orderData: Omit<OrderItem, "id" | "createdAt" | "status">
  ) => {
    const newOrderPayload = {
      ...orderData,
      status: "Pending" as OrderStatus,
      createdAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "orders"), {
        ...newOrderPayload,
        serverTimestamp: serverTimestamp(),
      });
    } else {
      const newOrder: OrderItem = {
        ...newOrderPayload,
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      const updated = [newOrder, ...orders];
      setOrders(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      }
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, { status });
    } else {
      const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
      setOrders(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      }
    }
  };

  const deleteOrder = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "orders", id));
    } else {
      const updated = orders.filter((o) => o.id !== id);
      setOrders(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      }
    }
  };

  const updateOrderTracking = async (id: string, courierName: string, trackingNumber: string) => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, { courierName, trackingNumber, status: "Shipped" });
    } else {
      const updated = orders.map((o) =>
        o.id === id ? { ...o, courierName, trackingNumber, status: "Shipped" as OrderStatus } : o
      );
      setOrders(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      }
    }
  };

  const seedOrdersToFirestore = async () => {
    if (!isFirebaseConfigured || !db) return;
    for (const o of INITIAL_DEMO_ORDERS) {
      const { id, ...payload } = o;
      await addDoc(collection(db, "orders"), {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
    }
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    updateOrderTracking,
    deleteOrder,
    seedOrdersToFirestore,
  };
}
