import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Lock, EyeOff, ChevronRight, HelpCircle, Database, Server } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ivory text-forest flex flex-col font-sans">
      <SiteHeader activePage="privacy" />

      {/* Hero Header */}
      <section className="bg-forest text-ivory py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cfa860_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Confidentiality & Trust
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
            Privacy Policy
          </h1>
          <p className="mt-4 text-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Your privacy is sacred to us. Discover how Thakur Yograj Ayurveda protects your personal information and transactions.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gold/80">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-gold/50" />
            <span className="text-ivory font-medium">Privacy Policy</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
        {/* Three Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Zero Data Selling</h3>
              <p className="text-xs text-forest/70 mt-1">We never sell, rent, or lease your personal data to ad networks.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">256-Bit SSL Encryption</h3>
              <p className="text-xs text-forest/70 mt-1">PCI-DSS compliant bank grade security for all orders & payments.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Full Data Control</h3>
              <p className="text-xs text-forest/70 mt-1">Request access, correction, or deletion of your data anytime.</p>
            </div>
          </div>
        </div>

        {/* Policy Body */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gold/25 shadow-luxe space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">01.</span> Information We Collect
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              When you visit Thakur Yograj Ayurveda, interact with our store, or purchase our products, we collect minimal necessary information to serve you:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li><strong>Contact Information:</strong> Name, shipping & billing address, email address, phone number for delivery confirmation.</li>
              <li><strong>Order Details:</strong> Purchased products, transaction dates, delivery preferences, and order history.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device details, and site usage statistics collected through cookies for performance optimization.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">02.</span> How We Use Your Data
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              We strictly utilize your personal data for legitimate business purposes centered around customer satisfaction:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>Processing, fulfilling, and delivering your order to your designated location.</li>
              <li>Sending order status notifications via SMS, WhatsApp, and email (e.g. order receipt, dispatch tracking).</li>
              <li>Providing responsive customer support via WhatsApp or email when you submit an inquiry.</li>
              <li>Improving our store layout, product formulations, and customer experience.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">03.</span> Payment Security & Third-Party Gateways
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              We prioritize the highest security standards for online checkout. All online payments are handled directly by PCI-DSS compliant, RBI-authorized payment partners (e.g., Razorpay, PhonePe).
            </p>
            <p className="mt-3 text-forest/80 text-sm md:text-base leading-relaxed">
              Thakur Yograj Ayurveda <strong>does not store or have access to your full credit card numbers, CVVs, or bank passwords</strong> on our servers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">04.</span> Sharing with Trusted Partners
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              We share your contact and shipping information solely with essential service partners who enable order fulfillment:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li><strong>Logistics Services:</strong> Courier partners (BlueDart, Delhivery, DTDC) to deliver your physical parcels safely.</li>
              <li><strong>Communication Channels:</strong> WhatsApp Business API for automated tracking and support dispatch.</li>
              <li><strong>Legal Compliance:</strong> If required by applicable law or judicial court order.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">05.</span> Cookies & Preference Management
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Our website uses essential cookies to save items in your shopping cart, preserve session state, and deliver a smooth browsing experience. You may clear or disable cookies in your browser settings, though certain cart features may be affected.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">06.</span> Your Data Rights & Contacting Us
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              You have the right to request access to the personal data we hold about you, request corrections, or request complete account deletion. To exercise your rights or if you have privacy concerns, please contact our Data Protection Officer at:
            </p>
            <div className="mt-4 bg-ivory p-4 rounded-xl border border-gold/20 text-xs font-mono text-forest">
              Email: privacy@thakuryograj.com | WhatsApp: +91 89595 68262
            </div>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="bg-forest text-ivory p-8 rounded-3xl border border-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-gold flex items-center gap-2">
              <Server className="w-5 h-5 text-gold" /> Need Privacy Clarifications?
            </h3>
            <p className="text-ivory/80 text-sm mt-1">We are committed to absolute transparency regarding your data rights.</p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-full bg-gold text-forest font-semibold text-xs uppercase tracking-widest hover:bg-gold-soft transition cursor-pointer shrink-0"
          >
            Contact Privacy Officer
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
