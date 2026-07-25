import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import brandLogo from "@/assets/logo.png";
import { Mail, ArrowRight, ShieldCheck, Truck, RefreshCw, MessageSquare } from "lucide-react";

export function SiteFooter() {
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const whatsappUrl =
    "https://wa.me/918959568262?text=Hello%20Thakur%20Yograj%20Ayurveda%2C%20I%20have%20a%20query%20about%20your%20products.";

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    toast.success(
      "Thank you for subscribing! Check your inbox for our latest Ayurvedic guides and exclusive offers."
    );
    setSubscribeEmail("");
  };

  return (
    <footer className="bg-ivory pt-20 pb-10 border-t border-gold/20 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Trust Badges Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-16 border-b border-gold/20 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/5 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-forest">100% Ayurvedic</div>
              <div className="text-xs text-forest/60">Pure Cold-Pressed Herbs</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/5 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-forest">Free Shipping</div>
              <div className="text-xs text-forest/60">On Orders Above ₹499</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/5 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-forest">15-Day Return</div>
              <div className="text-xs text-forest/60">Hassle-Free Refunds</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/5 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-forest">WhatsApp Care</div>
              <div className="text-xs text-forest/60">Instant Expert Guidance</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Link to="/">
              <img src={brandLogo} alt="Thakur Yograj" className="h-20 w-auto" />
            </Link>
            <p className="mt-6 max-w-sm text-forest/70 text-sm leading-relaxed">
              Luxury Ayurvedic wellness, hand-crafted in Chhattisgarh. Rooted in traditional herbal wisdom, refined for modern living.
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
              <button
                type="submit"
                className="px-5 py-3 rounded-full bg-forest text-ivory text-xs tracking-[0.2em] uppercase hover:bg-forest-deep transition cursor-pointer flex items-center gap-1"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Shop Links */}
          <div className="md:col-span-2">
            <div className="text-xs tracking-[0.3em] uppercase font-semibold text-forest/50">Shop</div>
            <ul className="mt-4 space-y-3 text-sm text-forest/80">
              <li>
                <Link to="/" hash="products" className="hover:text-gold transition">
                  Hair Oil
                </Link>
              </li>
              <li>
                <Link to="/" hash="products" className="hover:text-gold transition">
                  Pain Relief Oil
                </Link>
              </li>
              <li>
                <Link to="/" hash="products" className="hover:text-gold transition">
                  Combo Packs
                </Link>
              </li>
              <li>
                <Link to="/" hash="products" className="hover:text-gold transition">
                  Gift Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2">
            <div className="text-xs tracking-[0.3em] uppercase font-semibold text-forest/50">Company</div>
            <ul className="mt-4 space-y-3 text-sm text-forest/80">
              <li>
                <Link to="/" hash="story" className="hover:text-gold transition">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/" hash="ingredients" className="hover:text-gold transition">
                  Ingredients
                </Link>
              </li>
              <li>
                <Link to="/" hash="process" className="hover:text-gold transition">
                  Process
                </Link>
              </li>
              <li>
                <Link to="/" hash="journal" className="hover:text-gold transition">
                  Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="md:col-span-3">
            <div className="text-xs tracking-[0.3em] uppercase font-semibold text-forest/50">Support & Policies</div>
            <ul className="mt-4 space-y-3 text-sm text-forest/80">
              <li>
                <Link to="/contact" className="hover:text-gold transition flex items-center gap-1.5 font-medium">
                  Contact Us <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-gold transition flex items-center gap-1.5 font-medium">
                  Shipping Policy <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-gold transition flex items-center gap-1.5 font-medium">
                  Return & Refund Policy <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition text-emerald-700 font-medium"
                >
                  WhatsApp Care (+91 89595 68262)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 gold-divider" />

        {/* Bottom copyright & legal routes */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-forest/65">
          <div>© {new Date().getFullYear()} Thakur Yograj Ayurveda · Made with pride in India</div>
          <div className="flex items-center gap-6 tracking-widest uppercase font-medium">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Follow us on Instagram: @ThakurYograjAyurveda (Official handle coming soon!)");
              }}
              className="hover:text-gold transition cursor-pointer"
            >
              Instagram
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold transition"
            >
              WhatsApp
            </a>
            <Link to="/privacy" className="hover:text-gold transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gold transition">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
