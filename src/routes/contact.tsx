import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  PhoneCall,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Clock,
  ChevronRight,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

import { useMessages } from "@/hooks/use-messages";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { sendMessage } = useMessages();
  const whatsappUrl =
    "https://wa.me/918959568262?text=Hello%20Thakur%20Yograj%20Ayurveda%2C%20I%20have%20a%20query%20about%20your%20products.";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderId: "",
    subject: "Product Consultation",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await sendMessage({
        name: form.name,
        email: form.email,
        phone: form.phone || "Not provided",
        subject: form.orderId ? `${form.subject} (Order #${form.orderId})` : form.subject,
        message: form.message,
      });

      toast.success(
        "Thank you for contacting Thakur Yograj Ayurveda! Our Vaidyas will respond to your query within 12-24 business hours."
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        orderId: "",
        subject: "Product Consultation",
        message: "",
      });
    } catch (err) {
      toast.error("Error submitting message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-forest flex flex-col font-sans">
      <SiteHeader activePage="contact" />

      {/* Hero Header */}
      <section className="bg-forest text-ivory py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cfa860_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <MessageSquare className="w-3.5 h-3.5" /> We Are Here For You
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
            Contact Us
          </h1>
          <p className="mt-4 text-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Have questions about our Ayurvedic hair oil, pain relief oils, or your recent order? Reach out to our dedicated care team.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gold/80">
            <span>Home</span>
            <ChevronRight className="w-3 h-3 text-gold/50" />
            <span className="text-ivory font-medium">Contact Us</span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full space-y-16">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* WhatsApp Card */}
          <div className="bg-white p-6 rounded-3xl border border-gold/25 shadow-sm hover:shadow-luxe transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-emerald-800 uppercase">Instant Support</span>
              <h3 className="font-display text-xl font-bold text-forest mt-1">WhatsApp Care</h3>
              <p className="text-xs text-forest/70 mt-2">Chat with our wellness guides for product advice & order status.</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-ivory text-xs font-semibold uppercase tracking-wider transition"
            >
              Chat +91 89595 68262
            </a>
          </div>

          {/* Phone Call Card */}
          <div className="bg-white p-6 rounded-3xl border border-gold/25 shadow-sm hover:shadow-luxe transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest/5 text-gold border border-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-gold uppercase">Direct Helpline</span>
              <h3 className="font-display text-xl font-bold text-forest mt-1">Phone Inquiry</h3>
              <p className="text-xs text-forest/70 mt-2">Mon - Sat: 9:00 AM to 7:00 PM IST</p>
            </div>
            <a
              href="tel:+918959568262"
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-forest hover:bg-forest-deep text-ivory text-xs font-semibold uppercase tracking-wider transition"
            >
              Call +91 89595 68262
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white p-6 rounded-3xl border border-gold/25 shadow-sm hover:shadow-luxe transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest/5 text-gold border border-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-gold uppercase">Official Email</span>
              <h3 className="font-display text-xl font-bold text-forest mt-1">Customer Support</h3>
              <p className="text-xs text-forest/70 mt-2">Send us your detailed queries anytime.</p>
            </div>
            <a
              href="mailto:support@thakuryograj.com"
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-gold/40 hover:bg-gold/10 text-forest text-xs font-semibold uppercase tracking-wider transition"
            >
              support@thakuryograj.com
            </a>
          </div>

          {/* Heritage Office Card */}
          <div className="bg-white p-6 rounded-3xl border border-gold/25 shadow-sm hover:shadow-luxe transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest/5 text-gold border border-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-gold uppercase">Heritage Origin</span>
              <h3 className="font-display text-xl font-bold text-forest mt-1">Headquarters</h3>
              <p className="text-xs text-forest/70 mt-2">Thakur Yograj Ayurveda, Main Road, Bilaspur / Raipur, Chhattisgarh - 492001, India.</p>
            </div>
            <div className="mt-6 text-xs text-forest/60 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold" /> Response in 12-24 hrs
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-gold/25 shadow-luxe">
            <div className="border-b border-gold/20 pb-6 mb-8">
              <h2 className="font-display text-3xl font-bold text-forest">Send Us a Message</h2>
              <p className="text-sm text-forest/70 mt-2">Fill in your details and topic below, and our team will reach out to you directly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                    Order ID (If applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TY-89421"
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                    className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                  Topic of Inquiry <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition cursor-pointer"
                >
                  <option value="Product Consultation">Ayurvedic Product Advice & Consultation</option>
                  <option value="Order Status & Delivery">Order Status & Delivery Query</option>
                  <option value="Returns & Refunds">Returns & Refund Request</option>
                  <option value="Bulk & Wholesale">Bulk Order & Franchise Inquiry</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help you today?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-ivory/60 border border-gold/30 focus:border-gold rounded-xl px-4 py-3 text-sm text-forest outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-forest text-ivory hover:bg-forest-deep text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer flex items-center justify-center gap-2 shadow-luxe disabled:opacity-50"
              >
                {submitting ? (
                  "Sending Message..."
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold" /> Send Inquiry
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: FAQ & Consultation Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-forest text-ivory p-8 rounded-3xl border border-gold/30 space-y-4">
              <span className="text-[10px] tracking-[0.3em] font-semibold text-gold uppercase">Ayurvedic Wisdom</span>
              <h3 className="font-display text-2xl font-bold">Personalized Hair & Body Consultation</h3>
              <p className="text-xs text-ivory/80 leading-relaxed">
                Unsure which oil formulation fits your Dosha type or specific concern (Hair Fall, Scalp Thinning, Knee Pain, Back Stiffness)? Send us a message or chat with us on WhatsApp for free personalized advice.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-gold">
                <CheckCircle className="w-4 h-4" /> 100% Free Herbal Practitioner Advice
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gold/25 shadow-sm space-y-6">
              <h3 className="font-display text-xl font-bold text-forest flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gold" /> Frequently Asked Questions
              </h3>

              <div className="space-y-4 text-xs">
                <div className="border-b border-gold/15 pb-3">
                  <h4 className="font-semibold text-forest text-sm">How fast will my order ship?</h4>
                  <p className="text-forest/70 mt-1">Orders are packed and shipped within 24-48 hours. Standard domestic delivery takes 3 to 5 business days.</p>
                </div>
                <div className="border-b border-gold/15 pb-3">
                  <h4 className="font-semibold text-forest text-sm">How do I initiate a return?</h4>
                  <p className="text-forest/70 mt-1">You can request a return within 15 days of delivery by visiting our <Link to="/returns" className="text-gold underline">Return Policy page</Link> or messaging us on WhatsApp.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-forest text-sm">Is Cash on Delivery available?</h4>
                  <p className="text-forest/70 mt-1">Yes, Cash on Delivery is available across 26,000+ PIN codes in India for orders up to ₹3,000.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
