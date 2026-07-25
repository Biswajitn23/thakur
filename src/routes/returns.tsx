import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RotateCcw, ShieldCheck, RefreshCw, ChevronRight, HelpCircle, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/returns")({
  component: ReturnsPage,
});

function ReturnsPage() {
  const whatsappUrl =
    "https://wa.me/918959568262?text=Hello%20Thakur%20Yograj%20Ayurveda%2C%20I%20would%20like%20to%20request%20a%20return/exchange.";

  return (
    <div className="min-h-screen bg-ivory text-forest flex flex-col font-sans">
      <SiteHeader activePage="returns" />

      {/* Hero Header */}
      <section className="bg-forest text-ivory py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cfa860_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <RotateCcw className="w-3.5 h-3.5" /> Stress-Free Satisfaction
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
            Return & Refund Policy
          </h1>
          <p className="mt-4 text-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Your trust and peace of mind matter most to us. Enjoy our 15-day return policy for sealed Ayurvedic products.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gold/80">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-gold/50" />
            <span className="text-ivory font-medium">Return Policy</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">15-Day Return Window</h3>
              <p className="text-xs text-forest/70 mt-1">Initiate returns within 15 days of parcel delivery.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">100% Full Refund</h3>
              <p className="text-xs text-forest/70 mt-1">Credited to original source or bank account for COD.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Free Reverse Pickup</h3>
              <p className="text-xs text-forest/70 mt-1">Doorstep pickup arranged by our logistics partners.</p>
            </div>
          </div>
        </div>

        {/* Visual Return Step Process */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-gold/25 shadow-luxe space-y-6">
          <h2 className="font-display text-2xl font-bold text-forest text-center">Simple 4-Step Return Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4">
            <div className="bg-ivory/60 p-5 rounded-2xl border border-gold/20 text-center relative">
              <div className="w-8 h-8 rounded-full bg-gold text-forest font-bold text-xs flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-display text-base font-semibold text-forest">Submit Request</h4>
              <p className="text-xs text-forest/70 mt-1">Contact us via WhatsApp (+91 89595 68262) or Contact Page with Order ID.</p>
            </div>
            <div className="bg-ivory/60 p-5 rounded-2xl border border-gold/20 text-center relative">
              <div className="w-8 h-8 rounded-full bg-gold text-forest font-bold text-xs flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-display text-base font-semibold text-forest">Reverse Pickup</h4>
              <p className="text-xs text-forest/70 mt-1">Our courier agent picks up the unopened package from your doorstep.</p>
            </div>
            <div className="bg-ivory/60 p-5 rounded-2xl border border-gold/20 text-center relative">
              <div className="w-8 h-8 rounded-full bg-gold text-forest font-bold text-xs flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-display text-base font-semibold text-forest">Quality Inspection</h4>
              <p className="text-xs text-forest/70 mt-1">Inspected at our facility within 48 hours to confirm seal integrity.</p>
            </div>
            <div className="bg-ivory/60 p-5 rounded-2xl border border-gold/20 text-center relative">
              <div className="w-8 h-8 rounded-full bg-gold text-forest font-bold text-xs flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="font-display text-base font-semibold text-forest">Instant Refund</h4>
              <p className="text-xs text-forest/70 mt-1">Refund processed to bank/UPI within 3 to 5 business days.</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gold/25 shadow-luxe space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">01.</span> Return Eligibility Guidelines
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Due to strict health and personal care hygiene standards for Ayurvedic oil products, items must satisfy the following criteria to be eligible for return:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>The glass bottle must be unused, unopened, and sealed with original protective shrink neck seals intact.</li>
              <li>The outer printed box packaging and included herbal guide leaflets must be returned in good condition.</li>
              <li>Return request must be initiated within 15 days of confirmed doorstep delivery.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">02.</span> Damaged, Defective or Incorrect Items
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              We take extreme care in bubble wrapping and boxing glass bottles. However, if your order arrives broken, leaking, or with wrong items:
            </p>
            <div className="mt-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <strong>Instant Guarantee:</strong> Share a photograph/video of the parcel on WhatsApp (+91 89595 68262) within 48 hours of receipt. We will dispatch a 100% free replacement bottle immediately without waiting for reverse pickup inspection.
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">03.</span> Refund Mode & Timelines
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Once your return parcel passes quality inspection at our Chhattisgarh facility:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li><strong>Prepaid Orders (Cards, NetBanking, UPI):</strong> Refund credited back to original payment source within 3-5 business days.</li>
              <li><strong>Cash on Delivery (COD) Orders:</strong> Refund transferred via UPI (GPay/PhonePe/Paytm) or NEFT Bank Transfer according to your preference.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">04.</span> Order Cancellations
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              You may cancel an order anytime before it is dispatched from our warehouse by visiting <Link to="/orders" className="text-gold font-semibold underline">My Orders</Link> or contacting support. Prepaid cancelled orders will receive 100% immediate refund.
            </p>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-forest text-ivory p-8 rounded-3xl border border-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-gold flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-gold" /> Ready to Initiate a Return or Exchange?
            </h3>
            <p className="text-ivory/80 text-sm mt-1">Our support team on WhatsApp will guide you step by step in under 2 minutes.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-gold text-forest font-semibold text-xs uppercase tracking-widest hover:bg-gold-soft transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            Start WhatsApp Return <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
