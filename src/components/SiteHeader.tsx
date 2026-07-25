import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";

export function SiteHeader({ activePage }: { activePage?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-ivory/85 border-b border-gold/20 shadow-sm">
      {/* Top Banner */}
      <div className="bg-forest text-ivory text-[11px] font-medium py-1.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-3">
        <span>✨ 100% Authentic Ayurvedic Formulations · Free Domestic Shipping on Orders ₹499+ ✨</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={brandLogo}
            alt="Thakur Yograj Ayurveda"
            className="h-14 sm:h-16 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm tracking-wide text-forest/80 font-medium">
          <Link
            to="/"
            className={`hover:text-gold transition ${
              activePage === "home" ? "text-gold font-semibold" : ""
            }`}
          >
            Home
          </Link>

          {/* Shop Dropdown */}
          <div className="group relative py-6 -my-6">
            <button className="flex items-center gap-1 hover:text-gold transition cursor-pointer">
              Shop <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-72">
              <div className="rounded-2xl border border-gold/25 bg-ivory shadow-luxe p-4 space-y-2">
                <Link
                  to="/"
                  hash="products"
                  className="block px-3 py-2 rounded-lg hover:bg-gold/10 text-forest hover:text-gold transition"
                >
                  <div className="font-display font-semibold">Hair Care Oils</div>
                  <div className="text-xs text-forest/60">Bhrraj & Amla Regrowth Formulation</div>
                </Link>
                <Link
                  to="/"
                  hash="products"
                  className="block px-3 py-2 rounded-lg hover:bg-gold/10 text-forest hover:text-gold transition"
                >
                  <div className="font-display font-semibold">Pain Relief Oils</div>
                  <div className="text-xs text-forest/60">Dard Nivarak Traditional Blend</div>
                </Link>
                <Link
                  to="/"
                  hash="products"
                  className="block px-3 py-2 rounded-lg hover:bg-gold/10 text-forest hover:text-gold transition"
                >
                  <div className="font-display font-semibold">Combo Ritual Packs</div>
                  <div className="text-xs text-forest/60">Complete Wellness Sets</div>
                </Link>
              </div>
            </div>
          </div>

          <Link
            to="/contact"
            className={`hover:text-gold transition ${
              activePage === "contact" ? "text-gold font-semibold" : ""
            }`}
          >
            Contact
          </Link>
          <Link
            to="/shipping"
            className={`hover:text-gold transition ${
              activePage === "shipping" ? "text-gold font-semibold" : ""
            }`}
          >
            Shipping
          </Link>
          <Link
            to="/returns"
            className={`hover:text-gold transition ${
              activePage === "returns" ? "text-gold font-semibold" : ""
            }`}
          >
            Returns
          </Link>
          <Link
            to="/terms"
            className={`hover:text-gold transition ${
              activePage === "terms" ? "text-gold font-semibold" : ""
            }`}
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className={`hover:text-gold transition ${
              activePage === "privacy" ? "text-gold font-semibold" : ""
            }`}
          >
            Privacy
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* My Orders Button */}
          <Link
            to="/orders"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 hover:border-gold bg-gold/5 hover:bg-gold/15 text-forest text-xs font-semibold uppercase tracking-wider transition"
          >
            <Package className="w-3.5 h-3.5 text-gold" />
            My Orders
          </Link>

          {/* User Profile / Login Sync */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 text-forest hover:bg-gold/10 text-xs font-semibold tracking-wider uppercase transition shrink-0 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-forest text-ivory text-[10px] font-bold flex items-center justify-center">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline">
                  {user.role === "admin" ? "Admin Panel" : user.displayName || "Account"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Profile Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gold/25 bg-ivory shadow-luxe p-4 z-20 space-y-3 text-left">
                    <div className="border-b border-gold/10 pb-2">
                      <div className="font-semibold text-xs text-forest">
                        {user.displayName || "Valued Member"}
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
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-ivory hover:bg-forest-deep text-xs font-semibold uppercase tracking-wider transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-gold" /> Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-forest/80 hover:text-gold transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gold/20 bg-ivory/95 backdrop-blur-xl px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto animate-reveal-up" data-lenis-prevent>
          {/* User Mobile Status */}
          {user ? (
            <div className="p-3 bg-gold/10 rounded-xl border border-gold/20 flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-forest">{user.displayName || "Valued Member"}</div>
                <div className="text-[10px] text-forest/65 truncate">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-amber-800 font-semibold uppercase tracking-wider flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-forest text-ivory text-xs font-semibold uppercase tracking-widest mb-4"
            >
              <LogIn className="w-4 h-4 text-gold" /> Login / Sign Up
            </Link>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-forest font-medium border-b border-gold/10"
          >
            Home
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-medium border-b border-gold/10"
          >
            <PhoneCall className="w-4 h-4 text-gold" /> Contact Us
          </Link>
          <Link
            to="/shipping"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-medium border-b border-gold/10"
          >
            <Truck className="w-4 h-4 text-gold" /> Shipping Policy
          </Link>
          <Link
            to="/returns"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-medium border-b border-gold/10"
          >
            <RotateCcw className="w-4 h-4 text-gold" /> Return & Refund Policy
          </Link>
          <Link
            to="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-medium border-b border-gold/10"
          >
            <FileText className="w-4 h-4 text-gold" /> Terms & Conditions
          </Link>
          <Link
            to="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-medium border-b border-gold/10"
          >
            <ShieldCheck className="w-4 h-4 text-gold" /> Privacy Policy
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-2 text-forest font-semibold text-gold"
          >
            <Package className="w-4 h-4 text-gold" /> View My Orders
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 text-amber-800 font-semibold"
            >
              <LayoutDashboard className="w-4 h-4 text-gold" /> Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
