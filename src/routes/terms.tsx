import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileText, Shield, Scale, ChevronRight, HelpCircle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Thakur Yograj" },
      { name: "description", content: "Read the official terms of service, conditions, and usage policies for the Thakur Yograj website and authentic Ayurvedic store." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory text-forest flex flex-col font-sans">
      <SiteHeader activePage="terms" />

      {/* Hero Header */}
      <section className="bg-forest text-ivory py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cfa860_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <FileText className="w-3.5 h-3.5" /> Official Policy Document
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using our services or ordering authentic Ayurvedic products from Thakur Yograj Ayurveda.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gold/80">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-gold/50" />
            <span className="text-ivory font-medium">Terms & Conditions</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
        {/* Highlight Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">100% Authentic</h3>
              <p className="text-xs text-forest/70 mt-1">Hand-crafted formulations in Chhattisgarh following Ayurvedic texts.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Fair Pricing</h3>
              <p className="text-xs text-forest/70 mt-1">Transparent pricing inclusive of GST with no hidden charges.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest/5 text-gold border border-gold/30 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-forest">Consumer Protection</h3>
              <p className="text-xs text-forest/70 mt-1">Fully compliant with Indian E-Commerce Consumer Regulations.</p>
            </div>
          </div>
        </div>

        {/* Legal Text Sections */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gold/25 shadow-luxe space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">01.</span> Agreement to Terms
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              By accessing, browsing, or making a purchase on the Thakur Yograj Ayurveda website (the "Site"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not access or use our website.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">02.</span> Product Authenticity & Natural Variation
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Thakur Yograj Ayurveda specializes in 100% natural Ayurvedic hair care and topical pain relief oils made from cold-pressed sesame oils and authentic botanicals (Bhrraj, Amla, Eucalyptus, etc.). Because our products are hand-crafted without artificial dyes, synthetic fragrances, or mineral oils:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>Natural variations in color, herbal aroma, and consistency across seasonal batches are normal and expected.</li>
              <li>Sedimentation of fine herb particles at the bottom of glass bottles is proof of authentic herbal extraction and does not impair product efficacy.</li>
              <li>Always store products in a cool, dry place away from direct sunlight.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">03.</span> Orders, Pricing & Taxes
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              All prices displayed on the website are in Indian Rupees (INR ₹) and are inclusive of applicable Goods and Services Tax (GST).
            </p>
            <ul className="mt-3 space-y-2 text-sm text-forest/80 list-disc pl-5">
              <li>We reserve the right to modify prices or discontinue products at any time without prior notice.</li>
              <li>An order confirmation sent via email or WhatsApp does not signify our final acceptance of your order. We reserve the right to limit quantities or refuse service if fraudulent activity is suspected.</li>
              <li>Free domestic shipping applies to eligible orders totaling ₹499 or more after any promotional discounts.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">04.</span> Health & Usage Disclaimer
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              Our Ayurvedic products are formulated for topical application (hair oiling, scalp therapy, and joint/muscle massage). They are not intended for internal consumption or oral ingestion.
            </p>
            <p className="mt-3 text-forest/80 text-sm md:text-base leading-relaxed">
              The information provided on this website is for educational and wellness purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. If you are pregnant, nursing, have a pre-existing skin condition, or have severe allergies, please conduct a patch test or consult a qualified physician prior to use.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">05.</span> Intellectual Property Rights
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              All content on this website, including logos, brand name "Thakur Yograj", text, graphics, product photography, formulation descriptions, and software, is the exclusive property of Thakur Yograj Ayurveda and is protected under Indian Intellectual Property laws. Unauthorized copying or redistribution is strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-forest border-b border-gold/20 pb-3 flex items-center gap-2">
              <span className="text-gold font-sans text-sm font-semibold uppercase tracking-wider">06.</span> Governing Law & Disputes
            </h2>
            <p className="mt-4 text-forest/80 text-sm md:text-base leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with the use of this website or purchases shall be subject to the exclusive jurisdiction of the competent courts in Bilaspur / Raipur, Chhattisgarh, India.
            </p>
          </div>
        </div>

        {/* Need Help Box */}
        <div className="bg-forest text-ivory p-8 rounded-3xl border border-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-gold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gold" /> Have Questions Regarding Our Terms?
            </h3>
            <p className="text-ivory/80 text-sm mt-1">Our support team is available on WhatsApp and email to assist you with any legal or order queries.</p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-full bg-gold text-forest font-semibold text-xs uppercase tracking-widest hover:bg-gold-soft transition cursor-pointer shrink-0"
          >
            Contact Support
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
