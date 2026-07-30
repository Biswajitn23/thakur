import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Truck, Clock, ShieldCheck, MapPin, ChevronRight, HelpCircle, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — Thakur Yograj" },
      { name: "description", content: "Find out about dispatch times, delivery rates, and reliable shipping options across India for Thakur Yograj Ayurvedic products." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <div className="min-h-screen bg-ivory text-forest flex flex-col font-sans">
      <SiteHeader activePage="shipping" />

      {/* Hero Header */}
      <section className="bg-forest text-ivory py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cfa860_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <Truck className="w-3.5 h-3.5" /> Fast & Reliable Dispatch
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
            Shipping & Delivery Policy
          </h1>
          <p className="mt-4 text-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Delivering authentic Ayurvedic remedies from Chhattisgarh to over 26,000+ PIN codes across India safely and efficiently.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gold/80">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-gold/50" />
            <span className="text-ivory font-medium">Shipping Policy</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
        {/* Highlight Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Free Shipping</h3>
              <p className="text-xs text-forest/70 mt-1">Free delivery across India on all orders above ₹499.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Quick Dispatch</h3>
              <p className="text-xs text-forest/70 mt-1">Packed and shipped within 24 to 48 business hours.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Luxe Eco Packaging</h3>
              <p className="text-xs text-forest/70 mt-1">Protected in shock-resistant eco-friendly cushioned boxes.</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gold/25 shadow-luxe space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">01.</span> Domestic Delivery Timelines
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              We partner with India's most dependable logistics providers—including BlueDart, Delhivery, DTDC, and Speed Post—to ensure your glass bottles arrive safely.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-ivory p-4 rounded-xl border border-gold/20 text-center">
                <div className="text-xs font-semibold uppercase text-gold tracking-wider">Metro Cities</div>
                <div className="font-display text-xl font-bold text-forest mt-1">3 – 4 Days</div>
                <div className="text-[11px] text-forest/60 mt-1">Mumbai, Delhi, Bengaluru, Kolkata, Chennai, Hyderabad</div>
              </div>
              <div className="bg-ivory p-4 rounded-xl border border-gold/20 text-center">
                <div className="text-xs font-semibold uppercase text-gold tracking-wider">Tier 2 & 3 Cities</div>
                <div className="font-display text-xl font-bold text-forest mt-1">4 – 6 Days</div>
                <div className="text-[11px] text-forest/60 mt-1">District headquarters & suburban towns</div>
              </div>
              <div className="bg-ivory p-4 rounded-xl border border-gold/20 text-center">
                <div className="text-xs font-semibold uppercase text-gold tracking-wider">Remote & NE / J&K</div>
                <div className="font-display text-xl font-bold text-forest mt-1">5 – 8 Days</div>
                <div className="text-[11px] text-forest/60 mt-1">Special delivery zones via Speed Post</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">02.</span> Shipping Charges
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-forest/80 list-disc pl-5">
              <li><strong>Orders Above ₹499:</strong> FREE Shipping across all pincodes in India.</li>
              <li><strong>Orders Below ₹499:</strong> Nominal flat shipping fee of ₹49 for standard logistics handling.</li>
              <li><strong>Express Delivery:</strong> Express Air shipping (where available) can be chosen at checkout for expedited transit.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">03.</span> Cash on Delivery (COD) Policy
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              To make authentic Ayurveda accessible to all, we offer Cash on Delivery (COD) across eligible PIN codes up to an order value of ₹3,000.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>Please keep exact cash ready upon delivery for a smooth doorstep handover.</li>
              <li>Our delivery partners do not open parcels before cash collection due to security protocols.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">04.</span> Real-Time Tracking & Updates
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              As soon as your parcel is handed over to the courier:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>You will receive an automated WhatsApp notification and SMS with your AWB tracking number.</li>
              <li>You can view your order progress anytime on our <Link to="/orders" className="text-gold font-semibold underline">My Orders</Link> page.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">05.</span> Damaged or Intact Seal Verification
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Our oil bottles are packaged in heavy-duty amber/clear glass with anti-leak seals. If your package appears tampered with or damaged upon arrival:
            </p>
            <div className="mt-3 bg-ivory p-4 rounded-xl border border-gold/20 text-xs text-forest">
              Do not accept a torn outer box. Take a photo of the box and notify us immediately on WhatsApp (+91 89595 68262) or email support@thakuryograj.com. We will dispatch a free replacement immediately.
            </div>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-forest text-ivory p-8 rounded-3xl border border-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-gold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" /> Want to Track an Existing Shipment?
            </h3>
            <p className="text-ivory/80 text-sm mt-1">Check your dispatch status, tracking AWB number, or delivery date instantly.</p>
          </div>
          <Link
            to="/orders"
            className="px-6 py-3 rounded-full bg-gold text-forest font-semibold text-xs uppercase tracking-widest hover:bg-gold-soft transition cursor-pointer shrink-0"
          >
            Track My Order
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
