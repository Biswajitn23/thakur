import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCartContext } from "@/context/cart-context";
import { useProducts, type ProductItem } from "@/hooks/use-products";
import { AuthModal } from "@/components/AuthModal";
import brandLogo from "@/assets/logo.png";
import {
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  FileText,
  PhoneCall,
  LayoutDashboard,
  LogIn,
  Search,
  ShoppingBag,
  Globe,
  Sparkles,
} from "lucide-react";

interface SiteHeaderProps {
  activePage?: string;
  currencySymbol?: string;
  setCurrencySymbol?: (symbol: string) => void;
  currencyRate?: number;
  setCurrencyRate?: (rate: number) => void;
  onOpenAuthModal?: () => void;
}

export function SiteHeader({
  activePage,
  currencySymbol = "₹",
  setCurrencySymbol,
  currencyRate = 1,
  setCurrencyRate,
  onOpenAuthModal,
}: SiteHeaderProps) {
  const { user, logout } = useAuth();
  const { count: cartCount, openCart } = useCartContext();
  const { products } = useProducts();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Currencies list
  const currencies = [
    { code: "INR", symbol: "₹", rate: 1, label: "INR (₹)" },
    { code: "USD", symbol: "$", rate: 0.012, label: "USD ($)" },
    { code: "EUR", symbol: "€", rate: 0.011, label: "EUR (€)" },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownOpen &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        currencyDropdownOpen &&
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setCurrencyDropdownOpen(false);
      }
      if (
        searchFocused &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen, currencyDropdownOpen, searchFocused]);

  // Live product search filtering
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.concern.toLowerCase().includes(q)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate({ to: "/" });
  };

  const handleLoginClick = () => {
    if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleCurrencySelect = (symbol: string, rate: number) => {
    if (setCurrencySymbol) setCurrencySymbol(symbol);
    if (setCurrencyRate) setCurrencyRate(rate);
    setCurrencyDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-gold/20 shadow-sm">
        {/* Top Announcement Bar */}
        <div className="bg-forest text-ivory text-[11px] font-medium py-1.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-3">
          <span className="truncate">
            ✨ 100% Authentic Ayurvedic Formulations · Free Domestic Shipping on Orders ₹499+ ✨
          </span>
        </div>

        {/* Main Desktop & Mobile Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          {/* Mobile Left: Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-forest hover:text-gold transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 text-forest hover:text-gold transition cursor-pointer"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src={brandLogo}
              alt="Biotique Ayurveda"
              className="h-12 sm:h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-forest/50 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Ayurvedic Hair Oils, Pain Relief & Rituals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full h-10 pl-10 pr-4 rounded-full border border-gold/30 bg-white/80 text-xs font-medium text-forest placeholder:text-forest/45 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-forest/40 hover:text-forest text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Instant Search Suggestions Dropdown */}
            {searchFocused && (searchQuery.trim().length > 0 || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gold/30 bg-white shadow-2xl p-3 z-50 max-h-96 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-widest text-forest/60 px-2 py-1 border-b border-gold/15 mb-2">
                  Matching Products ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-forest/60">
                    No products found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.map((product) => (
                      <Link
                        key={`search-${product.id}`}
                        to="/"
                        search={{ concern: product.concern }}
                        hash="products-list"
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gold/10 transition text-left"
                      >
                        <img
                          src={product.img}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded-lg bg-ivory p-1 border border-gold/20 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-xs text-forest truncate">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-forest/60 truncate">
                            {product.subtitle}
                          </div>
                        </div>
                        <div className="font-display font-extrabold text-xs text-forest shrink-0">
                          {currencySymbol}
                          {Math.round(
                            parseInt(product.price.replace(/[^0-9]/g, ""), 10) * currencyRate
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Currency Selector */}
            <div className="relative hidden sm:block" ref={currencyDropdownRef}>
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 hover:bg-gold/15 text-forest text-xs font-semibold tracking-wider transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-gold" />
                <span>{currencySymbol}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gold/30 bg-white shadow-xl p-1.5 z-50">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleCurrencySelect(curr.symbol, curr.rate)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${currencySymbol === curr.symbol
                          ? "bg-forest text-ivory"
                          : "text-forest hover:bg-gold/10"
                        }`}
                    >
                      <span>{curr.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track Order Link */}
            <Link
              to="/orders"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-gold tracking-wide transition"
            >
              <Package className="w-4 h-4 text-gold" />
              <span>Track Order</span>
            </Link>

            {/* Login / User Account */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 text-forest hover:bg-gold/10 text-xs font-semibold tracking-wider uppercase transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-forest text-ivory text-[10px] font-bold flex items-center justify-center">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline">
                    {user.displayName || "Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gold/25 bg-ivory shadow-luxe p-4 z-50 space-y-3 text-left">
                    <div className="border-b border-gold/10 pb-2">
                      <div className="font-semibold text-xs text-forest">
                        {user.displayName || "Valued Customer"}
                      </div>
                      <div className="text-[10px] text-forest/65 truncate mt-0.5">
                        {user.email}
                      </div>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 text-xs font-semibold text-forest hover:text-gold transition"
                    >
                      <Package className="w-3.5 h-3.5 text-gold" /> My Orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 text-xs font-semibold text-forest hover:text-gold transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-gold" /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left text-xs font-bold text-amber-800 hover:text-amber-900 transition cursor-pointer pt-1 border-t border-gold/10"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoginClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-forest text-ivory hover:bg-forest-deep text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-gold" />
                <span>Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              id="cart-btn-desktop"
              onClick={openCart}
              className="relative p-2.5 rounded-full bg-gold/15 hover:bg-gold/25 border border-gold/30 text-forest transition cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-forest" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3 pt-1 border-t border-gold/15 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Ayurvedic products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gold/30 text-xs font-medium text-forest focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <Search className="w-4 h-4 text-forest/50 absolute left-3 top-3" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((p) => (
                  <Link
                    key={`m-search-${p.id}`}
                    to="/"
                    search={{ concern: p.concern }}
                    hash="products-list"
                    onClick={() => {
                      setMobileSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-ivory text-xs font-bold text-forest"
                  >
                    <img src={p.img} alt={p.name} className="w-8 h-8 object-contain" />
                    <span>{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop Category Navigation Bar */}
        <div className="hidden lg:block bg-forest/95 text-ivory border-t border-gold/20 shadow-inner">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest py-2.5">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="hover:text-gold transition flex items-center gap-1.5"
              >
                <span>All Products</span>
              </Link>
              <Link
                to="/"
                search={{ concern: "hairfall" }}
                hash="products-list"
                className="hover:text-gold transition flex items-center gap-1.5"
              >
                <span>Hair Care</span>
              </Link>
              <Link
                to="/"
                search={{ concern: "pain" }}
                hash="products-list"
                className="hover:text-gold transition flex items-center gap-1.5"
              >
                <span>Pain Relief</span>
              </Link>
              <Link
                to="/"
                search={{ concern: "ritual" }}
                hash="products-list"
                className="hover:text-gold transition flex items-center gap-1.5"
              >
                <span>Combo Rituals</span>
              </Link>
              <Link
                to="/"
                hash="lightning-sale"
                className="text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1 animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lightning Offers</span>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-ivory/80 normal-case font-medium">
              <span>🌿 100% Herbal & Botanical</span>
              <span>🚚 Express Dispatch</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden border-t border-gold/20 bg-ivory/98 backdrop-blur-xl px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-reveal-up"
            data-lenis-prevent
          >
            {user ? (
              <div className="p-3.5 bg-forest/10 rounded-2xl border border-gold/30 flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-forest">
                    {user.displayName || "Valued Member"}
                  </div>
                  <div className="text-[10px] text-forest/65 truncate">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLoginClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-forest text-ivory text-xs font-bold uppercase tracking-widest mb-2 cursor-pointer shadow-md"
              >
                <User className="w-4 h-4 text-gold" /> Login / Create Account
              </button>
            )}

            <div className="space-y-2 pt-2 border-t border-gold/15">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-forest font-bold text-sm border-b border-gold/10"
              >
                Home
              </Link>
              <Link
                to="/"
                search={{ concern: "hairfall" }}
                hash="products-list"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-forest font-semibold text-xs border-b border-gold/10"
              >
                Hair Care Collection
              </Link>
              <Link
                to="/"
                search={{ concern: "pain" }}
                hash="products-list"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-forest font-semibold text-xs border-b border-gold/10"
              >
                Pain Relief Collection
              </Link>
              <Link
                to="/"
                search={{ concern: "ritual" }}
                hash="products-list"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-forest font-semibold text-xs border-b border-gold/10"
              >
                Combo Ritual Sets
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2 text-gold font-bold text-xs border-b border-gold/10"
              >
                <Package className="w-4 h-4 text-gold" /> Track My Orders
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2 text-forest font-medium text-xs border-b border-gold/10"
              >
                <PhoneCall className="w-4 h-4 text-gold" /> Customer Support
              </Link>
              <Link
                to="/shipping"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2 text-forest font-medium text-xs border-b border-gold/10"
              >
                <Truck className="w-4 h-4 text-gold" /> Shipping Policy
              </Link>
              <Link
                to="/returns"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2 text-forest font-medium text-xs border-b border-gold/10"
              >
                <RotateCcw className="w-4 h-4 text-gold" /> Returns & Refunds
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal Portal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
