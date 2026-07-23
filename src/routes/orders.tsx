import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/hooks/use-orders";
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  MapPin,
  PhoneCall,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/orders")({
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <p className="mt-4 text-xs tracking-widest uppercase text-forest/70">Securing Session...</p>
      </div>
    );
  }

  // Filter orders for this user
  const myOrders = orders.filter(
    (o) => o.customerEmail?.toLowerCase() === user.email?.toLowerCase()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-3.5 h-3.5" />;
      case "Processing":
        return <Clock className="w-3.5 h-3.5 animate-pulse" />;
      case "Shipped":
        return <Truck className="w-3.5 h-3.5" />;
      case "Delivered":
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const handleWhatsAppQuery = (orderId: string) => {
    const text = `Hello Thakur Yograj Ayurveda, I would like to inquire about the status of my order ${orderId}.`;
    const url = `https://wa.me/918959568262?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-ivory text-forest py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase font-semibold text-forest/70 hover:text-gold transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sanctuary
        </Link>

        <header className="mb-12">
          <span className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold">Customer Portal</span>
          <h1 className="font-display text-4xl md:text-5xl text-forest mt-2">Your Orders</h1>
          <p className="text-xs md:text-sm text-forest/65 mt-2">
            Track your handcrafted remedies from our farm to your home.
          </p>
        </header>

        {ordersLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : myOrders.length === 0 ? (
          <div className="p-12 text-center rounded-[2.5rem] border border-gold/25 bg-ivory/50 space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto text-gold">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl text-forest font-bold">No Orders Placed Yet</h3>
            <p className="text-xs md:text-sm text-forest/65 leading-relaxed">
              You haven't initiated any wellness rituals yet. Explore our cold-infused oils and natural remedies to begin.
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-3.5 rounded-full bg-forest text-ivory text-xs tracking-widest uppercase font-bold hover:bg-forest-deep transition shadow-md"
            >
              Start Rituals
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {myOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-[2.5rem] border border-gold/20 bg-ivory shadow-luxe p-6 md:p-8 space-y-6"
              >
                {/* Order Top Panel */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gold/15">
                  <div className="space-y-1">
                    <span className="text-[10px] text-forest/50 font-semibold uppercase tracking-wider">Order Reference</span>
                    <h3 className="font-display text-xl text-forest font-bold">{order.id}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/25 text-xs text-forest/80 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span>{order.createdAt}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items Panel */}
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gold/15"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-base text-forest truncate font-semibold">
                          {item.name}
                        </h4>
                        <p className="text-xs text-forest/60 mt-0.5">
                          Quantity: {item.qty} · Price: {item.price}
                        </p>
                      </div>
                      <div className="font-display text-base text-forest font-bold">
                        ₹{(parseInt(item.price.replace(/[^\d]/g, "")) * item.qty).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping and Total Info */}
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gold/15 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-forest">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span>Delivery Details</span>
                    </div>
                    <p className="text-forest/70 leading-relaxed pl-5">
                      <strong>{order.customerName}</strong> · {order.customerPhone} <br />
                      {order.shippingAddress}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between items-end gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-forest/50 font-semibold uppercase tracking-wider">Total amount (COD)</span>
                      <div className="font-display text-3xl text-forest font-bold mt-1">
                        ₹{order.total.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <button
                      onClick={() => handleWhatsAppQuery(order.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-ivory text-[10px] tracking-wider uppercase font-bold hover:bg-emerald-600 transition shadow-sm cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Support Query
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
