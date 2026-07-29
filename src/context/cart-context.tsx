import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export type CartItem = { name: string; price: string; img: string; qty: number };

export function parsePrice(price: string) {
  return Number(price.replace(/[^\d.]/g, "")) || 0;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (p: { name: string; price: string; img: string }, openCartAfter?: boolean) => void;
  removeItem: (name: string) => void;
  setQty: (name: string, qty: number) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  count: number;
  subtotal: number;
  clearCart: () => void;
  wishlist: CartItem[];
  toggleWishlist: (p: { name: string; price: string; img: string }) => void;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  isQuizOpen: boolean;
  openQuiz: () => void;
  closeQuiz: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<CartItem[]>([]);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const [isQuizOpen, setQuizOpen] = useState(false);

  // Use refs to prevent save-before-load race conditions
  const cartLoadedRef = useRef(false);
  const wishlistLoadedRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(null);

  // Reset loaded status on user login/logout
  useEffect(() => {
    if (user?.uid !== activeUserIdRef.current) {
      activeUserIdRef.current = user?.uid || null;
      cartLoadedRef.current = false;
      wishlistLoadedRef.current = false;
      setItems([]);
      setWishlist([]);
    }
  }, [user?.uid]);

  // 1. LOAD cart and wishlist from Firestore (with LocalStorage fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.uid) {
      setItems([]);
      setWishlist([]);
      return;
    }

    const loadData = async () => {
      const userId = user.uid;

      // --- Cart Load ---
      let loadedCart: CartItem[] = [];
      const userCartKey = `thakur_cart_${userId}`;
      const localCart = localStorage.getItem(userCartKey);
      if (localCart) {
        try {
          loadedCart = JSON.parse(localCart);
        } catch {
          loadedCart = [];
        }
      }

      if (isFirebaseConfigured && db) {
        try {
          const cartDoc = await getDoc(doc(db, "carts", userId));
          if (cartDoc.exists()) {
            loadedCart = cartDoc.data().items || [];
          } else {
            // Seed Firestore with local cart if it exists
            await setDoc(doc(db, "carts", userId), { items: loadedCart }, { merge: true });
          }
        } catch (err) {
          console.warn("Firestore cart read error, fallback to local:", err);
        }
      }
      setItems(loadedCart);
      cartLoadedRef.current = true;

      // --- Wishlist Load ---
      let loadedWishlist: CartItem[] = [];
      const userWishlistKey = `thakur_wishlist_${userId}`;
      const localWishlist = localStorage.getItem(userWishlistKey);
      if (localWishlist) {
        try {
          loadedWishlist = JSON.parse(localWishlist);
        } catch {
          loadedWishlist = [];
        }
      }

      if (isFirebaseConfigured && db) {
        try {
          const wishlistDoc = await getDoc(doc(db, "wishlists", userId));
          if (wishlistDoc.exists()) {
            loadedWishlist = wishlistDoc.data().items || [];
          } else {
            // Seed Firestore with local wishlist
            await setDoc(doc(db, "wishlists", userId), { items: loadedWishlist }, { merge: true });
          }
        } catch (err) {
          console.warn("Firestore wishlist read error, fallback to local:", err);
        }
      }
      setWishlist(loadedWishlist);
      wishlistLoadedRef.current = true;
    };

    loadData();
  }, [user?.uid]);

  // 2. SAVE cart changes
  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid || !cartLoadedRef.current) return;

    const userCartKey = `thakur_cart_${user.uid}`;
    localStorage.setItem(userCartKey, JSON.stringify(items));

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "carts", user.uid), { items }, { merge: true }).catch((err) =>
        console.warn("Failed to save cart to Firestore:", err)
      );
    }
  }, [items, user?.uid]);

  // 3. SAVE wishlist changes
  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid || !wishlistLoadedRef.current) return;

    const userWishlistKey = `thakur_wishlist_${user.uid}`;
    localStorage.setItem(userWishlistKey, JSON.stringify(wishlist));

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "wishlists", user.uid), { items: wishlist }, { merge: true }).catch((err) =>
        console.warn("Failed to save wishlist to Firestore:", err)
      );
    }
  }, [wishlist, user?.uid]);

  function addItem(p: { name: string; price: string; img: string }, openCartAfter: boolean = false) {
    if (!user) {
      toast.error("Please log in to your account to add items to your shopping bag.");
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.name === p.name);
      if (existing) return prev.map((i) => (i.name === p.name ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...p, qty: 1 }];
    });

    toast.success(`Added "${p.name}" to your shopping bag.`);
    if (openCartAfter) {
      setCartOpen(true);
    }
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }

  function setQty(name: string, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.name !== name));
    } else {
      setItems((prev) => prev.map((i) => (i.name === name ? { ...i, qty } : i)));
    }
  }

  function clearCart() {
    setItems([]);
  }

  function toggleWishlist(p: { name: string; price: string; img: string }) {
    if (!user) {
      toast.error("Please log in to save items to your wishlist.");
      return;
    }

    setWishlist((prev) => {
      const existing = prev.find((item) => item.name === p.name);
      if (existing) {
        toast.success(`Removed "${p.name}" from your wishlist.`);
        return prev.filter((item) => item.name !== p.name);
      } else {
        toast.success(`Added "${p.name}" to your wishlist.`);
        return [...prev, { name: p.name, price: p.price, img: p.img, qty: 1 }];
      }
    });
  }

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        setQty,
        isOpen: isCartOpen,
        openCart: () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
        count,
        subtotal,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlistOpen,
        openWishlist: () => setWishlistOpen(true),
        closeWishlist: () => setWishlistOpen(false),
        isQuizOpen,
        openQuiz: () => setQuizOpen(true),
        closeQuiz: () => setQuizOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
