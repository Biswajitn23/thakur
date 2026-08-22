import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProducts, type ProductItem } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { useCoupons } from "@/hooks/use-coupons";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { createCashfreeOrderFn, verifyCashfreeOrderFn } from "@/lib/cashfree-server";
import { getCashfreeInstance } from "@/lib/cashfree";
import { sendNtfyNotification } from "@/lib/ntfy";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import painOilAsset from "@/assets/pain-oil.asset.json";
import hairOilBoxAsset from "@/assets/hair-oil-box.asset.json";
import lifestyleHairAsset from "@/assets/lifestyle-hair.asset.json";
import lifestylePainAsset from "@/assets/lifestyle-pain.asset.json";
import heroBg from "@/assets/hero-bg.jpg";
import ingredientsImg from "@/assets/ingredients.jpg";
import processImg from "@/assets/process.jpg";
import hairModelImg from "@/assets/hair-model.jpg";
import tyHairOil from "@/assets/thakur_yograj_hair_oil.png";
import tyPainOil from "@/assets/thakur_yograj_pain_oil.png";
import tyHairOilDuo from "@/assets/thakur_yograj_hair_oil_duo.png";
import tyPainOilDuo from "@/assets/thakur_yograj_pain_oil_duo.png";
import lifestyleHairLuxury from "@/assets/lifestyle_hair_luxury.png";
import lifestylePainRelief from "@/assets/lifestyle_pain_relief.png";
import ingredientsAyurveda from "@/assets/ingredients_ayurveda.png";
import tyHairOilLifestyle from "@/assets/lifestyle_hair_oil_product.png";
import tyPainOilLifestyle from "@/assets/lifestyle_pain_oil_product.png";
import brandLogo from "@/assets/logo.png";
import hairBeforeComp from "@/assets/hair_before_comparison.png";
import hairAfterComp from "@/assets/hair_after_comparison.png";
import biotiqueHeroBg from "@/assets/biotique_hero_bg.png";
import { SiteHeader } from "@/components/SiteHeader";
import { LightningSaleSection } from "@/components/LightningSaleSection";
import { AuthModal } from "@/components/AuthModal";
import { ProductCard as ModernProductCard } from "@/components/ui/ProductCard";
import { ShieldCheck, Sparkles, Heart, Leaf, Award } from "lucide-react";




function QuantityInput({ value, onChange }: { value: number; onChange: (qty: number) => void }) {
  const [localVal, setLocalVal] = useState(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(/[^\d]/g, "");
    setLocalVal(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      onChange(1);
      setLocalVal("1");
    }
  };

  const handleDecrement = () => {
    const parsed = parseInt(localVal, 10);
    if (!isNaN(parsed) && parsed > 1) {
      onChange(parsed - 1);
      setLocalVal((parsed - 1).toString());
    } else {
      onChange(1);
      setLocalVal("1");
    }
  };

  const handleIncrement = () => {
    const parsed = parseInt(localVal, 10);
    const current = isNaN(parsed) ? 1 : parsed;
    onChange(current + 1);
    setLocalVal((current + 1).toString());
  };

  return (
    <div className="flex items-center border border-gold/30 bg-white rounded-xl overflow-hidden shadow-sm h-8 shrink-0">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="w-8 h-full flex items-center justify-center font-bold text-base text-forest/75 hover:bg-forest/5 hover:text-gold transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-10 text-center text-xs font-bold text-forest bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 select-all font-mono"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="w-8 h-full flex items-center justify-center font-bold text-base text-forest/75 hover:bg-forest/5 hover:text-gold transition cursor-pointer select-none"
      >
        +
      </button>
    </div>
  );
}

const indexSearchSchema = z.object({
  concern: z.enum(["all", "hairfall", "pain", "ritual"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: indexSearchSchema,
  head: () => ({
    meta: [
      { title: "Thakur Yograj — Ayurvedic Hair Oil & Pain Relief Oil" },
      { name: "description", content: "Experience premium, 100% authentic Ayurvedic oils handcrafted by Thakur Yograj. Made in India, chemical-free hair care and natural pain relief solutions." },
    ],
  }),
  component: Index,
});

/* ---------------- SHOP-BY-CONCERN (shared state) ---------------- */
type Concern = "all" | "hairfall" | "pain" | "ritual";

const CONCERNS: { id: Concern; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hairfall", label: "Hair Care" },
  { id: "pain", label: "Pain Relief" },
  { id: "ritual", label: "Big Boxes" },
];

const ConcernContext = createContext<{
  concern: Concern;
  setConcern: (c: Concern) => void;
}>({ concern: "all", setConcern: () => { } });



function animateFlyToCart(imgSrc: string, startEl: HTMLElement) {
  const target = document.getElementById("cart-btn-desktop");
  if (!target || !startEl) return;

  const startRect = startEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Create absolute floating image overlay
  const img = document.createElement("img");
  img.src = imgSrc;
  img.style.position = "fixed";
  img.style.left = `${startRect.left + startRect.width / 2 - 24}px`;
  img.style.top = `${startRect.top + startRect.height / 2 - 24}px`;
  img.style.width = "48px";
  img.style.height = "48px";
  img.style.borderRadius = "12px";
  img.style.objectFit = "cover";
  img.style.zIndex = "9999";
  img.style.pointerEvents = "none";
  img.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
  img.style.border = "1px solid rgba(212,175,55,0.4)";
  img.style.transition = "all 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)";

  document.body.appendChild(img);

  // Force reflow to register initial styles
  img.offsetWidth;

  // Move and scale down to target
  img.style.left = `${targetRect.left + targetRect.width / 2}px`;
  img.style.top = `${targetRect.top + targetRect.height / 2}px`;
  img.style.transform = "translate(-50%, -50%) scale(0.15)";
  img.style.opacity = "0.2";

  img.addEventListener("transitionend", () => {
    img.remove();
    // Play bounce animation on target
    target.classList.add("animate-cart-bounce");
    setTimeout(() => {
      target.classList.remove("animate-cart-bounce");
    }, 450);
  });
}

import { useCartContext, type CartItem, parsePrice } from "@/context/cart-context";

export const CartContext = createContext<{
  items: CartItem[];
  addItem: (
    p: { name: string; price: string; img: string },
    clickEvent?: React.MouseEvent<HTMLElement>,
    openCartAfter?: boolean
  ) => void;
  removeItem: (name: string) => void;
  setQty: (name: string, qty: number) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  count: number;
  subtotal: number;
  wishlist: CartItem[];
  toggleWishlist: (p: { name: string; price: string; img: string }) => void;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  isQuizOpen: boolean;
  openQuiz: () => void;
  closeQuiz: () => void;
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
}>({
  items: [],
  addItem: () => { },
  removeItem: () => { },
  setQty: () => { },
  isOpen: false,
  openCart: () => { },
  closeCart: () => { },
  count: 0,
  subtotal: 0,
  wishlist: [],
  toggleWishlist: () => { },
  isWishlistOpen: false,
  openWishlist: () => { },
  closeWishlist: () => { },
  isQuizOpen: false,
  openQuiz: () => { },
  closeQuiz: () => { },
  appliedCoupon: null,
  setAppliedCoupon: () => { },
});

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { concern: searchConcern } = Route.useSearch();
  const [concern, setConcern] = useState<Concern>("all");
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [currencyRate, setCurrencyRate] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { products } = useProducts();

  useEffect(() => {
    if (searchConcern) {
      setConcern(searchConcern);
      setTimeout(() => {
        document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [searchConcern]);

  const {
    items,
    addItem: globalAddItem,
    removeItem,
    setQty,
    isOpen: isCartOpen,
    openCart,
    closeCart,
    count,
    subtotal,
    wishlist,
    toggleWishlist: globalToggleWishlist,
    isWishlistOpen,
    openWishlist,
    closeWishlist,
    isQuizOpen,
    openQuiz,
    closeQuiz,
    appliedCoupon,
    setAppliedCoupon,
  } = useCartContext();

  // Restore pending action after login
  useEffect(() => {
    if (user) {
      const pending = sessionStorage.getItem("pending_action");
      if (pending) {
        try {
          const action = JSON.parse(pending);
          if (action.type === "add_to_cart") {
            globalAddItem(action.product, false);
            if (action.openCart) {
              setTimeout(() => {
                openCart();
              }, 500);
            }
            toast.success(`"${action.product.name}" has been added to your shopping bag!`);
          } else if (action.type === "wishlist") {
            globalToggleWishlist(action.product);
          }
        } catch (e) {
          console.error("Failed to parse pending action:", e);
        } finally {
          sessionStorage.removeItem("pending_action");
        }
      }
    }
  }, [user]);

  // Auto-open cart sidebar when navigating back from checkout via "Shopping Bag" step
  useEffect(() => {
    if (sessionStorage.getItem("open_cart_on_home") === "1") {
      sessionStorage.removeItem("open_cart_on_home");
      setTimeout(() => openCart(), 200);
    }
  }, []);

  function toggleWishlist(p: { name: string; price: string; img: string }) {
    if (!user) {
      sessionStorage.setItem("pending_action", JSON.stringify({ type: "wishlist", product: p }));
      setAuthModalOpen(true);
      return;
    }
    globalToggleWishlist(p);
  }

  function addItem(
    p: { name: string; price: string; img: string },
    clickEvent?: React.MouseEvent<HTMLElement>,
    openCartAfter: boolean = false
  ) {
    if (!user) {
      sessionStorage.setItem("pending_action", JSON.stringify({ type: "add_to_cart", product: p, openCart: openCartAfter }));
      setAuthModalOpen(true);
      return;
    }

    globalAddItem(p, false);

    if (clickEvent) {
      animateFlyToCart(p.img, clickEvent.currentTarget);
      if (openCartAfter) {
        setTimeout(() => {
          openCart();
        }, 950);
      }
    } else if (openCartAfter) {
      openCart();
    }
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Biotique Ayurveda — Thakur Yograj",
    "url": "https://thakuryograj.com",
    "logo": "https://thakuryograj.com/favicon.png",
    "sameAs": ["https://facebook.com/biotique", "https://instagram.com/biotique"],
  };

  const productListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Product",
        "name": p.name,
        "description": p.subtitle,
        "image": p.img,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": p.price.replace(/[^0-9]/g, ""),
          "availability": "https://schema.org/InStock",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": p.rating,
          "reviewCount": p.reviews,
        },
      },
    })),
  };

  return (
    <ConcernContext.Provider value={{ concern, setConcern }}>
      <CartContext.Provider
        value={{
          items,
          addItem,
          removeItem,
          setQty,
          isOpen: isCartOpen,
          openCart,
          closeCart,
          count,
          subtotal,
          wishlist,
          toggleWishlist,
          isWishlistOpen,
          openWishlist,
          closeWishlist,
          isQuizOpen,
          openQuiz,
          closeQuiz,
          appliedCoupon,
          setAppliedCoupon,
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
        />
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
          <SiteHeader
            currencySymbol={currencySymbol}
            setCurrencySymbol={setCurrencySymbol}
            currencyRate={currencyRate}
            setCurrencyRate={setCurrencyRate}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
          <Hero />
          <TrustBar />
          <LightningSaleSection
            products={products}
            onAddToCart={(p, qty, e) => addItem(p, e, false)}
            currencySymbol={currencySymbol}
            currencyRate={currencyRate}
          />
          <Marquee />
          <Philosophy />
          <CertificationGrid />
          <RangeOfSolutions />
          <Products currencySymbol={currencySymbol} currencyRate={currencyRate} />
          <Spotlight />
          <Ingredients />
          <Benefits />
          <Process />
          <ExpertVoices />
          <RitualGuide />
          <BeforeAfter />
          <Testimonials />
          <TribeReviews />
          <Story />
          <WhyChoose />
          <DoshaQuizCTA />
          <FeaturedCollection />
          <VideoGallery />
          <KnowledgeHub />
          <FAQ />
          <FinalCTA />
          <Footer />
          <CartDrawer />
          <WishlistDrawer />
          <DoshaQuizModal />
          <WhatsAppFloat />
          <SearchOverlay open={isSearchOpen} onClose={() => setSearchOpen(false)} />
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
      </CartContext.Provider>
    </ConcernContext.Provider>
  );
}


/* ---------------- NAVBAR ---------------- */
function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const { setConcern } = useContext(ConcernContext);
  const { count, openCart, wishlist, openWishlist } = useContext(CartContext);
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  function goShop(id: Concern) {
    setConcern(id);
    setMobileMenuOpen(false);
    document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-ivory/70 border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-24 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img src={brandLogo} alt="Thakur Yograj" className="h-16 md:h-20 w-auto drop-shadow-sm transition-all" />
        </a>
        <nav className="hidden lg:flex items-center gap-10 text-sm tracking-wide text-forest/80">
          <div className="group relative py-10 -my-10">
            <button className="flex items-center gap-1.5 hover:text-gold transition">
              Shop <ChevronIcon />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block">
              <div className="w-[420px] rounded-2xl border border-gold/25 bg-ivory shadow-luxe p-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-forest/50 mb-3">
                    Hair Care
                  </div>
                  <button
                    onClick={() => goShop("hairfall")}
                    className="block text-left font-display text-lg text-forest hover:text-gold transition"
                  >
                    Herbal Hair Oil
                  </button>
                  <p className="mt-1 text-xs text-forest/60">For hair fall & regrowth.</p>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-forest/50 mb-3">
                    Pain Relief
                  </div>
                  <button
                    onClick={() => goShop("pain")}
                    className="block text-left font-display text-lg text-forest hover:text-gold transition"
                  >
                    Dard Nivarak Tel
                  </button>
                  <p className="mt-1 text-xs text-forest/60">For joint & muscle pain.</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-gold/20">
                  <button
                    onClick={() => goShop("ritual")}
                    className="inline-flex items-center gap-2 text-sm text-forest hover:text-gold transition"
                  >
                    The Wellness Ritual (combo) <ArrowIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <a href="#ingredients" className="hover:text-gold transition">
            Ingredients
          </a>
          <a href="#process" className="hover:text-gold transition">
            Our Craft
          </a>
          <a href="#story" className="hover:text-gold transition">
            Heritage
          </a>
          <a href="#journal" className="hover:text-gold transition">
            Journal
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <button
            aria-label="Search"
            onClick={onSearchClick}
            className="inline-grid place-items-center w-10 h-10 rounded-full border border-gold/30 text-forest hover:bg-gold/10 transition shrink-0"
          >
            <SearchIcon />
          </button>
          {user && (
            <button
              aria-label="Wishlist"
              onClick={openWishlist}
              className="relative inline-grid place-items-center w-10 h-10 rounded-full border border-gold/30 text-forest hover:bg-gold/10 transition shrink-0 cursor-pointer"
            >
              <HeartIcon />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-gold text-forest text-[10px] font-semibold">
                  {wishlist.length}
                </span>
              )}
            </button>
          )}
          {user && (
            <button
              id="cart-btn-desktop"
              aria-label="Cart"
              onClick={openCart}
              className="relative inline-grid place-items-center w-10 h-10 rounded-full border border-gold/30 text-forest hover:bg-gold/10 transition shrink-0"
            >
              <CartIcon />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-gold text-forest text-[10px] font-semibold">
                  {count}
                </span>
              )}
            </button>
          )}
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-gold/40 bg-gradient-to-r from-forest/5 via-gold/10 to-forest/5 text-forest hover:border-gold hover:shadow-md transition shrink-0 cursor-pointer group"
              >
                <div className="relative w-7 h-7 rounded-full bg-forest text-gold font-bold text-xs grid place-items-center border border-gold/40 shadow-inner group-hover:scale-105 transition-transform">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-ivory" />
                </div>
                <span className="hidden xl:inline text-xs font-bold tracking-wider uppercase text-forest">
                  {user.role === "admin" ? "👑 Admin" : user.displayName || "Account"}
                </span>
                <span className="text-[10px] text-forest/50 font-bold group-hover:text-gold transition">▼</span>
              </button>
 
              {isProfileDropdownOpen && (
                <>
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gold/30 bg-ivory shadow-2xl p-4 z-20 space-y-3.5 text-left backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3 border-b border-gold/15 pb-3">
                      <div className="w-10 h-10 rounded-full bg-forest text-gold font-bold text-sm grid place-items-center border border-gold/40 shadow-md shrink-0">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-forest truncate">
                          {user.displayName || "Valued Member"}
                        </div>
                        <div className="text-[10px] text-forest/65 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <Link
                        to="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-forest hover:bg-forest/5 hover:text-gold transition font-semibold"
                      >
                        <span>📜</span>
                        <span>My Orders & History</span>
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-forest text-ivory font-bold hover:bg-forest-deep transition shadow-sm"
                        >
                          <span>👑</span>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gold/15 pt-2">
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-500/10 font-bold transition cursor-pointer text-xs"
                      >
                        <span>🚪</span>
                        <span>Sign Out Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 text-forest hover:bg-gold/10 text-xs font-semibold tracking-wider uppercase transition shrink-0"
            >
              <UserIcon />
              <span className="hidden xl:inline">Login</span>
            </Link>
          )}
          <a
            href="#products-list"
            className="hidden sm:inline-block px-5 py-2.5 rounded-full bg-forest text-ivory text-sm tracking-wide hover:bg-forest-deep transition shrink-0"
          >
            Shop Now
          </a>

          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 grid place-items-center rounded-full border border-gold/30 text-forest shrink-0 transition"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-24 bg-ivory border-b border-gold/25 z-40 lg:hidden shadow-luxe py-8 px-6 animate-fade-in">
          <nav className="flex flex-col gap-6 text-base tracking-wide text-forest font-semibold">
            <button
              onClick={() => goShop("hairfall")}
              className="text-left py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Shop Hair Care
            </button>
            <button
              onClick={() => goShop("pain")}
              className="text-left py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Shop Pain Relief
            </button>
            <button
              onClick={() => goShop("ritual")}
              className="text-left py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Shop Ritual Combos
            </button>
            <a
              href="#ingredients"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Ingredients
            </a>
            <a
              href="#process"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Our Craft
            </a>
            <a
              href="#story"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gold/10 hover:text-gold transition-colors"
            >
              Heritage
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------------- HERO ---------------- */
const HERO_SLIDES = [
  {
    eyebrow: "Signature Ayurvedic Blend",
    title: "Nature's Strength.",
    highlight: "Luxury in Every Drop.",
    desc: "100% Ayurvedic formulation slow-infused with 27 rare herbs to stimulate follicle growth, halt hair fall, and nourish your scalp.",
    btnText: "Shop Hair Oil",
    img: tyHairOilLifestyle,
    tag: "New Product",
    badgeText: "Herbal Hair Oil",
    badgeVal: "₹799 / 250ml",
    concern: "hairfall" as Concern,
  },
  {
    eyebrow: "Targeted Ayurvedic Relief",
    title: "Instant Comfort.",
    highlight: "Deep Muscle Care.",
    desc: "A traditional recipe of active, warming botanicals designed to penetrate deep into joints, ease muscle stiffness, and soothe swelling.",
    btnText: "Shop Pain Oil",
    img: tyPainOilLifestyle,
    tag: "New Product",
    badgeText: "Dard Nivarak Tel",
    badgeVal: "₹1,250 / 250ml",
    concern: "pain" as Concern,
  },
  {
    eyebrow: "Double the Nourishment",
    title: "Herbal Hair Oil",
    highlight: "Big Box Duo.",
    desc: "Our double pack contains 2 bottles of 250ml each of our premium Herbal Hair Oil. Designed for continuous follicle strength and long-term care.",
    btnText: "Shop Hair Duo",
    img: tyHairOilDuo,
    tag: "Best Value",
    badgeText: "Hair Oil Big Box",
    badgeVal: "₹1,599 / 2 Bottles",
    concern: "ritual" as Concern,
  },
  {
    eyebrow: "Constant Joint Relief",
    title: "Dard Nivarak",
    highlight: "Big Box Duo.",
    desc: "A double supply of Dard Nivarak Tel containing 2 bottles of 250ml each. Perfect for keeping you and your family active and pain-free every day.",
    btnText: "Shop Pain Duo",
    img: tyPainOilDuo,
    tag: "Best Value",
    badgeText: "Pain Tel Big Box",
    badgeVal: "₹2,400 / 2 Bottles",
    concern: "ritual" as Concern,
  },
];

function Hero() {
  const { setConcern } = useContext(ConcernContext);

  function goToConcern(id: Concern) {
    setConcern(id);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative w-full bg-[#d7e9d7] overflow-hidden border-b border-emerald-950/15">
      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-1 text-xs font-semibold text-emerald-950/70 flex items-center gap-1.5">
        <Link to="/" className="hover:text-emerald-950 transition">Home</Link>
        <span>›</span>
        <span className="text-emerald-950 font-bold">All products</span>
      </div>

      {/* Hero Content Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[460px] lg:min-h-[500px]">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-multiply bg-cover bg-right lg:bg-center pointer-events-none"
          style={{ backgroundImage: `url(${biotiqueHeroBg})` }}
        />

        {/* LEFT COLUMN: Headline & Offer Box */}
        <div className="relative z-10 lg:w-6/12 flex flex-col items-start text-left">
          {/* Biotique Logo Mark */}
          <div className="flex items-center gap-2 mb-3">
            <img src={brandLogo} alt="BIOTIQUE" className="h-10 sm:h-12 w-auto drop-shadow-sm" />
            <span className="text-[11px] font-extrabold tracking-[0.25em] text-emerald-950 uppercase">
              ADVANCED AYURVEDA
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-emerald-950 leading-[1.08] tracking-tight">
            Heal, hydrate, <br />
            and restore <br />
            <span className="font-sans font-normal text-emerald-800 text-2xl sm:text-4xl lg:text-5xl">
              your summer radiance
            </span>
          </h1>

          {/* Outlined "Get 35% off on 1099" Box */}
          <div className="relative mt-6 mb-6 w-full max-w-md border-2 border-emerald-950/80 rounded-3xl p-5 sm:p-6 text-center bg-[#d7e9d7]/80 backdrop-blur-xs shadow-sm">
            {/* Intersecting "Get" tag */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#d7e9d7] px-4 font-bold text-emerald-950 text-sm tracking-wide">
              Get
            </span>
            <div className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-emerald-950 tracking-tight">
              35% off
            </div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-950 mt-1 uppercase tracking-wider">
              on 1099
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => goToConcern("all")}
              className="px-8 py-3.5 rounded-full bg-emerald-950 hover:bg-emerald-900 text-ivory text-xs font-bold uppercase tracking-[0.15em] transition shadow-md active:scale-95 cursor-pointer"
            >
              Shop Offer Now
            </button>
            <a
              href="#products"
              className="px-6 py-3.5 rounded-full border border-emerald-950/40 text-emerald-950 hover:bg-emerald-950/10 text-xs font-bold uppercase tracking-wider transition"
            >
              Explore Formulations
            </a>
          </div>

          {/* Trust Badges Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-5 text-[11px] font-bold text-emerald-950/85 pt-4 border-t border-emerald-950/20">
            <span className="flex items-center gap-1.5">🌿 Ayurvedic Goodness</span>
            <span className="flex items-center gap-1.5">🌱 100% Botanical Extracts</span>
            <span className="flex items-center gap-1.5">✨ Safe & Gentle on Skin</span>
            <span className="flex items-center gap-1.5">🐰 Cruelty Free</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Featured 3 Product Bottles Standing on Table Surface */}
        <div className="relative z-10 lg:w-6/12 flex items-end justify-center lg:justify-end w-full pt-4 lg:pt-0">
          <div className="relative flex items-end justify-center gap-2 sm:gap-4 max-w-xl">
            {/* Drop Shadow Table Base */}
            <div className="absolute -bottom-3 left-0 right-0 h-6 bg-emerald-950/15 rounded-full blur-md" />

            {/* Bottle 1: Papaya Deep Cleanse */}
            <div className="relative z-10 w-28 sm:w-36 lg:w-44 transition-transform hover:-translate-y-2 duration-300">
              <div className="bg-white/95 p-2.5 rounded-3xl border border-emerald-950/20 shadow-xl backdrop-blur-xs flex flex-col items-center">
                <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-full mb-1">
                  Face Wash
                </span>
                <img
                  src={tyHairOil}
                  alt="Papaya Deep Cleanse"
                  className="w-full h-32 sm:h-44 object-contain drop-shadow-md"
                />
                <span className="text-[10px] font-extrabold text-emerald-950 mt-1 line-clamp-1">
                  Papaya Cleanse
                </span>
              </div>
            </div>

            {/* Bottle 2: Sun Shield (Featured Center Orange Bottle) */}
            <div className="relative z-20 w-32 sm:w-40 lg:w-48 -mb-2 transition-transform hover:-translate-y-2 duration-300">
              <div className="bg-gradient-to-b from-amber-50 to-amber-100 p-2.5 rounded-3xl border-2 border-amber-500/50 shadow-2xl backdrop-blur-xs flex flex-col items-center">
                <span className="text-[9px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full mb-1 shadow-sm">
                  Sun Shield 50+ SPF
                </span>
                <img
                  src={tyPainOil}
                  alt="Sun Shield Sandalwood"
                  className="w-full h-36 sm:h-52 object-contain drop-shadow-lg scale-105"
                />
                <span className="text-[10px] font-black text-amber-950 mt-1 line-clamp-1">
                  Sandalwood Sunscreen
                </span>
              </div>
            </div>

            {/* Bottle 3: Morning Nectar Moisturizer */}
            <div className="relative z-10 w-28 sm:w-36 lg:w-44 transition-transform hover:-translate-y-2 duration-300">
              <div className="bg-white/95 p-2.5 rounded-3xl border border-emerald-950/20 shadow-xl backdrop-blur-xs flex flex-col items-center">
                <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-full mb-1">
                  Moisturizer
                </span>
                <img
                  src={tyHairOilDuo}
                  alt="Morning Nectar"
                  className="w-full h-32 sm:h-44 object-contain drop-shadow-md"
                />
                <span className="text-[10px] font-extrabold text-emerald-950 mt-1 line-clamp-1">
                  Morning Nectar
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}


function FloatingChip({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`hidden xl:flex absolute items-center gap-2 px-4 py-2 rounded-full bg-ivory/80 backdrop-blur border border-gold/40 text-xs tracking-[0.25em] uppercase text-forest shadow-luxe ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gold" /> {label}
    </div>
  );
}

/* ---------------- BOTANICAL CORNER ACCENT ---------------- */
function BotanicalCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={`pointer-events-none absolute w-24 h-24 md:w-36 md:h-36 text-gold/25 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M10 150C10 90 40 40 100 15" strokeLinecap="round" />
      <path d="M20 140C35 110 55 90 80 78" strokeLinecap="round" />
      <path d="M100 15c-8 10-10 24-4 34" strokeLinecap="round" />
      <path d="M100 15c10 4 20 14 22 26" strokeLinecap="round" />
      <path d="M80 78c-10 2-20 10-24 20" strokeLinecap="round" />
      <path d="M80 78c10-2 22 2 28 12" strokeLinecap="round" />
      <circle cx="100" cy="15" r="3" fill="currentColor" stroke="none" />
      <circle cx="80" cy="78" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrustBar() {
  const { settings } = useStoreSettings();
  const threshold = settings.freeShippingThreshold ?? 2500;

  const trustItems = [
    { icon: "🚚", label: `Free shipping over ₹${threshold}` },
    { icon: "💵", label: settings.isCodEnabled ? "Cash on delivery available" : "Secure online payments" },
    { icon: "↩", label: "30-day easy returns" },
    { icon: "🧪", label: "Every batch lab tested" },
  ];

  return (
    <section className="border-b border-gold/20 bg-forest text-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {trustItems.map((t) => (
          <div key={t.label} className="flex items-center gap-3 justify-center lg:justify-start">
            <span className="text-lg">{t.icon}</span>
            <span className="text-xs tracking-wide text-ivory/85">{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- MARQUEE ---------------- */
function Marquee() {
  const items = [
    "100% Ayurvedic",
    "Chemical Free",
    "Traditional Formula",
    "Nourishes Roots",
    "Made in India",
    "Lab Tested",
    "Cold Pressed",
    "Since Tradition",
  ];
  return (
    <section className="border-y border-gold/20 bg-cream py-6 overflow-hidden">
      <div className="flex gap-16 animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span
            key={i}
            className="text-sm tracking-[0.4em] uppercase text-forest/60 flex items-center gap-16"
          >
            {t} <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- PRODUCTS ---------------- */
const PRODUCTS = [
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
      "Net Volume: 250ml"
    ],
    rating: 4.9,
    reviews: 2148,
    concern: "hairfall" as Concern,
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
      "Net Wt. 250ml"
    ],
    rating: 4.8,
    reviews: 1642,
    concern: "pain" as Concern,
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
      "HAIRS STRENGTHENING Ritual"
    ],
    rating: 4.9,
    reviews: 812,
    concern: "ritual" as Concern,
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
      "RAPID ACTION Constant Care"
    ],
    rating: 4.8,
    reviews: 954,
    concern: "ritual" as Concern,
  },
];

function Products({
  currencySymbol = "₹",
  currencyRate = 1,
}: {
  currencySymbol?: string;
  currencyRate?: number;
}) {
  const { concern, setConcern } = useContext(ConcernContext);
  const { addItem } = useContext(CartContext);
  const { products } = useProducts();
  const filtered = concern === "all" ? products : products.filter((p) => p.concern === concern);

  function getTabClass(id: Concern) {
    const isActive = concern === id;
    if (!isActive) return "border-gold/40 text-forest hover:bg-gold/10";

    if (id === "hairfall") return "bg-emerald-800 text-ivory border-emerald-800 shadow-sm";
    if (id === "pain") return "bg-red-800 text-ivory border-red-800 shadow-sm";
    if (id === "ritual") return "bg-amber-800 text-ivory border-amber-800 shadow-sm";
    return "bg-forest text-ivory border-forest shadow-sm";
  }

  return (
    <section id="products" className="relative py-20 lg:py-28 bg-ivory/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="The Collection"
          title={
            <>
              Crafted rituals,{" "}
              <em className="italic text-gradient-gold not-italic">bottled with intention</em>.
            </>
          }
          copy="Each formulation is slow-infused with rare herbs, hand-finished, and tested with care — so every drop honours the tradition it was born from."
        />
        <div id="products-list" className="scroll-mt-28" />

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              onClick={() => setConcern(c.id)}
              className={`px-5 py-2.5 rounded-full border text-xs font-bold tracking-[0.15em] uppercase transition cursor-pointer ${getTabClass(
                c.id
              )}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ModernProductCard
              key={p.id || p.name}
              product={p}
              onAddToCart={(prod, qty, e) => addItem(prod, e, false)}
              currencySymbol={currencySymbol}
              currencyRate={currencyRate}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-forest/60 py-12">
              No products match that concern yet — check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


function ProductCard({ product }: { product: ProductItem }) {
  const { addItem, wishlist, toggleWishlist } = useContext(CartContext);
  const isWishlisted = wishlist.some((item) => item.name === product.name);

  const isHair = product.name.toLowerCase().includes("hair");
  const isPain = product.name.toLowerCase().includes("dard") || product.name.toLowerCase().includes("pain");

  const cardBorderClass = isHair
    ? "border-emerald-800/10 hover:border-emerald-800/40"
    : isPain
      ? "border-red-800/10 hover:border-red-800/40"
      : "border-gold/20 hover:border-gold/50";

  const badgeClass = isHair
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : isPain
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

  const addBtnClass = isHair
    ? "border-emerald-800/20 text-emerald-950 hover:bg-emerald-800 hover:text-ivory"
    : isPain
      ? "border-red-800/20 text-red-950 hover:bg-red-800 hover:text-ivory"
      : "border-forest/20 text-forest hover:bg-forest hover:text-ivory";

  const buyBtnClass = isHair
    ? "bg-emerald-800 text-ivory hover:bg-emerald-900 border-emerald-800"
    : isPain
      ? "bg-red-800 text-ivory hover:bg-red-900 border-red-800"
      : "bg-forest text-ivory hover:bg-forest-deep border-forest";

  const dotClass = isHair
    ? "bg-emerald-600"
    : isPain
      ? "bg-red-600"
      : "bg-gold";

  return (
    <article className={`group relative rounded-[2rem] bg-card border overflow-hidden shadow-luxe hover:-translate-y-2 transition duration-500 ${cardBorderClass}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
        />
        <span className={`absolute top-5 left-5 px-3 py-1.5 rounded-full text-[10px] tracking-[0.3em] uppercase border ${badgeClass}`}>
          {product.tag}
        </span>
        <button
          aria-label="Wishlist"
          onClick={() => toggleWishlist(product)}
          className={`absolute top-5 right-5 w-10 h-10 grid place-items-center rounded-full border transition cursor-pointer ${isWishlisted
              ? "bg-[#cfa860] border-[#cfa860] text-ivory"
              : "bg-ivory/95 border-gold/30 text-forest hover:bg-gold hover:text-ivory"
            }`}
        >
          <HeartIcon fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-8">
        <h3 className="font-display text-3xl text-forest">{product.name}</h3>
        <p className="text-sm text-forest/60 mt-1">{product.subtitle}</p>

        <ul className="mt-5 space-y-2 text-xs sm:text-sm text-forest/75">
          {product.benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} /> {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-2xl text-forest font-bold">{product.price}</div>
            <div className="text-xs text-forest/50 line-through">{product.old}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => addItem(product, e, false)}
              className={`px-4 py-2.5 rounded-full border text-xs tracking-[0.15em] uppercase transition duration-300 ${addBtnClass}`}
            >
              Add
            </button>
            <button
              onClick={(e) => addItem(product, e, true)}
              className={`px-4 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase transition duration-300 ${buyBtnClass}`}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------------- CART DRAWER ---------------- */
function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, setQty, subtotal, appliedCoupon, setAppliedCoupon } = useContext(CartContext)!;
  const { createOrder, updateOrderPayment } = useOrders();
  const { coupons, incrementCouponUsedCount } = useCoupons();
  const { settings: storeSettings } = useStoreSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cashfree" | "COD">("Cashfree");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Auto switch from COD to Cashfree if COD disabled by admin
  useEffect(() => {
    if (!storeSettings.isCodEnabled && paymentMethod === "COD") {
      setPaymentMethod("Cashfree");
    }
  }, [storeSettings.isCodEnabled, paymentMethod]);

  // Promo Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");

  // Auto pre-fill user profile info when logged in
  useEffect(() => {
    if (user) {
      if (!customerName && user.displayName) setCustomerName(user.displayName);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Calculate discount and final price breakdown
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percent") {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const deliveryFeeConfig = storeSettings.deliveryFee ?? 49;
  const freeThresholdConfig = storeSettings.freeShippingThreshold ?? 2500;
  const gstRate = storeSettings.gstPercentage ?? 18;
  const isGstIncluded = storeSettings.isGstIncluded ?? true;

  const shippingFee = subtotal >= freeThresholdConfig || subtotal === 0 ? 0 : deliveryFeeConfig;
  const taxableBase = Math.max(0, subtotal - discountAmount);

  const gstAmount = isGstIncluded
    ? Math.round(taxableBase - taxableBase / (1 + gstRate / 100))
    : Math.round((taxableBase * gstRate) / 100);

  const finalTotal = isGstIncluded
    ? Math.max(0, taxableBase + shippingFee)
    : Math.max(0, taxableBase + gstAmount + shippingFee);

  const getWhatsAppOrderUrl = () => {
    const itemsText = items.map(i => `${i.name} (Qty: ${i.qty})`).join(", ");
    const text = `Hello Thakur Yograj Ayurveda, I would like to place an order:
- *Items*: ${itemsText}
- *Total*: ₹${finalTotal}
- *Name*: ${customerName}
- *Phone*: ${customerPhone}
- *Address*: ${shippingAddress}

Please confirm my order and share payment details/QR code.`;
    return `https://wa.me/918959568262?text=${encodeURIComponent(text)}`;
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive
    );

    if (matched) {
      if (matched.usedCount !== undefined && matched.usageLimit !== undefined && matched.usedCount >= matched.usageLimit) {
        toast.error(`This coupon code has reached its usage limit.`);
        return;
      }
      if (subtotal < matched.minOrderValue) {
        toast.error(`Minimum order amount for coupon ${matched.code} is ₹${matched.minOrderValue}.`);
        return;
      }
      setAppliedCoupon({
        code: matched.code,
        discountValue: matched.discountValue,
        discountType: matched.discountType,
      });
      toast.success(`Coupon "${matched.code}" applied successfully!`);
      setCouponCodeInput("");
    } else {
      toast.error("Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed.");
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.error("Please log in to your account to proceed with checkout.");
      closeCart();
      navigate({ to: "/login" });
      return;
    }
    closeCart();
    navigate({ to: "/checkout" });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!user) {
      toast.error("You must be logged in to place an order.");
      closeCart();
      navigate({ to: "/login" });
      return;
    }

    setPaymentError(null);

    const cleanPhone = customerPhone.replace(/[^\d]/g, "");
    if (cleanPhone.length < 10) {
      const msg = "Please enter a valid 10-digit mobile phone number.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      const msg = "Please enter a complete delivery address (street, city, state & 6-digit pincode).";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    const name = customerName.trim() || user.displayName || "Customer";
    const email = customerEmail.trim() || user.email || "customer@example.com";
    const phone = customerPhone.trim();
    const address = shippingAddress.trim();

    const orderPayloadItems = items.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      img: i.img,
    }));

    if (paymentMethod === "COD") {
      await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        userId: user.uid,
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount || 0,
      });

      if (appliedCoupon) {
        await incrementCouponUsedCount(appliedCoupon.code);
      }

      sendNtfyNotification({
        title: "New COD Order Placed! 📦",
        message: `Customer: ${name}\nPhone: ${phone}\nTotal Amount: ₹${finalTotal}\nItems: ${orderPayloadItems.map(i => `${i.name} (Qty: ${i.qty})`).join(", ")}`,
        priority: "high",
        tags: "package,money_with_wings",
      });

      setOrderSuccess(true);
      setTimeout(() => {
        items.forEach((i) => removeItem(i.name));
        setIsCheckingOut(false);
        setOrderSuccess(false);
        setAppliedCoupon(null);
        closeCart();
      }, 2500);
      return;
    }

    // Cashfree Payment Flow
    setIsProcessingPayment(true);
    try {
      const res = await createCashfreeOrderFn({
        data: {
          orderAmount: finalTotal,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          returnUrl: window.location.origin + "/checkout",
        },
      });

      if (!res.success || !res.paymentSessionId) {
        throw new Error(res.error || "Failed to initialize payment order with Cashfree.");
      }

      // 1. Create order in our database as Pending first
      const orderId = await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "Cashfree",
        paymentStatus: "Pending",
        cfOrderId: res.cfOrderId,
        paymentId: res.orderId,
        userId: user.uid,
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount || 0,
      });

      const cashfree = await getCashfreeInstance();
      if (!cashfree) {
        throw new Error("Unable to load Cashfree checkout SDK. Please try again.");
      }

      // Launch Cashfree Checkout Modal
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: res.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (checkoutResult?.error) {
        throw new Error(checkoutResult.error.message || "Payment cancelled or failed.");
      }

      // Verify Order Status on Server with retry mechanism (up to 3 attempts, 1.5s delay)
      let verifyRes;
      let isPaid = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[Cashfree Checkout] Verifying order status (attempt ${attempt})...`);
        verifyRes = await verifyCashfreeOrderFn({
          data: { orderId: res.orderId || res.cfOrderId || "" },
        });
        isPaid = verifyRes?.paymentStatus === "Paid" || verifyRes?.orderStatus === "PAID";
        if (isPaid) break;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (isPaid && verifyRes) {
        // 2. Update the existing order to Paid
        await updateOrderPayment(orderId, "Paid", res.orderId, verifyRes.paymentTxnId, verifyRes.paymentModeDetails);

        if (appliedCoupon) {
          await incrementCouponUsedCount(appliedCoupon.code);
        }

        sendNtfyNotification({
          title: "New Paid Order Placed! 💰",
          message: `Order ID: ${orderId}\nCustomer: ${name}\nPhone: ${phone}\nTotal Amount: ₹${finalTotal}\nPayment Method: Cashfree\nTxn ID: ${verifyRes.paymentTxnId || "N/A"}\nItems: ${orderPayloadItems.map(i => `${i.name} (Qty: ${i.qty})`).join(", ")}`,
          priority: "high",
          tags: "shopping_bags,moneybag",
        });

        toast.success("Payment completed successfully!");
        setOrderSuccess(true);
        setTimeout(() => {
          items.forEach((i) => removeItem(i.name));
          setIsCheckingOut(false);
          setIsProcessingPayment(false);
          setOrderSuccess(false);
          setAppliedCoupon(null);
          closeCart();
        }, 2500);
      } else {
        if (checkoutResult?.error) {
          throw new Error(checkoutResult.error.message || "Payment cancelled or failed.");
        }
        throw new Error("Payment was not completed. Please try again or choose Cash on Delivery (COD).");
      }
    } catch (err: any) {
      console.error("Cashfree checkout error:", err);
      const errMsg = err?.message || "Payment could not be completed. Please try again.";
      setPaymentError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-forest-deep/50 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-ivory border-l border-gold/30 shadow-luxe flex flex-col transition-transform duration-500 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        aria-label="Shopping cart"
        data-lenis-prevent
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold/20 bg-ivory">
          <div className="flex items-center gap-2">
            {isCheckingOut && (
              <button
                onClick={() => setIsCheckingOut(false)}
                className="w-8 h-8 rounded-full border border-gold/30 grid place-items-center text-forest hover:bg-gold/10 text-xs transition cursor-pointer"
                title="Back to Bag"
              >
                ←
              </button>
            )}
            <div className="font-display text-2xl text-forest">
              {isCheckingOut ? "Checkout Details" : "Your Bag"}
            </div>
          </div>
          <button
            aria-label="Close cart"
            onClick={closeCart}
            className="w-9 h-9 grid place-items-center rounded-full border border-gold/30 text-forest hover:bg-gold/10 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" data-lenis-prevent>
          {orderSuccess ? (
            <div className="p-6 bg-emerald-950/10 border border-emerald-800/30 rounded-3xl text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <h3 className="font-display text-xl text-forest font-bold">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-forest/70">
                Thank you for choosing Thakur Yograj. Your order details and payment receipt have been saved under your account ({user?.email}).
              </p>
            </div>
          ) : !isCheckingOut ? (
            /* STEP 1: YOUR BAG & PRICE BREAKDOWN */
            <>
              {items.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-4xl opacity-40">🛍️</div>
                  <p className="text-forest/60 text-sm">
                    Your bag is empty. Explore our remedy collection to begin your ritual.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((i) => (
                    <div key={i.name} className="flex gap-4 p-3 bg-forest/5 rounded-2xl border border-gold/15">
                      <img
                        src={i.img}
                        alt={i.name}
                        className="w-20 h-20 rounded-xl object-cover border border-gold/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-base text-forest truncate font-bold">{i.name}</div>
                        <div className="text-xs text-gold font-semibold mt-0.5">{i.price}</div>
                        <div className="mt-2.5 flex items-center gap-3">
                          <QuantityInput
                            value={i.qty}
                            onChange={(qty) => setQty(i.name, qty)}
                          />
                          <button
                            onClick={() => removeItem(i.name)}
                            className="ml-auto text-[10px] uppercase font-bold text-forest/50 hover:text-red-700 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Promo Coupon Code Section */}
                  <div className="pt-2">
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Promo Code"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-gold/30 bg-ivory text-forest text-xs focus:outline-none focus:border-gold uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-forest text-ivory rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-forest-deep transition cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </form>

                    {appliedCoupon && (
                      <div className="mt-2.5 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold">
                        <span>🏷️ Coupon <strong>{appliedCoupon.code}</strong> Applied!</span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-[10px] text-red-600 hover:underline uppercase font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comprehensive Price Breakdown Box */}
                  <div className="p-4 rounded-2xl bg-cream/50 border border-gold/20 space-y-2 text-xs">
                    <div className="font-display text-sm font-bold text-forest border-b border-gold/15 pb-2">
                      Bill Details & Price Breakdown
                    </div>
                    <div className="flex justify-between text-forest/75 pt-1">
                      <span>Item Total (Subtotal)</span>
                      <span className="font-semibold text-forest">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Coupon Discount ({appliedCoupon.code})</span>
                        <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-forest/75">
                      <span>
                        Delivery Fee{" "}
                        {freeThresholdConfig > 0 && subtotal < freeThresholdConfig && subtotal > 0 && (
                          <span className="text-[10px] text-forest/50 font-normal">
                            (Free over ₹{freeThresholdConfig})
                          </span>
                        )}
                      </span>
                      <span className={shippingFee === 0 ? "text-emerald-700 font-semibold uppercase" : "font-semibold"}>
                        {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-forest/75 text-[11px]">
                      <span>GST Tax ({gstRate}%)</span>
                      <span className={isGstIncluded ? "text-emerald-700 font-bold uppercase text-[10px]" : "font-bold text-forest"}>
                        {isGstIncluded ? "Included in Price" : `+ ₹${gstAmount.toLocaleString("en-IN")}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-forest font-bold border-t border-gold/20 pt-2.5 text-sm">
                      <span>Grand Total</span>
                      <span className="font-bold text-forest text-base">
                        ₹{finalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* STEP 2: CHECKOUT (SHIPPING & PAYMENT) */
            <>
              {user && (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5 text-xs">
                  <div className="p-3.5 bg-forest/5 border border-gold/20 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gold uppercase font-bold tracking-wider block">Logged In Account</span>
                      <span className="font-bold text-forest">{user.displayName || "Customer"}</span>
                      <span className="text-forest/60 block text-[11px]">{user.email}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Verified</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display text-base text-forest font-bold">1. Delivery Address</h4>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gold/30 bg-ivory text-forest text-xs focus:outline-none focus:border-gold"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gold/30 bg-ivory text-forest text-xs focus:outline-none focus:border-gold"
                    />
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      title="Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
                      placeholder="10-Digit Mobile Number (e.g. 9876543210)"
                      value={customerPhone}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/[^\d]/g, "");
                        if (digits.startsWith("91") && digits.length > 10) {
                          digits = digits.substring(2);
                        }
                        if (digits.startsWith("0")) {
                          digits = digits.substring(1);
                        }
                        setCustomerPhone(digits.slice(0, 10));
                      }}
                      className="w-full p-3 rounded-xl border border-gold/30 bg-ivory text-forest text-xs focus:outline-none focus:border-gold font-mono"
                    />
                    <textarea
                      required
                      rows={2}
                      minLength={10}
                      placeholder="Full Delivery Address (House No, Street, City, State & 6-digit Pincode)"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gold/30 bg-ivory text-forest text-xs focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-display text-base text-forest font-bold">2. Payment Method</h4>
                    <div className="space-y-2.5">
                      <label className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${paymentMethod === "Cashfree" ? "border-gold bg-gold/10" : "border-gold/20 hover:border-gold/50"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Cashfree"
                          checked={paymentMethod === "Cashfree"}
                          onChange={() => setPaymentMethod("Cashfree")}
                          className="accent-gold"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-forest text-xs flex items-center justify-between">
                            <span>Online Payment (Cashfree)</span>
                            <span className="text-[9px] bg-gold/20 text-gold-dark uppercase font-bold px-2 py-0.5 rounded-full">Instant</span>
                          </div>
                          <p className="text-[10px] text-forest/70 mt-0.5">
                            UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking & Wallets
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition ${
                          !storeSettings.isCodEnabled
                            ? "opacity-50 border-gold/10 bg-forest/5 cursor-not-allowed"
                            : paymentMethod === "COD"
                            ? "border-gold bg-gold/10 cursor-pointer"
                            : "border-gold/20 hover:border-gold/50 cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          disabled={!storeSettings.isCodEnabled}
                          checked={paymentMethod === "COD" && storeSettings.isCodEnabled}
                          onChange={() => storeSettings.isCodEnabled && setPaymentMethod("COD")}
                          className="accent-gold"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-forest text-xs flex items-center justify-between">
                            <span>Cash on Delivery (COD)</span>
                            {!storeSettings.isCodEnabled && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-700 font-bold px-2 py-0.5 rounded-full uppercase">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-forest/70 mt-0.5">
                            {storeSettings.isCodEnabled
                              ? "Pay in cash when your package arrives at your doorstep"
                              : "Currently disabled. Please choose Online Payment (Cashfree)."}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="p-3 bg-cream/40 border border-gold/15 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-forest/70">Final Payable Amount:</span>
                    <span className="font-bold text-forest text-base">₹{finalTotal.toLocaleString("en-IN")}</span>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 text-[11px] flex flex-col gap-2">
                      <span className="font-semibold">{paymentError}</span>
                      <div className="border-t border-red-500/20 pt-1.5 flex items-center justify-between gap-1.5">
                        <span>Need help? Place order directly:</span>
                        <a
                          href={getWhatsAppOrderUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          💬 WhatsApp Order
                        </a>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>

        {/* Drawer Bottom Action Bar */}
        {items.length > 0 && !orderSuccess && (
          <div className="px-6 py-5 border-t border-gold/20 bg-ivory">
            {!isCheckingOut ? (
              /* STEP 1 FOOTER */
              <div className="space-y-3">
                {!user ? (
                  <button
                    onClick={() => {
                      closeCart();
                      navigate({ to: "/login" });
                    }}
                    className="w-full py-4 rounded-full bg-forest text-ivory text-sm tracking-[0.15em] uppercase hover:bg-forest-deep transition font-bold flex items-center justify-center gap-2 cursor-pointer shadow-luxe"
                  >
                    <span>🔐 Log In to Checkout</span>
                  </button>
                ) : (
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 rounded-full bg-forest text-ivory text-sm tracking-[0.15em] uppercase hover:bg-forest-deep transition font-bold cursor-pointer shadow-luxe flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Delivery & Checkout</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            ) : (
              /* STEP 2 FOOTER */
              <div className="space-y-3">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-full bg-forest text-ivory text-sm tracking-[0.15em] uppercase hover:bg-forest-deep transition font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-luxe"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                      Initializing Payment...
                    </>
                  ) : paymentMethod === "Cashfree" ? (
                    "Pay Now with Cashfree"
                  ) : (
                    "Place Order (COD)"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------------- SEARCH OVERLAY ---------------- */
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { setConcern } = useContext(ConcernContext);
  const { products } = useProducts();

  const results = query.trim()
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(query.toLowerCase()),
    )
    : products;

  function goToProduct(p: ProductItem) {
    setConcern(p.concern);
    onClose();
    setQuery("");
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-forest-deep/60 backdrop-blur-sm flex items-start justify-center pt-28 px-6"
      onClick={onClose}
      data-lenis-prevent
    >
      <div
        className="w-full max-w-xl bg-ivory rounded-[2rem] border border-gold/30 shadow-luxe p-6"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        <div className="flex items-center gap-3 border-b border-gold/20 pb-4">
          <SearchIcon />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hair oil, pain relief..."
            className="flex-1 bg-transparent outline-none text-forest placeholder:text-forest/40"
          />
          <button
            aria-label="Close search"
            onClick={onClose}
            className="text-forest/50 hover:text-gold transition"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-gold/10" data-lenis-prevent>
          {results.map((p) => (
            <button
              key={p.name}
              onClick={() => goToProduct(p)}
              className="w-full flex items-center gap-4 py-3 text-left hover:bg-gold/5 rounded-xl px-2 transition"
            >
              <img
                src={p.img}
                alt={p.name}
                className="w-12 h-12 rounded-lg object-cover border border-gold/20"
              />
              <div className="flex-1">
                <div className="font-display text-base text-forest">{p.name}</div>
                <div className="text-xs text-forest/55">{p.subtitle}</div>
              </div>
              <div className="text-sm text-forest">{p.price}</div>
            </button>
          ))}
          {results.length === 0 && (
            <p className="py-6 text-center text-sm text-forest/50">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- SPOTLIGHT ---------------- */
const SPOTLIGHT_BULLETS = [
  { title: "Arrests Hair Fall", desc: "93% of users noted significant hair fall reduction within 21 days." },
  { title: "Awakens Dormant Roots", desc: "Bhringraj stimulates hair follicles to promote thick new regrowth." },
  { title: "Calms Scalp Flakes", desc: "Natural Neem & Fenugreek balance moisture and keep dandruff away." },
  { title: "Lab-Tested Batch Purity", desc: "Tested for zero heavy metals, parabens, and pesticide residues." },
];

const PAIN_SPOTLIGHT_BULLETS = [
  { title: "Relieves Stiffness", desc: "Active Gandhapura penetrates transdermally to soothe rigid joints." },
  { title: "Reduces Swelling", desc: "Lavanga (Clove) has intense anti-inflammatory properties to reduce joint puffiness." },
  { title: "Warming Relief", desc: "Cinnamon & Camphor stimulate blood flow and generate targeted comforting warmth." },
  { title: "Lab-Tested Batch Purity", desc: "Tested for zero mineral oils, synthetic dyes, or petroleum-based fillers." },
];

function Spotlight() {
  const { addItem } = useContext(CartContext);
  const [activeTab, setActiveTab] = useState<"hair" | "pain">("hair");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "hair" ? "pain" : "hair"));
    }, 6000); // 6s cycle
    return () => clearInterval(timer);
  }, []);

  const isHair = activeTab === "hair";
  const containerClass = isHair
    ? "bg-gradient-forest border-emerald-800/20"
    : "bg-gradient-to-br from-red-950 via-stone-900 to-red-950 border-red-800/20";

  return (
    <section className="py-24 bg-cream/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className={`relative rounded-[3rem] border p-8 md:p-16 shadow-luxe transition-all duration-750 ${containerClass}`}>
          {/* Subtle glowing backgrounds */}
          <div className={`absolute top-1/4 right-1/4 -inset-20 rounded-full blur-3xl pointer-events-none transition-all duration-750 ${isHair ? 'bg-emerald-600/10' : 'bg-red-600/10'}`} />

          {/* Tab Swappers inside Spotlight */}
          <div className="relative z-20 flex gap-3 mb-8 justify-center lg:justify-start">
            <button
              onClick={() => setActiveTab("hair")}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest border transition-all duration-300 ${isHair
                ? "bg-emerald-800 border-emerald-800 text-ivory shadow-sm"
                : "border-gold/30 text-ivory/60 hover:bg-gold/10"
                }`}
            >
              Hair Care Bestseller
            </button>
            <button
              onClick={() => setActiveTab("pain")}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest border transition-all duration-300 ${!isHair
                ? "bg-red-800 border-red-800 text-ivory shadow-sm"
                : "border-gold/30 text-ivory/60 hover:bg-gold/10"
                }`}
            >
              Pain Relief Bestseller
            </button>
          </div>

          <div className="relative grid grid-cols-1 grid-rows-1 z-10 min-h-[750px] sm:min-h-[580px] lg:min-h-[480px]">
            {["hair", "pain"].map((tabName) => {
              const isTabActive = activeTab === tabName;
              const isTabHair = tabName === "hair";
              const tabProduct = isTabHair ? PRODUCTS[0] : PRODUCTS[1];
              const tabBullets = isTabHair ? SPOTLIGHT_BULLETS : PAIN_SPOTLIGHT_BULLETS;
              const tabImg = isTabHair ? tyHairOilLifestyle : tyPainOilLifestyle;

              return (
                <div
                  key={tabName}
                  className={`col-start-1 row-start-1 w-full grid lg:grid-cols-12 gap-12 items-center transition-all duration-1000 ease-in-out ${isTabActive
                      ? "opacity-100 translate-y-0 scale-100 z-10 pointer-events-auto"
                      : "opacity-0 translate-y-8 scale-95 z-0 pointer-events-none"
                    }`}
                >
                  {/* Left Info Column */}
                  <div className="lg:col-span-7 text-ivory">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <span className="h-px w-8 bg-gold-soft" />
                      <span className="text-xs tracking-[0.3em] uppercase text-gold-soft font-semibold">
                        In the Spotlight
                      </span>
                    </div>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-ivory">
                      Thakur Yograj <br />
                      <em className="italic text-gradient-gold not-italic">{isTabHair ? "Herbal Hair Oil" : "Dard Nivarak Tel"}</em>
                    </h2>
                    <p className="mt-6 text-ivory/80 max-w-xl text-xs md:text-sm lg:text-base leading-relaxed">
                      {isTabHair
                        ? "Our signature blend, slow-cooked in copper vessels for 21 days under the gentle warmth of the Chhattisgarh sun. Infused with fresh Ayurvedic decoctions to stimulate natural hair health."
                        : "A premium therapeutic preparation cooked with active joint-restoring botanicals to penetrate deep, stimulate blood circulation, and relieve muscle rigidity."}
                    </p>

                    {/* Benefits Bullet Grid */}
                    <div className="mt-10 grid sm:grid-cols-2 gap-6">
                      {tabBullets.map((b) => (
                        <div key={b.title} className="flex gap-3">
                          <span className={`w-5 h-5 rounded-full text-gold flex items-center justify-center shrink-0 text-[10px] mt-0.5 ${isTabHair ? 'bg-emerald-900/40' : 'bg-red-950/40'}`}>
                            ✓
                          </span>
                          <div>
                            <div className="font-display text-base md:text-lg text-ivory font-semibold">{b.title}</div>
                            <p className="text-[11px] text-ivory/70 mt-1 leading-relaxed">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 flex flex-wrap items-center gap-6">
                      <div>
                        <div className="font-display text-3xl text-gold-soft">{tabProduct.price}</div>
                        <div className="text-xs text-ivory/40 line-through">{tabProduct.old}</div>
                      </div>
                      <button
                        onClick={(e) => addItem(tabProduct, e, true)}
                        className="px-8 py-4 rounded-full bg-gold text-forest text-xs tracking-[0.2em] uppercase font-bold hover:bg-gold-soft transition shadow-luxe"
                      >
                        Shop This Remedy
                      </button>
                    </div>
                  </div>

                  {/* Right Image/Mockup Column */}
                  <div className="lg:col-span-5 flex justify-center relative">
                    <div className="relative w-full max-w-sm">
                      {/* Glowing back-circle */}
                      <div className="absolute inset-0 rounded-full bg-gold/10 blur-2xl scale-125" />

                      {/* Arched image border */}
                      <div
                        className="relative aspect-[4/5] border border-gold/35 overflow-hidden shadow-2xl bg-cream/10 backdrop-blur-md"
                        style={{ borderRadius: "180px 180px 32px 32px" }}
                      >
                        <img
                          src={tabImg}
                          alt={tabProduct.name}
                          className="w-full h-full object-cover transition-all duration-700"
                        />
                      </div>

                      {/* Floating badge */}
                      <div className="absolute -bottom-6 -left-6 bg-ivory/95 backdrop-blur-md px-5 py-4 rounded-2xl border border-gold/30 shadow-luxe animate-float-slow">
                        <div className="text-[10px] tracking-[0.3em] uppercase text-forest/70 font-semibold">Formulation</div>
                        <div className="font-display text-xl text-forest mt-0.5">Taila Pak Vidhi</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- INGREDIENTS ---------------- */
const HERBS = [
  {
    name: "Bhringraj",
    icon: "👑",
    ayurvedicName: "Keshraj",
    note: "Known as the King of Hair, Bhringraj stimulates follicle blood circulation, revitalizes dormant roots, and naturally curbs hair fall.",
  },
  {
    name: "Amla",
    icon: "🫐",
    ayurvedicName: "Amalaki",
    note: "A powerhouse of Vitamin C and antioxidants that boosts collagen production, strengthens hair shafts, and delays premature greying.",
  },
  {
    name: "Hibiscus",
    icon: "🌺",
    ayurvedicName: "Japa Pushpa",
    note: "Rich in amino acids and mucilage, it acts as a natural conditioner, leaving hair silky, voluminous, and highly elastic.",
  },
  {
    name: "Brahmi",
    icon: "🧠",
    ayurvedicName: "Mandukaparni",
    note: "Calms the nervous system through massage, relaxes scalp muscles, and forms a protective layer around hair fibers to prevent thinning.",
  },
  {
    name: "Gandhapura",
    icon: "🍃",
    ayurvedicName: "Wintergreen",
    note: "Rich in natural methyl salicylate, Gandhapura oil warms target joints, eases rigidity, and facilitates rapid pain relief.",
  },
  {
    name: "Clove",
    icon: "🪵",
    ayurvedicName: "Lavanga",
    note: "A warming spice with intense anti-inflammatory properties that numbs rigid muscles, reduces swelling, and enhances skin penetration.",
  },
  {
    name: "Cinnamon",
    icon: "🍂",
    ayurvedicName: "Twak",
    note: "Boosts blood micro-circulation in joint tissues, helping transport vital anti-inflammatory herbal nutrients right to the source of pain.",
  },
  {
    name: "Camphor",
    icon: "❄️",
    ayurvedicName: "Karpoora",
    note: "Triggers cooling sensations on the skin followed by gentle warming, desensitizing nerve endings and easing rigid muscle stiffness.",
  },
];

function Ingredients() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % HERBS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  function prev() {
    setActive((a) => (a - 1 + HERBS.length) % HERBS.length);
  }
  function next() {
    setActive((a) => (a + 1) % HERBS.length);
  }

  return (
    <section id="ingredients" className="relative py-24 bg-cream overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-15"
        style={{
          backgroundImage: `url(${ingredientsImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dynamic green/red corners */}
      <BotanicalCorner className="top-10 -left-8 opacity-40 text-emerald-800 hidden md:block" />
      <BotanicalCorner className="bottom-10 -right-8 -scale-x-100 opacity-40 text-red-800 hidden md:block" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="The Ingredient Story"
          title={
            <>
              Slow-infused with <em className="italic text-gradient-gold not-italic">27 Rare Herbs</em>
            </>
          }
          copy="Every bottle is packed with whole leaves, roots, and botanical extracts. Learn how these key active herbs work to repair and protect."
        />

        {/* Grid layout of herbs - comfortable and fits without scrolling */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 justify-items-center">
            {HERBS.map((h, i) => {
              const isSelected = active === i;
              const isHairHerb = i < 4;

              const buttonThemeClass = isSelected
                ? isHairHerb
                  ? "border-emerald-600 bg-emerald-800 text-ivory scale-110 shadow-luxe"
                  : "border-red-600 bg-red-800 text-ivory scale-110 shadow-luxe"
                : isHairHerb
                  ? "border-emerald-800/10 bg-emerald-50/10 text-emerald-800/40 hover:border-emerald-800/40 hover:scale-105"
                  : "border-red-800/10 bg-red-50/10 text-red-800/40 hover:border-red-800/40 hover:scale-105";

              const textThemeClass = isSelected
                ? isHairHerb
                  ? "text-emerald-800 font-bold"
                  : "text-red-800 font-bold"
                : "text-forest/50";

              return (
                <button
                  key={h.name}
                  onClick={() => setActive(i)}
                  className="flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full grid place-items-center text-2xl md:text-3xl border-2 transition-all duration-500 relative ${buttonThemeClass}`}
                  >
                    {/* Subtle glowing halo for active item */}
                    {isSelected && (
                      <span className={`absolute -inset-2 rounded-full border animate-ping opacity-45 pointer-events-none ${isHairHerb ? 'border-emerald-400/40' : 'border-red-400/40'}`} />
                    )}
                    <span>{h.icon}</span>
                  </div>
                  <div className="text-center">
                    <span
                      className={`block text-[8px] md:text-[10px] tracking-wider uppercase font-semibold transition-colors duration-300 ${textThemeClass}`}
                    >
                      {h.name}
                    </span>
                    <span className="block text-[7px] italic text-forest/40">
                      {h.ayurvedicName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic description card with smooth transitions */}
        <div className="mt-12 flex items-center justify-center gap-4 md:gap-8">
          <button
            onClick={prev}
            aria-label="Previous herb"
            className="w-12 h-12 grid place-items-center rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-all shrink-0"
          >
            ←
          </button>

          <div className="w-full max-w-xl grid grid-cols-1 grid-rows-1 min-h-[260px] sm:min-h-[220px] md:min-h-[190px]">
            {HERBS.map((h, i) => {
              const isActive = active === i;
              const isHairHerb = i < 4;

              const cardThemeClass = isHairHerb
                ? "border-emerald-800/15"
                : "border-red-800/15";

              const badgeThemeClass = isHairHerb
                ? "text-emerald-800 bg-emerald-50"
                : "text-red-800 bg-red-50";

              const dividerThemeClass = isHairHerb
                ? "bg-emerald-800/20"
                : "bg-red-800/20";

              return (
                <div
                  key={h.name}
                  className={`col-start-1 row-start-1 w-full rounded-[2.5rem] border bg-card shadow-luxe p-6 md:p-12 text-center relative overflow-hidden transition-all duration-700 ease-in-out ${cardThemeClass} ${isActive
                    ? "opacity-100 translate-y-0 scale-100 z-10 pointer-events-auto"
                    : "opacity-0 translate-y-4 scale-95 z-0 pointer-events-none"
                    }`}
                >
                  {/* Watermark leaf */}
                  <div className="absolute -bottom-10 -right-10 text-gold/10 text-9xl pointer-events-none select-none">
                    🍃
                  </div>

                  <div className={`inline-block px-3 py-1 rounded-full text-[10px] tracking-[0.25em] uppercase font-bold ${badgeThemeClass}`}>{h.ayurvedicName}</div>
                  <div className="mt-3 font-display text-3xl md:text-4xl text-forest">{h.name}</div>

                  <div className={`w-16 h-px mx-auto my-4 md:my-6 ${dividerThemeClass}`} />

                  <p className="text-forest/85 text-xs md:text-sm lg:text-base leading-relaxed md:px-4">
                    {h.note}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={next}
            aria-label="Next herb"
            className="w-12 h-12 grid place-items-center rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-all shrink-0"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- BENEFITS ---------------- */
const BENEFITS = [
  { icon: "🌿", title: "Hair Growth", copy: "Awakens dormant follicles for visible hair density." },
  { icon: "🛡", title: "Stops Hair Fall", copy: "Strengthens each strand from root to tip." },
  { icon: "💫", title: "Healthy Roots", copy: "Deep-nourishes your scalp and restores shine." },
  { icon: "✨", title: "Reduces Dandruff", copy: "Balances the scalp's natural microbiome." },
  { icon: "🔥", title: "Joint Comfort", copy: "Soothes joint rigidity and increases flexibility." },
  { icon: "⚡", title: "Muscle Recovery", copy: "Relieves deep stiffness and fatigue after strain." },
  { icon: "🍃", title: "Active Penetration", copy: "Fast transdermal action with zero mineral oils." },
  { icon: "🕉", title: "Chhattisgarh Brew", copy: "Traditional slow copper vessel brewing method." },
];

function Benefits() {
  return (
    <section className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Benefits"
          title={
            <>
              A wellness ritual,{" "}
              <em className="italic text-gradient-gold not-italic">reimagined</em>.
            </>
          }
          copy="Eight promises woven into every drop — refined over years of practice, tested with modern science."
        />
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-3xl border border-gold/20 bg-card p-8 hover:-translate-y-1 transition shadow-luxe"
            >
              <div className="w-14 h-14 grid place-items-center rounded-2xl bg-cream text-2xl group-hover:bg-forest group-hover:scale-110 transition">
                <span>{b.icon}</span>
              </div>
              <div className="mt-6 font-display text-xl text-forest">{b.title}</div>
              <p className="mt-2 text-sm text-forest/65 leading-relaxed">{b.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROCESS ---------------- */
const STEPS = [
  {
    n: "01",
    t: "Collecting Herbs",
    d: "Hand-picked at the peak of their potency, from partnered growers.",
  },
  { n: "02", t: "Cleaning & Sorting", d: "Every leaf inspected, washed in cold spring water." },
  { n: "03", t: "Natural Extraction", d: "Traditional decoction preserves each active compound." },
  { n: "04", t: "Slow Infusion", d: "Weeks of patient steeping in cold-pressed base oils." },
  { n: "05", t: "Filtration", d: "Multi-stage filtration for a clear, luminous finish." },
  { n: "06", t: "Lab Testing", d: "Every batch tested for purity, potency and safety." },
  { n: "07", t: "Packaging", d: "Bottled by hand in our Chhattisgarh atelier." },
];

function Process() {
  return (
    <section
      id="process"
      className="relative py-28 lg:py-40 bg-gradient-forest text-ivory overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url(${processImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/60 via-forest/60 to-forest-deep/90" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs tracking-[0.35em] uppercase text-gold-soft">Our Craft</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-ivory">
            Seven steps, <em className="italic text-gradient-gold not-italic">one ritual</em>.
          </h2>
          <p className="mt-6 text-ivory/70 max-w-lg">
            From soil to skin — every step is slow, intentional, and honest.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-3xl border border-gold/25 bg-forest-deep/40 backdrop-blur p-8"
            >
              <div className="font-display text-gold text-4xl">{s.n}</div>
              <div className="mt-4 gold-divider" />
              <div className="mt-6 font-display text-2xl">{s.t}</div>
              <p className="mt-2 text-sm text-ivory/65">{s.d}</p>
            </div>
          ))}
          <div className="rounded-3xl overflow-hidden relative min-h-[220px] hidden lg:block border border-gold/25">
            <img src={tyPainOilLifestyle} alt="Thakur Yograj Ayurvedic Pain Relief Oil" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- EXPERT GUIDANCE ---------------- */
const EXPERTS = [
  {
    name: "Dr. Ananya Deshmukh",
    cred: "BAMS · Ayurvedic Physician",
    quote: "Traditional slow-brewed decoctions extract vital active botanicals that are typically lost in modern chemical processes.",
    initials: "AD",
    img: processImg,
  },
  {
    name: "Dr. Rohan Kapoor",
    cred: "MD · Pain Management Specialist",
    quote: "Deep transdermal absorption of warming oils like wintergreen and clove desensitizes nerve endings for rapid joint and muscle relief.",
    initials: "RK",
    img: hairModelImg,
  },
  {
    name: "Meera Iyer",
    cred: "Certified Trichologist",
    quote: "Ayurvedic hair oiling is not just about hydration; it is an active capillary stimulation technique that stops fall.",
    initials: "MI",
    img: ingredientsImg,
  },
];

function ExpertVoices() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Backed by Science"
          title={
            <>
              Ayurveda, <em className="italic text-gradient-gold not-italic">Clinical Validation</em>
            </>
          }
          copy="Certified dermatologists and traditional Vaidyas outline why cold-pressed, slow-cooked herb extracts outperform synthetic chemical treatments."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {EXPERTS.map((e) => (
            <div
              key={e.name}
              className="group flex flex-col rounded-[2.5rem] bg-card border border-gold/15 overflow-hidden shadow-luxe hover:-translate-y-1 transition duration-500"
            >
              {/* Expert Video Thumbnail */}
              <div className="relative aspect-[16/10] overflow-hidden bg-forest/10">
                <img
                  src={e.img}
                  alt={e.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/60 via-forest-deep/10 to-transparent" />

                {/* Floating Initials Badge */}
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-forest text-ivory flex items-center justify-center font-display text-lg font-bold">
                  {e.initials}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-ivory/90 backdrop-blur-sm text-forest flex items-center justify-center shadow-luxe group-hover:scale-110 transition duration-300">
                    <PlayIcon />
                  </span>
                </div>
              </div>

              {/* Expert Info & Quote */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <p className="text-forest/85 leading-relaxed italic text-sm">
                  "{e.quote}"
                </p>
                <div className="mt-6 pt-6 border-t border-gold/15">
                  <div className="font-display text-xl text-forest">{e.name}</div>
                  <div className="text-[10px] tracking-wider uppercase text-forest/50 font-bold mt-1">
                    {e.cred}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BEFORE / AFTER ---------------- */
function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <section className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <SectionHeader
            align="left"
            eyebrow="Real Results"
            title={
              <>
                90 days. <em className="italic text-gradient-gold not-italic">Visible</em>{" "}
                difference.
              </>
            }
            copy="Slide to see the transformation. Documented on real customers over a 90-day daily ritual — no filters, no retouch."
          />
          <div className="mt-8 flex flex-wrap gap-6 sm:gap-8">
            <Stat n="93%" l="Reduced hair fall" />
            <Stat n="88%" l="Eased joint stiffness" />
            <Stat n="Pure" l="Zero Mineral Oils" />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-[4/5] md:aspect-[16/10] rounded-[2rem] overflow-hidden shadow-luxe border border-gold/30 select-none">
            <img
              src={hairAfterComp}
              alt="After 90 days"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img
                src={hairBeforeComp}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
              />
              <div className="absolute inset-y-0 right-0 w-px bg-gold" />
            </div>
            <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-ivory/90 text-forest text-[10px] tracking-[0.3em] uppercase">
              Before
            </div>
            <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-forest text-ivory text-[10px] tracking-[0.3em] uppercase">
              After 90 days
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 accent-[oklch(0.75_0.12_85)]"
              aria-label="Compare before and after"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-forest">{n}</div>
      <div className="text-xs tracking-widest uppercase text-forest/55 mt-1">{l}</div>
    </div>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
const REVIEWS = [
  {
    name: "Biswajit Nayak",
    city: "Bhubaneswar",
    q: "My hair fall stopped completely within three weeks of daily gym stress. It absorbs instantly with zero sticky residue, perfect for styling.",
    stars: 5,
  },
  {
    name: "Nitin Singh",
    city: "New Delhi",
    q: "After heavy squats and lifting at the gym, this Dard Nivarak Tel completely relieves my shoulder stiffness and muscle soreness overnight.",
    stars: 5,
  },
  {
    name: "Karan Verma",
    city: "Mumbai",
    q: "The hair oil restored my hairline density and scalp health. It feels like a premium traditional recipe served in a luxury apothecary bottle.",
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section className="relative py-28 lg:py-40 bg-cream overflow-hidden">
      <BotanicalCorner className="top-10 -right-8 -scale-x-100 opacity-60 hidden md:block" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Loved by thousands"
          title={
            <>
              Whispers from our <em className="italic text-gradient-gold not-italic">community</em>.
            </>
          }
          copy=""
        />
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <blockquote
              key={r.name}
              className="relative rounded-3xl bg-card border border-gold/20 p-10 shadow-luxe"
            >
              <div className="absolute -top-4 left-8 font-display text-6xl text-gradient-gold leading-none">
                "
              </div>
              <div className="flex gap-1 mb-4 text-gold">{"★".repeat(r.stars)}</div>
              <p className="text-forest/80 leading-relaxed">{r.q}</p>
              <footer className="mt-8 flex items-center gap-3">
                <div className="relative w-11 h-11 shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold via-gold-soft to-forest opacity-80" />
                  <div className="absolute inset-[2px] rounded-full bg-forest text-ivory grid place-items-center font-display text-lg">
                    {r.name[0]}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-forest">{r.name}</div>
                  <div className="text-xs text-forest/50 tracking-widest uppercase">
                    {r.city} · Verified
                  </div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- STORY ---------------- */
function Story() {
  return (
    <section id="story" className="relative py-28 lg:py-40 overflow-hidden">
      <BotanicalCorner className="bottom-6 -left-8 opacity-60 hidden md:block" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 order-2 lg:order-1">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs tracking-[0.35em] uppercase text-forest/70">Our Heritage</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-forest">
            A family recipe,{" "}
            <em className="italic text-gradient-gold not-italic">refined for the modern world</em>.
          </h2>
          <div className="mt-8 space-y-5 text-forest/75 leading-relaxed">
            <p>
              Thakur Yograj began in a small village in Chhattisgarh, in the shade of a neem tree
              older than memory. What started as an heirloom recipe — passed hand to hand across
              four generations — is today a modern atelier where tradition meets clinical rigour.
            </p>
            <p>We haven't changed the recipe. We've only refined the ritual around it.</p>
          </div>
          <div className="mt-10 flex items-center gap-8">
            <div>
              <div className="font-display text-5xl text-gradient-gold">4</div>
              <div className="text-xs tracking-widest uppercase text-forest/55">Generations</div>
            </div>
            <div className="w-px h-14 bg-gold/40" />
            <div>
              <div className="font-display text-5xl text-gradient-gold">27</div>
              <div className="text-xs tracking-widest uppercase text-forest/55">Rare Herbs</div>
            </div>
            <div className="w-px h-14 bg-gold/40" />
            <div>
              <div className="font-display text-5xl text-gradient-gold">100%</div>
              <div className="text-xs tracking-widest uppercase text-forest/55">Ayurvedic</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 order-1 lg:order-2 relative">
          <div className="grid grid-cols-2 gap-4">
            <img
              src={lifestylePainRelief}
              alt="Ritual"
              loading="lazy"
              className="rounded-[2rem] aspect-[3/4] object-cover border border-gold/30 shadow-luxe"
            />
            <img
              src={tyHairOil}
              alt="Bottle"
              loading="lazy"
              className="rounded-[2rem] aspect-[3/4] object-cover border border-gold/30 shadow-luxe translate-y-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- WHY CHOOSE ---------------- */
function WhyChoose() {
  const rows = [
    ["100% Ayurvedic", true, false],
    ["No Mineral Oil", true, false],
    ["Chemical Free", true, false],
    ["Traditional Slow Process", true, false],
    ["Premium Rare Herbs", true, false],
    ["Lab Tested Every Batch", true, false],
    ["Made in India", true, true],
  ];
  return (
    <section className="py-28 lg:py-40 bg-cream">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Why Thakur Yograj"
          title={
            <>
              Held to a <em className="italic text-gradient-gold not-italic">higher</em> standard.
            </>
          }
          copy=""
        />
        <div className="mt-16 rounded-[2rem] bg-card border border-gold/30 shadow-luxe overflow-hidden">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] text-xs sm:text-sm">
            <div className="p-4 sm:p-6 font-display text-base sm:text-lg text-forest">Standard</div>
            <div className="p-4 sm:p-6 font-display text-base sm:text-lg text-forest text-center bg-forest text-ivory">
              Thakur Yograj
            </div>
            <div className="p-4 sm:p-6 font-display text-base sm:text-lg text-forest/60 text-center">Ordinary Oils</div>
            {rows.map(([label, us, them], i) => (
              <div key={i} className="contents">
                <div className="p-4 sm:p-6 border-t border-gold/20 text-forest font-medium">{label as string}</div>
                <div className="p-4 sm:p-6 border-t border-gold/20 text-center bg-forest/95 text-ivory font-bold">
                  {us ? "✓" : "—"}
                </div>
                <div className="p-4 sm:p-6 border-t border-gold/20 text-center text-forest/50">
                  {them ? "✓" : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FEATURED COLLECTION ---------------- */
function FeaturedCollection() {
  const cards = [
    { t: "Herbal Hair Oil", d: "Nature's goodness for your hair.", img: tyHairOil },
    { t: "Pain Relief Oil", d: "Ayurvedic warmth for aching joints.", img: tyPainOil },
    {
      t: "Big Box Duos",
      d: "Two bottles. Double the effectiveness.",
      img: tyHairOilDuo,
    },
  ];
  return (
    <section className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Featured Collection"
          title={
            <>
              Where to begin your <em className="italic text-gradient-gold not-italic">ritual</em>.
            </>
          }
          copy=""
        />
        <div className="mt-16 grid lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <a
              key={c.t}
              href="#products-list"
              className="group relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-luxe border border-gold/30"
            >
              <img
                src={c.img}
                alt={c.t}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
                <div className="font-display text-3xl">{c.t}</div>
                <p className="text-sm text-ivory/80 mt-2">{c.d}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-gold-soft">
                  Explore <ArrowIcon />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- VIDEO / CINEMATIC ---------------- */
function VideoSection() {
  return (
    <section className="relative py-28 lg:py-40 bg-forest-deep text-ivory overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `url(${processImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/70 via-forest-deep/50 to-forest-deep/80" />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-3 mb-6 justify-center">
          <span className="h-px w-10 bg-gold" />
          <span className="text-xs tracking-[0.35em] uppercase text-gold-soft">Watch</span>
          <span className="h-px w-10 bg-gold" />
        </div>
        <h2 className="font-display text-4xl md:text-6xl">
          Golden hour, <em className="italic text-gradient-gold not-italic">bottled</em>.
        </h2>
        <p className="mt-6 text-ivory/70">
          A short film from our atelier — herbs, sunlight, and the patience of slow craft.
        </p>
        <button className="mt-10 w-20 h-20 rounded-full bg-gold text-forest grid place-items-center mx-auto shadow-luxe hover:scale-105 transition">
          <PlayIcon />
        </button>
      </div>
    </section>
  );
}

/* ---------------- JOURNAL ---------------- */
const JOURNAL_POSTS = [
  {
    title: "Why Slow-Infusion Beats Steam Extraction",
    excerpt: "A weeks-long traditional process, and why it matters for potency.",
  },
  {
    title: "A Beginner's Guide to an Ayurvedic Hair Ritual",
    excerpt: "Building a weekly oiling routine that actually works.",
  },
  {
    title: "Joint Pain in Your 40s: What Ayurveda Says",
    excerpt: "Warming herbs, consistent massage, and what the texts got right.",
  },
  {
    title: "Reading an Ingredient Label Like a Vaidya",
    excerpt: "What to look for — and what to avoid — in Ayurvedic products.",
  },
];

function Journal() {
  return (
    <section id="journal" className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="The Journal"
          title={
            <>
              Notes from the <em className="italic text-gradient-gold not-italic">atelier</em>.
            </>
          }
          copy="Field notes on Ayurveda, ingredients, and the rituals worth keeping."
        />
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {JOURNAL_POSTS.map((j) => (
            <a
              key={j.title}
              href="#journal"
              className="group block rounded-3xl border border-gold/20 bg-card p-7 shadow-luxe hover:-translate-y-1 transition"
            >
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-4">Journal</div>
              <div className="font-display text-xl text-forest leading-snug">{j.title}</div>
              <p className="mt-3 text-sm text-forest/65 leading-relaxed">{j.excerpt}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-forest group-hover:text-gold transition">
                Read More <ArrowIcon />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  {
    q: "Are your oils 100% chemical free?",
    a: "Yes. Every bottle is free of parabens, sulfates, mineral oil, and synthetic fragrance. Only cold-pressed base oils and slow-infused botanicals.",
  },
  {
    q: "How long until I see results?",
    a: "Most customers notice reduced fall within 3 weeks. Visible density and shine typically emerge between 60 and 90 days of daily use.",
  },
  {
    q: "Is this safe for sensitive scalps?",
    a: "Absolutely. Our formula is dermatologically tested and free of common irritants. For extreme sensitivity, we recommend a patch test first.",
  },
  {
    q: "How is Dard Nivarak Tel used?",
    a: "Massage 2–3 times a day on the affected area or as directed by your physician. Store in a cool place. Avoid contact with eyes and inflamed skin.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes — free express delivery on orders over ₹799. International shipping available on request.",
  },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-28 lg:py-40">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Questions"
          title={
            <>
              Answered with <em className="italic text-gradient-gold not-italic">care</em>.
            </>
          }
          copy=""
        />
        <div className="mt-16 divide-y divide-gold/25 border-t border-b border-gold/25">
          {FAQS.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full text-left py-6 flex items-center justify-between gap-6"
              >
                <span className="font-display text-xl text-forest">{f.q}</span>
                <span
                  className={`w-8 h-8 grid place-items-center rounded-full border border-gold/40 text-gold transition ${open === i ? "rotate-45 bg-gold text-ivory" : ""}`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all ${open === i ? "max-h-40 pb-6" : "max-h-0"}`}
              >
                <p className="text-forest/70 leading-relaxed max-w-3xl">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCTA() {
  return (
    <section className="relative py-24 px-6 lg:px-10">
      <div className="relative max-w-7xl mx-auto rounded-[2.5rem] overflow-hidden shadow-luxe">
        <div className="absolute inset-0 bg-gradient-forest" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative p-12 md:p-24 text-center text-ivory">
          <div className="inline-flex items-center gap-3 mb-6 justify-center">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs tracking-[0.35em] uppercase text-gold-soft">
              Begin your ritual
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-7xl leading-[1.02]">
            Experience Ayurveda,
            <br />
            <em className="italic text-gradient-gold not-italic">reimagined.</em>
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-ivory/75">
            Free express delivery on every order above ₹799. 30-day satisfaction guarantee.
          </p>
          <a
            href="#products-list"
            className="mt-10 inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gold text-forest text-sm tracking-[0.2em] uppercase hover:bg-gold-soft transition shadow-luxe"
          >
            Shop the Collection <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  const { setConcern } = useContext(ConcernContext);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const navigate = useNavigate();
  const whatsappUrl = "https://wa.me/918959568262?text=Hello%20Thakur%20Yograj%20Ayurveda%2C%20I%20have%20a%20query%20about%20your%20products.";

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.includes("@")) return;

    const emailClean = subscribeEmail.trim().toLowerCase();

    try {
      console.log("Newsletter subscribe clicked (Main Footer). Config:", {
        isFirebaseConfigured,
        db: !!db,
        email: emailClean,
      });

      // 1. Check local storage first (instant check)
      const saved = localStorage.getItem("thakur_newsletter_subscribers");
      const list = saved ? JSON.parse(saved) : [];
      if (list.includes(emailClean)) {
        toast.info("This email is already subscribed to our newsletter!");
        setSubscribeEmail("");
        return;
      }

      // 2. Check Firestore if configured
      if (isFirebaseConfigured && db) {
        const q = query(
          collection(db, "newsletter_subscribers"),
          where("email", "==", emailClean)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Sync local storage so we don't query Firestore again next time
          list.push(emailClean);
          localStorage.setItem("thakur_newsletter_subscribers", JSON.stringify(list));
          
          toast.info("This email is already subscribed to our newsletter!");
          setSubscribeEmail("");
          return;
        }

        await addDoc(collection(db, "newsletter_subscribers"), {
          email: emailClean,
          source: "GoDaddy / Website Footer",
          createdAt: serverTimestamp(),
          date: new Date().toLocaleDateString("en-IN"),
        });
      }

      // 3. Save new subscriber locally
      list.push(emailClean);
      localStorage.setItem("thakur_newsletter_subscribers", JSON.stringify(list));

      toast.success(
        "Thank you for subscribing! Check your inbox for our latest Ayurvedic guides and exclusive offers."
      );
      setSubscribeEmail("");
    } catch (err: any) {
      console.error("Error subscribing:", err);
      toast.error("Error subscribing. Please try again.");
    }
  };

  const handleFooterLink = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    const l = label.toLowerCase();
    if (l === "hair oil") {
      setConcern("hairfall");
      document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "pain relief oil") {
      setConcern("pain");
      document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "combo packs" || l === "gift sets") {
      setConcern("ritual");
      document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "our story") {
      document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "ingredients") {
      document.getElementById("ingredients")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "process") {
      document.getElementById("process")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "journal") {
      document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" });
    } else if (l === "whatsapp") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } else if (l === "contact") {
      navigate({ to: "/contact" });
    } else if (l === "shipping") {
      navigate({ to: "/shipping" });
    } else if (l === "returns") {
      navigate({ to: "/returns" });
    } else if (l === "privacy") {
      navigate({ to: "/privacy" });
    } else if (l === "terms") {
      navigate({ to: "/terms" });
    } else if (l === "instagram") {
      toast.info("Follow us on Instagram: @ThakurYograjAyurveda (Official handle coming soon!)");
    }
  };

  return (
    <footer className="bg-ivory pt-20 pb-10 border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <img src={brandLogo} alt="Thakur Yograj" className="h-20 w-auto" />
            <p className="mt-6 max-w-sm text-forest/70">
              Luxury Ayurvedic wellness, hand-crafted in Chhattisgarh. Rooted in tradition, refined
              for today.
            </p>
            <form onSubmit={handleSubscribeSubmit} className="mt-8 flex gap-2 max-w-sm">
              <input
                type="email"
                required
                placeholder="Your email address"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                className="flex-1 bg-transparent border-b border-gold/40 focus:border-gold outline-none py-3 text-sm text-forest placeholder:text-forest/40"
              />
              <button type="submit" className="px-5 py-3 rounded-full bg-forest text-ivory text-xs tracking-[0.2em] uppercase hover:bg-forest-deep transition cursor-pointer">
                Subscribe
              </button>
            </form>
          </div>

          <FooterCol
            title="Shop"
            links={["Hair Oil", "Pain Relief Oil", "Combo Packs", "Gift Sets"]}
            onLinkClick={handleFooterLink}
          />
          <FooterCol
            title="Company"
            links={["Our Story", "Ingredients", "Process", "Journal"]}
            onLinkClick={handleFooterLink}
          />
          <FooterCol
            title="Support"
            links={["Contact", "Shipping", "Returns", "WhatsApp"]}
            onLinkClick={handleFooterLink}
          />
        </div>

        <div className="mt-16 gold-divider" />

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-forest/55">
          <div>© {new Date().getFullYear()} Thakur Yograj Ayurveda · Made in India</div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 tracking-widest uppercase text-[10px]">
            <Link to="/contact" className="hover:text-gold cursor-pointer transition">
              Contact Us
            </Link>
            <Link to="/shipping" className="hover:text-gold cursor-pointer transition">
              Shipping Policy
            </Link>
            <Link to="/returns" className="hover:text-gold cursor-pointer transition">
              Refunds & Cancellations
            </Link>
            <Link to="/terms" className="hover:text-gold cursor-pointer transition">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-gold cursor-pointer transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  onLinkClick
}: {
  title: string;
  links: string[];
  onLinkClick: (label: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="md:col-span-2">
      <div className="text-xs tracking-[0.3em] uppercase text-forest/50">{title}</div>
      <ul className="mt-4 space-y-3 text-sm text-forest/80">
        {links.map((l) => (
          <li key={l}>
            <a
              href="#"
              onClick={(e) => onLinkClick(l, e)}
              className="hover:text-gold transition cursor-pointer"
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- SHARED ---------------- */
function SectionHeader({
  eyebrow,
  title,
  copy,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy?: string;
  align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center items-center mx-auto" : "text-left";
  return (
    <div className={`flex flex-col gap-6 max-w-3xl ${a}`}>
      <div
        className={`inline-flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
      >
        <span className="h-px w-10 bg-gold" />
        <span className="text-xs tracking-[0.35em] uppercase text-forest/70">{eyebrow}</span>
        {align === "center" && <span className="h-px w-10 bg-gold" />}
      </div>
      <h2 className="font-display text-4xl md:text-6xl leading-[1.02] text-forest">{title}</h2>
      {copy && <p className="text-forest/70 max-w-2xl leading-relaxed">{copy}</p>}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
    <div className="flex text-gold">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon({ fill = "none" }: { fill?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A1 1 0 0 0 5.6 19H17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="21" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-gold" />;
}

/* ---------------- PHILOSOPHY ---------------- */
function Philosophy() {
  return (
    <section className="relative py-20 bg-gradient-forest overflow-hidden text-ivory">
      <BotanicalCorner className="top-10 -left-8 text-gold/20 hidden md:block" />
      <BotanicalCorner className="bottom-10 -right-8 -scale-x-100 text-gold/20 hidden md:block" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-3 mb-6 justify-center">
          <span className="h-px w-8 bg-gold/40" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-gold-soft font-semibold">Our Philosophy</span>
          <span className="h-px w-8 bg-gold/40" />
        </div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ivory leading-tight">
          Rooted in Ayurveda. <br />
          <em className="italic text-gradient-gold not-italic">Proven by Science.</em>
        </h2>
        <p className="mt-8 text-ivory/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          At Thakur Yograj, we believe true wellness requires no shortcuts. Our remedies are brewed
          slowly using traditional decoction techniques, combining 27 of India's rarest botanicals.
          Every batch is tested in modern laboratories to guarantee absolute therapeutic purity
          without a single drop of synthetic chemicals.
        </p>
        <div className="mt-12 flex justify-center gap-12 text-[10px] tracking-[0.25em] uppercase text-gold-soft/80 font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" /> 100% Active Herbs
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Clinically Validated
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" /> No Mineral Oils
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- RANGE OF SOLUTIONS ---------------- */
function RangeOfSolutions() {
  const { setConcern } = useContext(ConcernContext);

  function goShop(id: Concern) {
    setConcern(id);
    document.getElementById("products-list")?.scrollIntoView({ behavior: "smooth" });
  }

  const ranges = [
    {
      id: "hairfall" as Concern,
      title: "Ayurvedic Hair Solutions",
      copy: "Slow-brewed oils and scalp care recipes to stimulate regrowth, arrest hair fall, and soothe dry follicles.",
      img: tyHairOil,
      btn: "Explore Hair Care",
    },
    {
      id: "pain" as Concern,
      title: "Targeted Pain Relief",
      copy: "Warming herb decoctions that penetrate deep to relieve muscle tension, ease joint stiffness, and reduce swelling.",
      img: tyPainOil,
      btn: "Explore Pain Relief",
    },
    {
      id: "ritual" as Concern,
      title: "Complete Ritual Duos",
      copy: "Curated combinations that pair follicle-vitalizing hair therapy with restorative muscle rubs in premium keepsake boxes.",
      img: tyHairOilDuo,
      btn: "Explore Combos",
    },
  ];

  return (
    <section className="py-24 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Our Solutions"
          title={
            <>
              Our Range of <em className="italic text-gradient-gold not-italic">Ayurvedic Remedies</em>
            </>
          }
          copy="Tailored therapies crafted with whole organic ingredients to treat hair vitality and deep muscle relief from the root."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {ranges.map((r) => {
            const isHair = r.id === "hairfall";
            const isPain = r.id === "pain";

            const cardStyle = isHair
              ? "border-emerald-800/10 hover:border-emerald-800/40 bg-emerald-50/5"
              : isPain
                ? "border-red-800/10 hover:border-red-800/40 bg-red-50/5"
                : "border-gold/15 hover:border-gold/50 bg-amber-50/5";

            const imgBorder = isHair
              ? "border-emerald-800/20"
              : isPain
                ? "border-red-800/20"
                : "border-gold/20";

            const btnStyle = isHair
              ? "border-emerald-800/20 text-emerald-950 hover:bg-emerald-800 hover:text-ivory hover:border-emerald-800"
              : isPain
                ? "border-red-800/20 text-red-950 hover:bg-red-800 hover:text-ivory hover:border-red-800"
                : "border-forest/20 text-forest hover:bg-forest hover:text-ivory hover:border-forest";

            return (
              <div
                key={r.title}
                className={`group flex flex-col items-center text-center p-6 bg-card border rounded-[2.5rem] shadow-luxe hover:-translate-y-2 transition-all duration-500 ${cardStyle}`}
              >
                {/* Arched image container */}
                <div
                  className={`w-full aspect-[4/5] overflow-hidden border shadow-inner bg-cream ${imgBorder}`}
                  style={{ borderRadius: "140px 140px 24px 24px" }}
                >
                  <img
                    src={r.img}
                    alt={r.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                </div>

                <h3 className="mt-8 font-display text-2xl lg:text-3xl text-forest">{r.title}</h3>
                <p className="mt-3 text-sm text-forest/70 leading-relaxed px-2 flex-1">{r.copy}</p>

                <button
                  onClick={() => goShop(r.id)}
                  className={`mt-8 px-6 py-3 rounded-full border text-xs tracking-[0.15em] uppercase transition-all duration-300 ${btnStyle}`}
                >
                  {r.btn}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TRIBE REVIEWS ---------------- */
const TRIBE_MEMBERS = [
  {
    name: "Kriti S.",
    city: "Mumbai",
    quote: "My severe hair fall stopped in just 3 weeks! Now my hair feels thicker and holds shine all day.",
    img: lifestyleHairLuxury,
    tag: "Hair Oil",
    rating: 5,
  },
  {
    name: "Rajesh K.",
    city: "Bengaluru",
    quote: "Applied Dard Nivarak Tel after my tennis matches. The warmth eases knee stiffness almost instantly.",
    img: lifestylePainRelief,
    tag: "Pain Relief",
    rating: 5,
  },
  {
    name: "Priya M.",
    city: "New Delhi",
    quote: "The Wellness Combo is my go-to luxury ritual. Traditional recipes packed in beautiful glass bottles.",
    img: ingredientsAyurveda,
    tag: "Duo Combo",
    rating: 5,
  },
];

function TribeReviews() {
  return (
    <section className="py-24 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Tribe Stories"
          title={
            <>
              Meet the <em className="italic text-gradient-gold not-italic">Thakur Yograj Tribe</em>
            </>
          }
          copy="See how real members of our community integrated traditional Ayurvedic oiling into their busy, modern routines with incredible results."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {TRIBE_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="group relative flex flex-col rounded-[2.5rem] bg-card border border-gold/15 overflow-hidden shadow-luxe hover:-translate-y-1.5 transition-all duration-500"
            >
              {/* Arched image wrapper */}
              <div
                className="relative aspect-[3/4] overflow-hidden bg-cream"
                style={{ borderRadius: "140px 140px 0 0" }}
              >
                <img
                  src={member.img}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />

                {/* Black gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent opacity-90" />

                {/* Product Tag */}
                <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-forest text-ivory text-[9px] tracking-widest uppercase font-semibold">
                  {member.tag}
                </div>

                {/* Floating Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-16 h-16 rounded-full bg-gold/90 backdrop-blur-sm text-forest flex items-center justify-center shadow-luxe group-hover:scale-110 transition duration-300">
                    <PlayIcon />
                  </span>
                </div>

                {/* Customer Quote Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
                  <p className="text-sm italic leading-relaxed text-ivory/90">
                    "{member.quote}"
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold text-forest flex items-center justify-center font-display text-sm font-semibold">
                      {member.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold tracking-wide">{member.name}</div>
                      <div className="text-[10px] text-gold-soft tracking-wider uppercase font-semibold">
                        {member.city} · Verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- VIDEO GALLERY ---------------- */
const REEL_VIDEOS = [
  {
    title: "21-Day Sun Infusion",
    duration: "1:45",
    desc: "Watch how we steep raw herbs under direct sunlight in copper urns.",
    img: processImg,
    product: "Herbal Hair Oil",
  },
  {
    title: "Shiro Abhyanga Tutorial",
    duration: "2:10",
    desc: "Learn the proper Ayurvedic massage steps to boost root circulation.",
    img: hairModelImg,
    product: "Ritual Duo",
  },
  {
    title: "Herb Sorting & Quality Check",
    duration: "1:30",
    desc: "A look inside our Chhattisgarh unit sorting fresh Amla & Bhringraj.",
    img: ingredientsImg,
    product: "Dard Nivarak Oil",
  },
];

function VideoGallery() {
  return (
    <section className="relative py-24 bg-gradient-forest overflow-hidden text-ivory">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${processImg})`, backgroundSize: "cover" }} />
      <div className="absolute inset-0 bg-forest-deep/60" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gold-soft" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-soft font-semibold">Video Gallery</span>
            <span className="h-px w-8 bg-gold-soft" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl">
            Atelier <em className="italic text-gradient-gold not-italic">Video Stories</em>
          </h2>
          <p className="mt-4 text-ivory/80 text-base">
            Go behind the scenes. Watch our patient extraction craft, oil packing rituals, and customer guide tutorials.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-8">
          {REEL_VIDEOS.map((reel) => (
            <div
              key={reel.title}
              className="group relative rounded-[2.5rem] bg-forest-deep/40 border border-gold/20 overflow-hidden shadow-luxe"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-[3/4] overflow-hidden bg-forest/20">
                <img
                  src={reel.img}
                  alt={reel.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-80"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/20 to-transparent" />

                {/* Duration Badge */}
                <div className="absolute top-6 left-6 px-2.5 py-1 rounded-full bg-forest-deep/80 border border-gold/20 text-[9px] font-semibold text-gold-soft tracking-wider">
                  {reel.duration}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-gold/90 text-forest flex items-center justify-center shadow-luxe group-hover:scale-110 transition duration-300">
                    <PlayIcon />
                  </span>
                </div>

                {/* Caption / Text Details */}
                <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
                  <div className="text-[10px] tracking-wider uppercase text-gold-soft font-semibold">
                    Featured: {reel.product}
                  </div>
                  <h4 className="mt-2 font-display text-2xl leading-tight">
                    {reel.title}
                  </h4>
                  <p className="mt-2 text-xs text-ivory/70 leading-relaxed">
                    {reel.desc}
                  </p>

                  {/* Shop CTA */}
                  <a
                    href="#products-list"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs text-gold font-bold tracking-wide uppercase group-hover:text-gold-soft transition"
                  >
                    Shop Featured <ArrowIcon />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- KNOWLEDGE HUB ---------------- */
/* ---------------- KNOWLEDGE HUB ---------------- */
const HUB_ARTICLES = [
  {
    title: "Understanding Hair Loss: The Ayurvedic Perspective",
    desc: "How balancing your Vata, Pitta, and Kapha doshas stimulates root follicles and arrests premature hair fall.",
    time: "5 min read",
    category: "Trichology",
    img: hairModelImg,
    content: `Ayurveda views hair health as a direct reflection of your internal metabolic state and the balance of your biological energies (Doshas). According to ancient texts, hair is an *Upadhatu* (by-product) of the bone tissue (*Asthi Dhatu*), meaning that the quality of your hair relies heavily on the nourishment your skeletal and metabolic systems receive.

### The Role of Pitta Dosha
Excess heat in the body, driven by an aggravated Pitta dosha, is the primary driver of premature graying and hair thinning. When Pitta accumulates in the scalp, it inflames the hair follicles, leading to weak roots and accelerated shedding. To balance Pitta, cool and soothing botanical infusions like Amla, Bhringraj, and Coconut oil are recommended.

### The Impact of Vata and Kapha
- **Vata Imbalance**: Leads to dry scalp, flaky skin, split ends, and brittle strands. Vata responds best to grounding, heavy oils like Sesame oil.
- **Kapha Imbalance**: Produces excess sebum, leading to sticky roots, greasy dandruff, and clogged follicles. Kapha scalp conditions benefit from stimulating herbs like Rosemary and Ginger.`,
  },
  {
    title: "The Diet for Healthy Hair: Foods to Feed Your Roots",
    desc: "A guide to natural Ayurvedic superfoods that build keratin levels and prevent breakage from within.",
    time: "4 min read",
    category: "Nutrition",
    img: ingredientsImg,
    content: `While topical applications are vital, true hair rejuvenation starts from within. In Ayurveda, the food we consume undergoes a multi-stage transformation process, nourishing our plasma (*Rasa*), blood (*Rakta*), muscle, fat, and bone tissues in sequence. To grow strong, thick hair, your body requires a rich supply of nutrients that specifically target the blood and bone channels.

### Hair-Nourishing Ayurvedic Superfoods
- **Amla (Gooseberry)**: Packed with Vitamin C, Amla is a powerful antioxidant that prevents oxidative damage to hair follicles and boosts melanin synthesis to ward off gray hair.
- **Almonds and Walnuts**: Rich in healthy fats and zinc, these nuts nourish the *Asthi Dhatu* (bone tissue), providing structural integrity to hair shafts.
- **Sesame Seeds**: Eating black sesame seeds daily supplies the body with calcium and magnesium, which are crucial for hair thickness.
- **Curry Leaves**: Traditionally eaten or cooked into foods to enhance iron absorption and hair pigmentation.

### Foods to Limit
To maintain balanced Doshas, minimize consumption of excessively spicy, salty, or sour foods, which can increase body heat and aggravate hair fall.`,
  },
  {
    title: "The Art of Shiro Abhyanga: Scalp Massage Guide",
    desc: "Step-by-step massage techniques using warm oils to increase blood flow, ease stress, and trigger regrowth.",
    time: "6 min read",
    category: "Rituals",
    img: processImg,
    content: `Shiro Abhyanga is the ancient practice of Ayurvedic head massage. Beyond nourishing the hair, this ritual stimulates vital energy centers (*Marma points*) on the scalp, relaxes the nervous system, improves sleep, and encourages healthy circulation to the hair roots.

### Step-by-Step Massage Ritual
1. **Warm the Oil**: Always warm your Ayurvedic oil slightly before application to facilitate absorption.
2. **Apply to Crown**: Pour a small amount directly onto the crown of the head (*Adhipati Marma*), which controls the flow of energy to the entire scalp.
3. **Spread Evenly**: Using flat hands, spread the oil across the forehead, sides, and back of the scalp.
4. **Knead & Circle**: Use your fingertips to make firm, circular motions. Work from the hairline backwards to the neck.
5. **Stimulate Marmas**: Gently press the center of the crown, the base of the skull, and the temples to relieve stress and release tension.

Performing Shiro Abhyanga 2–3 times a week for 10–15 minutes before washing will dramatically improve hair tensile strength.`,
  },
];

function KnowledgeHub() {
  const [selectedArticle, setSelectedArticle] = useState<typeof HUB_ARTICLES[0] | null>(null);
  const { addItem } = useContext(CartContext);

  const getProductObj = (title: string) => {
    if (title.includes("Diet")) {
      return {
        name: "The Wellness Ritual",
        price: "₹1,199",
        img: tyHairOilDuo,
      };
    }
    return {
      name: "Herbal Hair Oil",
      price: "₹799",
      img: tyHairOil,
    };
  };

  return (
    <section id="journal" className="py-24 bg-cream/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Knowledge Hub"
          title={
            <>
              Ayurvedic Wisdom for <em className="italic text-gradient-gold not-italic">Modern Hair Care</em>
            </>
          }
          copy="Read clinical advice, traditional methods, and wellness recipes compiled by our expert Vaidyas."
        />

        <div className="mt-16 grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Large Column (Main Callout Card) */}
          <div className="lg:col-span-4 rounded-[2.5rem] bg-gradient-forest border border-gold/25 p-8 md:p-12 flex flex-col justify-between shadow-luxe text-ivory">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] tracking-widest uppercase font-semibold">
                Wellness Guide
              </div>
              <h3 className="mt-6 font-display text-3xl md:text-4xl leading-tight">
                Empowering Your Self-Care Journey
              </h3>
              <p className="mt-4 text-sm text-ivory/80 leading-relaxed">
                Ayurveda is more than just applying products. It is a daily mindfulness ritual. Discover how
                botanicals, nutrition, and ancient therapeutic massage work in harmony to transform your body's energy.
              </p>
            </div>

            <div className="mt-12">
              <button
                onClick={() => setSelectedArticle(HUB_ARTICLES[0])}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-gold text-forest text-xs tracking-wider uppercase font-bold hover:bg-gold-soft transition shadow-luxe cursor-pointer"
              >
                Read Featured Guide <ArrowIcon />
              </button>
            </div>
          </div>

          {/* Right Articles Grid */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-6">
            {HUB_ARTICLES.map((art) => (
              <button
                key={art.title}
                onClick={() => setSelectedArticle(art)}
                className="group flex flex-col rounded-[2rem] bg-card border border-gold/15 overflow-hidden shadow-luxe hover:-translate-y-1.5 transition-all duration-500 text-left cursor-pointer"
              >
                {/* Image panel */}
                <div className="relative aspect-[4/3] overflow-hidden bg-cream w-full">
                  <img
                    src={art.img}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-ivory/95 backdrop-blur-sm border border-gold/20 text-[9px] tracking-widest uppercase font-semibold text-forest">
                    {art.category}
                  </div>
                </div>

                {/* Text panel */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-forest/50 font-semibold tracking-wider">{art.time}</div>
                    <h4 className="mt-3 font-display text-xl text-forest group-hover:text-gold transition leading-snug">
                      {art.title}
                    </h4>
                    <p className="mt-2 text-xs text-forest/65 leading-relaxed">
                      {art.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-semibold text-forest group-hover:text-gold transition">
                    Read Article <ArrowIcon />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest-deep/60 backdrop-blur-md" data-lenis-prevent>
          <div className="relative w-full max-w-3xl bg-ivory rounded-[2.5rem] border border-gold/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" data-lenis-prevent>

            {/* Header image banner */}
            <div className="relative h-48 md:h-64 shrink-0 bg-cream">
              <img
                src={selectedArticle.img}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ivory via-transparent to-black/20" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 w-9 h-9 grid place-items-center rounded-full bg-ivory/90 border border-gold/20 text-forest hover:bg-gold hover:text-ivory transition cursor-pointer z-10"
                aria-label="Close article"
              >
                ✕
              </button>
              <span className="absolute bottom-4 left-8 px-3 py-1.5 rounded-full bg-gold text-forest text-[10px] tracking-widest uppercase font-bold">
                {selectedArticle.category}
              </span>
            </div>

            {/* Scrollable content panel */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8 space-y-6" data-lenis-prevent>
              <div>
                <span className="text-[10px] tracking-wider text-forest/50 font-semibold">{selectedArticle.time}</span>
                <h3 className="font-display text-3xl md:text-4xl text-forest mt-2 font-bold leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>

              {/* Body text parsing paragraph line breaks and markdown headers */}
              <div className="text-sm md:text-base text-forest/80 space-y-4 leading-relaxed font-sans">
                {selectedArticle.content.split("\n\n").map((para, pIdx) => {
                  if (para.startsWith("###")) {
                    return (
                      <h4 key={pIdx} className="font-display text-xl text-forest font-bold pt-4">
                        {para.replace("###", "").trim()}
                      </h4>
                    );
                  }
                  if (para.startsWith("- ")) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-2">
                        {para.split("\n").map((li, lIdx) => (
                          <li key={lIdx}>
                            {li.replace("- ", "").trim()}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={pIdx}>
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Recommended Product Card */}
              {(() => {
                const recProduct = getProductObj(selectedArticle.title);
                return (
                  <div className="mt-12 p-6 rounded-3xl border border-gold/20 bg-forest/[0.02] flex flex-col sm:flex-row items-center gap-6 w-full">
                    <img
                      src={recProduct.img}
                      alt={recProduct.name}
                      className="w-20 h-20 object-cover rounded-2xl border border-gold/15 shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <span className="text-[8px] tracking-[0.2em] uppercase text-gold font-bold">Related Remedy</span>
                      <h5 className="font-display text-lg text-forest mt-0.5 truncate">{recProduct.name}</h5>
                      <p className="text-xs text-forest/65 leading-relaxed">Incorporate this botanical remedy in your daily routine.</p>
                      <div className="font-display text-base text-forest mt-1.5 font-bold">{recProduct.price}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        addItem(recProduct, e, true);
                        setSelectedArticle(null);
                      }}
                      className="px-5 py-3 rounded-full bg-forest text-ivory text-[10px] tracking-wider uppercase font-bold hover:bg-forest-deep transition shrink-0 cursor-pointer shadow-sm w-full sm:w-auto"
                    >
                      Add & Buy
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- CERTIFICATIONS & TRUST BADGES ---------------- */
function CertificationGrid() {
  const certifications = [
    {
      title: "AYUSH Certified",
      desc: "Licensed under Ministry of AYUSH, Govt of India for authentic proprietary Ayurvedic medicine.",
      icon: (
        <svg className="w-10 h-10 stroke-gold fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      )
    },
    {
      title: "Dermatologically Safe",
      desc: "Clinically tested on human volunteers to guarantee zero skin irritation and high dermal compatibility.",
      icon: (
        <svg className="w-10 h-10 stroke-gold fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )
    },
    {
      title: "100% Active Botanicals",
      desc: "Slow-infused with 27 wild-crafted whole herbs. Free from synthetic extracts, artificial fragrances, or dyes.",
      icon: (
        <svg className="w-10 h-10 stroke-gold fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 0 0-9 9M12 21a9 9 0 0 0 9-9" />
        </svg>
      )
    },
    {
      title: "Taila Pak Vidhi",
      desc: "Traditional 21-day copper vessel slow-brewing method to lock in volatile phytochemical compounds.",
      icon: (
        <svg className="w-10 h-10 stroke-gold fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-16 bg-cream/40 border-b border-gold/15">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {certifications.map((c) => (
            <div
              key={c.title}
              className="flex flex-col items-center text-center p-6 bg-ivory/60 border border-gold/10 rounded-2xl shadow-sm hover:border-gold/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center mb-5 border border-gold/15">
                {c.icon}
              </div>
              <h3 className="font-display text-xl text-forest font-semibold mb-2">{c.title}</h3>
              <p className="text-xs text-forest/70 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- RITUAL APPLICATION GUIDE ---------------- */
function RitualGuide() {
  const [activeTab, setActiveTab] = useState<"hair" | "pain">("hair");

  const rituals = {
    hair: {
      title: "The Hair Vitality Ritual",
      tagline: "Unleash the full potency of 27 slow-cooked herbs for root strength.",
      img: tyHairOilLifestyle,
      steps: [
        {
          num: "01",
          title: "Warm the Essence",
          desc: "Dispense 10-15ml of Herbal Hair Oil into a small copper or glass bowl. Warm slightly to release active herbal volatiles."
        },
        {
          num: "02",
          title: "Root Scalp Massage",
          desc: "Partition hair into sections. Apply oil to scalp and massage in firm, circular strokes for 10 mins to stimulate blood circulation."
        },
        {
          num: "03",
          title: "Overnight Infusion",
          desc: "Leave the oil on overnight (minimum 3 hours) to let the roots absorb nutrition. Wash next morning with a mild natural cleanser."
        }
      ]
    },
    pain: {
      title: "The Restoration Pain Ritual",
      tagline: "Activate deep warming botanicals to soothe stiff joints and sore muscles.",
      img: tyPainOilLifestyle,
      steps: [
        {
          num: "01",
          title: "Apply on Target",
          desc: "Pour 5-10ml of Dard Nivarak Tel directly onto the target joint, back, shoulder, or muscle area showing pain."
        },
        {
          num: "02",
          title: "Firm Friction Rub",
          desc: "Rub the area with circular motions using the heel of your palm. Apply moderate pressure to stimulate warm botanical activation."
        },
        {
          num: "03",
          title: "Thermal Sealing",
          desc: "For rapid relief, wrap the area with a dry warm towel or apply a hot water compress for 15 minutes to lock in active botanicals."
        }
      ]
    }
  };

  const current = rituals[activeTab];

  return (
    <section id="ritual-guide" className="py-24 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          eyebrow="Application Rituals"
          title={
            <>
              How to Apply the <em className="italic text-gradient-gold not-italic">Remedies</em>
            </>
          }
          copy="Ayurveda is as much about the application technique as the botanical ingredients. Follow our certified wellness rituals to maximize results."
        />

        {/* Tab Switcher */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("hair")}
            className={`px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-widest border transition-all duration-300 ${activeTab === "hair"
              ? "bg-forest border-forest text-ivory shadow-luxe"
              : "border-gold/30 text-forest hover:bg-gold/10"
              }`}
          >
            Hair Care Ritual
          </button>
          <button
            onClick={() => setActiveTab("pain")}
            className={`px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-widest border transition-all duration-300 ${activeTab === "pain"
              ? "bg-forest border-forest text-ivory shadow-luxe"
              : "border-gold/30 text-forest hover:bg-gold/10"
              }`}
          >
            Pain Relief Ritual
          </button>
        </div>

        {/* Ritual Container */}
        <div className="mt-16 bg-card border border-gold/15 rounded-[3rem] p-8 lg:p-16 shadow-luxe grid lg:grid-cols-12 gap-12 items-center">
          {/* Left image column */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 rounded-full bg-gold/5 blur-2xl pointer-events-none" />
            <div
              className="relative aspect-[3/4] overflow-hidden border border-gold/25 shadow-xl bg-cream/10"
              style={{ borderRadius: "140px 140px 24px 24px" }}
            >
              <img
                src={current.img}
                alt={current.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right steps column */}
          <div className="lg:col-span-7 flex flex-col">
            <span className="text-[10px] tracking-[0.3em] uppercase text-gold font-bold">{activeTab === "hair" ? "Hair Care" : "Pain Relief"}</span>
            <h3 className="font-display text-3xl md:text-4xl text-forest mt-2">{current.title}</h3>
            <p className="text-sm text-forest/75 mt-3 italic">{current.tagline}</p>

            <div className="mt-10 space-y-8 relative">
              {/* Connecting line */}
              <div className="absolute left-6 top-3 bottom-3 w-px bg-gold/20 hidden sm:block" />

              {current.steps.map((s, idx) => (
                <div key={idx} className="flex gap-6 relative z-10 items-start">
                  <div className="w-12 h-12 rounded-full bg-forest text-gold font-display text-lg flex items-center justify-center shrink-0 border border-gold/20 shadow-md">
                    {s.num}
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-forest font-semibold">{s.title}</h4>
                    <p className="text-xs md:text-sm text-forest/75 mt-1.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- DOSHA HAIR & BODY QUIZ CTA ---------------- */
function DoshaQuizCTA() {
  const { openQuiz } = useContext(CartContext);

  return (
    <section className="py-24 bg-gradient-forest text-ivory relative overflow-hidden">
      {/* Background glowing rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/10 blur-sm pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-gold/5 blur-xs pointer-events-none" />

      <BotanicalCorner className="top-10 -left-6 opacity-20 text-gold/30 hidden lg:block" />
      <BotanicalCorner className="bottom-10 right-0 -scale-x-100 opacity-20 text-gold/30 hidden lg:block" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-[10px] tracking-[0.45em] uppercase text-gold-soft font-bold">Ayurvedic Consultation</span>
        <h2 className="font-display text-4xl md:text-6xl text-ivory mt-4 leading-tight">
          Discover Your Ayurvedic <br />
          <em className="italic text-gradient-gold not-italic">Hair & Body Profile</em>
        </h2>
        <p className="mt-6 text-ivory/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          Every body type (Vata, Pitta, Kapha) requires different botanical ratios. Take our 2-minute
          Ayurvedic Assessment to discover your primary Dosha constitution and get a tailored routine recommendations.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={openQuiz}
            className="px-8 py-4 rounded-full bg-gold text-forest text-xs tracking-[0.2em] uppercase font-bold hover:bg-gold-soft transition shadow-luxe cursor-pointer"
          >
            Start Free Assessment
          </button>
          <a
            href="#story"
            className="inline-flex items-center gap-2 px-6 py-4 text-xs tracking-[0.15em] uppercase font-bold text-ivory border-b border-gold/40 hover:border-gold transition"
          >
            Learn about Doshas
          </a>
        </div>

        <div className="mt-14 flex justify-center gap-8 text-[10px] text-ivory/60 tracking-wider">
          <div>✓ Personalised Routine</div>
          <div className="w-px h-4 bg-gold/35" />
          <div>✓ 2-Minute Assessment</div>
          <div className="w-px h-4 bg-gold/35" />
          <div>✓ Approved by Vaidyas</div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- WISHLIST DRAWER ---------------- */
function WishlistDrawer() {
  const { wishlist, isWishlistOpen, closeWishlist, toggleWishlist, addItem } = useContext(CartContext);

  return (
    <>
      <div
        aria-hidden={!isWishlistOpen}
        onClick={closeWishlist}
        className={`fixed inset-0 z-[60] bg-forest-deep/50 backdrop-blur-sm transition-opacity ${isWishlistOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-ivory border-l border-gold/30 shadow-luxe flex flex-col transition-transform duration-500 ${isWishlistOpen ? "translate-x-0" : "translate-x-full"
          }`}
        aria-label="Wishlist"
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gold/20">
          <div className="font-display text-2xl text-forest">Your Wishlist</div>
          <button
            aria-label="Close wishlist"
            onClick={closeWishlist}
            className="w-9 h-9 grid place-items-center rounded-full border border-gold/30 text-forest hover:bg-gold/10 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {wishlist.length === 0 ? (
            <p className="text-forest/60 text-sm">
              Your wishlist is empty. Tap the heart on products to save them here.
            </p>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gold/10 bg-ivory/50"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl border border-gold/15"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base text-forest truncate">{item.name}</h4>
                    <p className="text-xs text-gold font-semibold mt-0.5">{item.price}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        addItem(item, e, true);
                        toggleWishlist(item);
                      }}
                      className="px-3 py-1.5 rounded-full bg-forest text-ivory text-[10px] tracking-wider uppercase font-semibold hover:bg-forest-deep transition cursor-pointer"
                    >
                      Move to Bag
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="text-stone-400 hover:text-red-700 text-[10px] uppercase font-semibold text-center transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ---------------- DOSHA ASSESSMENT QUIZ MODAL ---------------- */
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Describe your scalp and hair condition:",
    options: [
      { type: "vata", text: "Dry, frizzy, split ends, rough texture, prone to tangles" },
      { type: "pitta", text: "Thinning, premature graying, sensitive scalp, warm feeling" },
      { type: "kapha", text: "Thick, oily, heavy, naturally lustrous, needs frequent washing" },
    ],
  },
  {
    id: 2,
    question: "How do your muscles and joints feel after moderate activity?",
    options: [
      { type: "vata", text: "Dry, popping or cracking joints, stiffness in lower back, light pain" },
      { type: "pitta", text: "Warm to touch, prone to inflammation, swelling, or burning" },
      { type: "kapha", text: "Heavy, stable but stiff, water retention, slow-moving or sluggish" },
    ],
  },
  {
    id: 3,
    question: "What is your body's temperature and climate tendency?",
    options: [
      { type: "vata", text: "Cold hands/feet, dislike dry wind, prefer warm heating" },
      { type: "pitta", text: "Always warm, sweat easily, prefer cool rooms and cold drinks" },
      { type: "kapha", text: "Dislike damp cold, adapt well to warm weather but feel heavy in humidity" },
    ],
  },
];

function DoshaQuizModal() {
  const { isQuizOpen, closeQuiz, addItem } = useContext(CartContext);
  const [step, setStep] = useState(0); // 0: intro, 1, 2, 3: questions, 4: results
  const [answers, setAnswers] = useState<string[]>([]);

  if (!isQuizOpen) return null;

  const handleStart = () => {
    setStep(1);
    setAnswers([]);
  };

  const handleAnswer = (type: string) => {
    const nextAnswers = [...answers, type];
    setAnswers(nextAnswers);
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
  };

  // Calculate results
  const vataCount = answers.filter((a) => a === "vata").length;
  const pittaCount = answers.filter((a) => a === "pitta").length;
  const kaphaCount = answers.filter((a) => a === "kapha").length;

  let dominant: "vata" | "pitta" | "kapha" = "vata";
  if (pittaCount > vataCount && pittaCount >= kaphaCount) dominant = "pitta";
  else if (kaphaCount > vataCount && kaphaCount > pittaCount) dominant = "kapha";

  // Recommends
  const recommendations = {
    vata: {
      name: "Vata Profile (Air & Space)",
      desc: "Your constitution is dominated by Air and Space elements. You benefit from grounding, warming, and deeply lubricating treatments to soothe dry joints and restore skin and hair moisture.",
    },
    pitta: {
      name: "Pitta Profile (Fire & Water)",
      desc: "Your constitution is dominated by Fire and Water elements. You benefit from cooling, soothing, and anti-inflammatory formulations to balance heat, soothe scalp sensitivity, and promote hair growth.",
    },
    kapha: {
      name: "Kapha Profile (Earth & Water)",
      desc: "Your constitution is dominated by Earth and Water elements. You benefit from stimulating, circulation-boosting, and warming rituals to reduce stiffness and balance moisture.",
    },
  };

  const result = recommendations[dominant];

  const getProductObj = (type: "vata" | "pitta" | "kapha") => {
    if (type === "vata") {
      return {
        name: "Dard Nivarak Tel",
        price: "₹499",
        img: tyPainOil,
      };
    }
    if (type === "pitta") {
      return {
        name: "Herbal Hair Oil",
        price: "₹799",
        img: tyHairOil,
      };
    }
    return {
      name: "The Wellness Ritual",
      price: "₹1,199",
      img: tyHairOilDuo,
    };
  };

  const activeProduct = getProductObj(dominant);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest-deep/60 backdrop-blur-md" data-lenis-prevent>
      <div className="relative w-full max-w-2xl bg-ivory rounded-[2.5rem] border border-gold/30 shadow-2xl p-8 md:p-12 overflow-hidden max-h-[90vh] flex flex-col" data-lenis-prevent>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-forest/5 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeQuiz}
          className="absolute top-6 right-6 w-9 h-9 grid place-items-center rounded-full border border-gold/20 text-forest hover:bg-gold/10 transition cursor-pointer z-10"
        >
          ✕
        </button>

        {step === 0 && (
          <div className="text-center space-y-6 my-auto">
            <span className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold">Ayurvedic Quiz</span>
            <h3 className="font-display text-3xl md:text-4xl text-forest">
              Discover Your Dosha Constitution
            </h3>
            <p className="text-xs md:text-sm text-forest/75 max-w-md mx-auto leading-relaxed">
              Every individual possesses a unique blueprint of three biological forces: Vata (Air), Pitta (Fire), and Kapha (Earth). Take this simple diagnostic to match with your botanical ratio.
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-full bg-forest text-ivory text-xs tracking-widest uppercase font-bold hover:bg-forest-deep transition shadow-md cursor-pointer"
            >
              Start Diagnostic
            </button>
          </div>
        )}

        {step > 0 && step <= 3 && (
          <div className="space-y-6 my-auto flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] tracking-wider text-forest/50 uppercase font-semibold">
              <span>Question {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gold/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <h4 className="font-display text-xl md:text-2xl text-forest font-semibold mt-4">
              {QUIZ_QUESTIONS[step - 1].question}
            </h4>

            <div className="space-y-3 mt-6">
              {QUIZ_QUESTIONS[step - 1].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt.type)}
                  className="w-full p-5 rounded-2xl border border-gold/15 bg-ivory/50 text-left text-xs md:text-sm text-forest hover:bg-gold/5 hover:border-gold transition flex items-center gap-4 cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-forest/5 border border-gold/25 text-[10px] font-display flex items-center justify-center shrink-0 text-forest/60">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 overflow-y-auto pr-2 flex-1 flex flex-col justify-center py-4">
            <div className="text-center space-y-2">
              <span className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold">Your Result</span>
              <h3 className="font-display text-3xl md:text-4xl text-forest font-bold">
                {result.name}
              </h3>
            </div>

            <p className="text-xs md:text-sm text-forest/75 leading-relaxed text-center max-w-lg mx-auto">
              {result.desc}
            </p>

            <div className="p-5 rounded-3xl border border-gold/20 bg-forest/[0.02] flex flex-col sm:flex-row items-center gap-6 max-w-lg mx-auto mt-4 w-full">
              <img
                src={activeProduct.img}
                alt={activeProduct.name}
                className="w-24 h-24 object-cover rounded-2xl border border-gold/15 shrink-0"
              />
              <div className="flex-1 text-center sm:text-left min-w-0">
                <span className="text-[8px] tracking-[0.2em] uppercase text-gold font-bold">Recommended Botanical</span>
                <h4 className="font-display text-lg md:text-xl text-forest mt-0.5 truncate">{activeProduct.name}</h4>
                <p className="text-xs text-forest/65 mt-1 leading-relaxed">Perfect ratio for your specific doshic profile.</p>
                <div className="font-display text-lg text-forest mt-2 font-bold">{activeProduct.price}</div>
              </div>
              <button
                onClick={(e) => {
                  addItem(activeProduct, e, true);
                  closeQuiz();
                }}
                className="px-5 py-3 rounded-full bg-forest text-ivory text-[10px] tracking-wider uppercase font-bold hover:bg-forest-deep transition shrink-0 cursor-pointer shadow-sm w-full sm:w-auto"
              >
                Add & Checkout
              </button>
            </div>

            <div className="flex justify-center gap-4 mt-6 shrink-0">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full border border-gold/20 text-forest text-[10px] tracking-widest uppercase font-semibold hover:bg-gold/10 transition cursor-pointer"
              >
                Retake Assessment
              </button>
              <button
                onClick={closeQuiz}
                className="px-6 py-2.5 rounded-full bg-forest text-ivory text-[10px] tracking-widest uppercase font-semibold hover:bg-forest-deep transition cursor-pointer"
              >
                Close Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- WHATSAPP FLOATING BUTTON ---------------- */
function WhatsAppIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.452 5.568 0 10.1-4.526 10.103-10.088.001-2.695-1.047-5.228-2.951-7.133C16.688 1.48 14.159.432 11.472.432c-5.566 0-10.097 4.527-10.1 10.089-.001 1.849.497 3.655 1.442 5.23L1.83 20.17l4.817-1.017zm11.428-5.385c-.328-.164-1.94-.957-2.24-1.066-.3-.11-.519-.164-.738.164-.22.329-.849 1.066-1.04 1.285-.192.219-.383.246-.711.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.825-2.274-.192-.328-.02-.505.143-.668.148-.147.329-.383.493-.574.164-.192.22-.328.328-.547.11-.219.055-.41-.027-.574-.082-.164-.738-1.777-1.012-2.433-.267-.642-.539-.556-.738-.566-.19-.01-.41-.01-.629-.01-.219 0-.574.082-.875.41-.3.328-1.148 1.12-1.148 2.73 0 1.61 1.175 3.168 1.339 3.387.164.22 2.313 3.53 5.6 4.947.782.337 1.391.539 1.866.69.786.25 1.5.215 2.066.13.63-.095 1.94-.793 2.213-1.559.273-.766.273-1.422.192-1.559-.082-.137-.3-.22-.628-.383z" />
    </svg>
  );
}

function WhatsAppFloat() {
  const whatsappUrl = "https://wa.me/918959568262?text=Hello%20Thakur%20Yograj%20Ayurveda%2C%20I%20have%20a%20query%20about%20your%20products.";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-[100] w-14 h-14 bg-[#25D366] text-ivory rounded-full shadow-[0_8px_24px_rgba(37,211,102,0.35)] flex items-center justify-center transition duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(37,211,102,0.5)] group active:scale-95 cursor-pointer"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon />
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-forest text-ivory text-[10px] tracking-wider font-semibold uppercase px-3 py-1.5 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-md whitespace-nowrap border border-gold/20">
        Chat with a Vaidya
      </span>
    </a>
  );
}