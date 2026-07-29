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
  paymentMethod?: "Cashfree" | "COD";
  paymentStatus?: "Paid" | "Pending" | "Failed";
  cfOrderId?: string;
  paymentId?: string;
  userId?: string;
}


const LOCAL_STORAGE_ORDERS_KEY = "thakur_custom_orders";


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

  return {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    updateOrderTracking,
    deleteOrder,
  };
}
