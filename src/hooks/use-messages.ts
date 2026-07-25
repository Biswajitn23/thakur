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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}

const LOCAL_STORAGE_MESSAGES_KEY = "thakur_custom_contact_messages";

const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: "msg-101",
    name: "Dr. Rajesh Varma",
    email: "rajesh.varma@ayurmed.org",
    phone: "+91 94255 12345",
    subject: "Bulk Institutional Inquiry for Herbal Oils",
    message: "Namaste Thakur Vaidya team. We run a holistic wellness retreat in Raipur and would like to order 50 units of Pain Relief Oil and Hair Oil Duo monthly. Please share wholesale terms.",
    status: "unread",
    createdAt: new Date(Date.now() - 3600000 * 5).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  },
  {
    id: "msg-102",
    name: "Meenakshi Sundaram",
    email: "meenakshi.s@gmail.com",
    phone: "+91 98840 99887",
    subject: "Dosha Consultation Query",
    message: "I took the online Pitta-Vata diagnostic quiz and had a question regarding the recommended hair routine duration. Should I apply the oil overnight or 2 hours prior to bath?",
    status: "read",
    createdAt: new Date(Date.now() - 86400000 * 1.5).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  },
];

export function useMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: ContactMessage[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ContactMessage, "id">),
          }));
          setMessages(fetched);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore messages read error:", error);
          loadLocalMessages();
        }
      );
      return () => unsubscribe();
    } else {
      loadLocalMessages();
    }
  }, []);

  const loadLocalMessages = () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (saved) {
      try {
        const parsed: ContactMessage[] = JSON.parse(saved);
        const realOnly = parsed.filter((m) => !m.id.startsWith("msg-"));
        setMessages(realOnly);
        localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(realOnly));
      } catch {
        setMessages([]);
        localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify([]));
      }
    } else {
      setMessages([]);
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify([]));
    }
    setLoading(false);
  };

  const sendMessage = async (msgData: Omit<ContactMessage, "id" | "status" | "createdAt">) => {
    const payload = {
      ...msgData,
      status: "unread" as const,
      createdAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "contact_messages"), {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
    } else {
      const newMessage: ContactMessage = {
        ...payload,
        id: `msg-${Date.now()}`,
      };
      const updated = [newMessage, ...messages];
      setMessages(updated);
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(updated));
    }
  };

  const updateMessageStatus = async (id: string, status: "unread" | "read" | "replied") => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "contact_messages", id), { status });
    } else {
      const updated = messages.map((m) => (m.id === id ? { ...m, status } : m));
      setMessages(updated);
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(updated));
    }
  };

  const deleteMessage = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "contact_messages", id));
    } else {
      const updated = messages.filter((m) => m.id !== id);
      setMessages(updated);
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(updated));
    }
  };

  const seedMessagesToFirestore = async () => {
    if (!isFirebaseConfigured || !db) return;
    for (const m of INITIAL_MESSAGES) {
      const { id, ...payload } = m;
      await addDoc(collection(db, "contact_messages"), {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    updateMessageStatus,
    deleteMessage,
    seedMessagesToFirestore,
  };
}
