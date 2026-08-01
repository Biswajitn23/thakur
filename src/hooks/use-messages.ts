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
import { useAuth } from "@/lib/auth-context";
import { sendNtfyNotification } from "@/lib/ntfy";

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


export function useMessages(listen = false) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Only listen if listen is true AND user is an admin (or we are in local offline mode)
    const shouldListen = listen && (!isFirebaseConfigured || isAdmin);

    if (!shouldListen) {
      setLoading(false);
      return;
    }

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
  }, [listen, isAdmin]);

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

    sendNtfyNotification({
      title: `New Message from ${msgData.name} ✉️`,
      message: `Subject: ${msgData.subject}\nPhone: ${msgData.phone}\nEmail: ${msgData.email}\nMessage: ${msgData.message}`,
      priority: "default",
      tags: "email,speech_balloon",
    });
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

  return {
    messages,
    loading,
    sendMessage,
    updateMessageStatus,
    deleteMessage,
  };
}
