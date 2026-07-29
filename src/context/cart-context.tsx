import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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

  // Sync user-specific cart from localStorage on user change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user?.uid) {
      const userCartKey = `thakur_cart_${user.uid}`;
      const savedCart = localStorage.getItem(userCartKey);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }

      const userWishlistKey = `thakur_wishlist_${user.uid}`;
      const savedWishlist = localStorage.getItem(userWishlistKey);
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
    } else {
      setItems([]);
      setWishlist([]);
    }
  }, [user?.uid]);

  // Save cart to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid) return;
    const userCartKey = `thakur_cart_${user.uid}`;
    localStorage.setItem(userCartKey, JSON.stringify(items));
  }, [items, user?.uid]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !user?.uid) return;
    const userWishlistKey = `thakur_wishlist_${user.uid}`;
    localStorage.setItem(userWishlistKey, JSON.stringify(wishlist));
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
