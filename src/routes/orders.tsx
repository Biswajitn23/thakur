import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/hooks/use-orders";
import { verifyCashfreeOrderFn } from "@/lib/cashfree-server";
import { toast } from "sonner";
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

function parseDateString(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  try {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const month = months[monthStr.toLowerCase().substring(0, 3)] ?? 0;
      return new Date(year, month, day);
    }
  } catch (e) {}
  return new Date();
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sat/Sun
      added++;
    }
  }
  return result;
}

const formatDateToIN = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading, updateOrderPayment } = useOrders();
  const navigate = useNavigate();

  // Auto-verify pending Cashfree orders to catch recovery link payments
  useEffect(() => {
    if (!ordersLoading && orders.length > 0) {
      const pendingCashfree = orders.filter(
        (o) => o.paymentMethod === "Cashfree" && o.paymentStatus === "Pending" && o.paymentId
      );

      pendingCashfree.forEach(async (order) => {
        try {
          console.log(`[Auto-verify] Checking payment status for order ${order.id} (Cashfree ID: ${order.paymentId})...`);
          const verifyRes = await verifyCashfreeOrderFn({
            data: { orderId: order.paymentId! },
          });
          if (verifyRes.success && (verifyRes.paymentStatus === "Paid" || verifyRes.orderStatus === "PAID")) {
            await updateOrderPayment(order.id, "Paid", order.paymentId, verifyRes.paymentTxnId, verifyRes.paymentModeDetails);
            toast.success(`Payment verified! Order ${order.id} status updated to Paid.`);
          }
        } catch (err) {
          console.warn(`[Auto-verify] Failed to check status for order ${order.id}:`, err);
        }
      });
    }
  }, [orders, ordersLoading]);

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
            {myOrders.map((order) => {
              const placedDate = order.placedAt || order.createdAt;
              const dPlaced = parseDateString(placedDate);

              let dProcessing = order.processingAt ? parseDateString(order.processingAt) : null;
              let dShipped = order.shippedAt ? parseDateString(order.shippedAt) : null;
              let dDelivered = order.deliveredAt ? parseDateString(order.deliveredAt) : null;

              // Calculate default fallbacks for completed stages
              if (["Processing", "Shipped", "Delivered"].includes(order.status) && !dProcessing) {
                dProcessing = addBusinessDays(dPlaced, 1);
              }
              if (["Shipped", "Delivered"].includes(order.status) && !dShipped) {
                dShipped = addBusinessDays(dPlaced, 2);
              }
              if (order.status === "Delivered" && !dDelivered) {
                dDelivered = addBusinessDays(dPlaced, 5);
              }

              // Ensure chronological ordering (no step can be in the future relative to a completed subsequent step)
              if (dDelivered) {
                if (dShipped && dShipped > dDelivered) dShipped = new Date(dDelivered);
                if (dProcessing && dProcessing > dDelivered) dProcessing = new Date(dDelivered);
              }
              if (dShipped) {
                if (dProcessing && dProcessing > dShipped) dProcessing = new Date(dShipped);
              }

              const processingDate = dProcessing ? formatDateToIN(dProcessing) : null;
              const shippedDate = dShipped ? formatDateToIN(dShipped) : null;
              const deliveredDate = dDelivered ? formatDateToIN(dDelivered) : null;

              return (
                <div
                  key={order.id}
                  className="rounded-[2.5rem] border border-gold/20 bg-ivory shadow-luxe p-6 md:p-8 space-y-6"
                >
                {/* Order Top Panel */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gold/15">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-forest/50 font-semibold uppercase tracking-wider">Order Reference</span>
                    <h3 className="font-sans text-base text-forest font-bold tracking-wide">
                      {order.id.startsWith("ORD-") || order.id.startsWith("TY-")
                        ? order.id
                        : `#${order.id.slice(-6).toUpperCase()}`}
                    </h3>
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

                {/* Progress Stepper */}
                {order.status === "Cancelled" ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 text-xs">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="text-left">
                      <span className="font-bold uppercase tracking-wider block text-[10px]">Order Cancelled</span>
                      <p className="text-red-700/80 mt-0.5">This order has been cancelled and will not be processed.</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border-b border-gold/15">
                    {/* Stepper container */}
                    <div className="relative flex items-center justify-between w-full max-w-lg mx-auto isolate px-4">
                      {/* Connecting Line Background */}
                      <div className="absolute left-4 right-4 top-4 h-[2px] bg-stone-200/80 -z-10" />
                      
                      {/* Connecting Line Progress */}
                      <div 
                        className="absolute left-4 top-4 h-[2px] bg-gold transition-all duration-500 -z-10" 
                        style={{
                          width: 
                            order.status === "Delivered" ? "calc(100% - 32px)" :
                            order.status === "Shipped" ? "66.6%" :
                            order.status === "Processing" ? "33.3%" : "0%"
                        }}
                      />

                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                          ["Pending", "Processing", "Shipped", "Delivered"].includes(order.status)
                            ? "bg-gold border-gold text-ivory shadow-md shadow-gold/20"
                            : "bg-white border-stone-200 text-stone-400"
                        }`}>
                          ✓
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-forest/70 block">Placed</span>
                        {placedDate && (
                          <span className="text-[9px] text-forest/50 font-semibold font-sans block">{placedDate}</span>
                        )}
                      </div>

                      {/* Step 2: Processing */}
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                          ["Processing", "Shipped", "Delivered"].includes(order.status)
                            ? "bg-gold border-gold text-ivory shadow-md shadow-gold/20"
                            : order.status === "Pending"
                              ? "bg-white border-gold text-gold animate-pulse"
                              : "bg-white border-stone-200 text-stone-400"
                        }`}>
                          {["Processing", "Shipped", "Delivered"].includes(order.status) ? "✓" : "2"}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-forest/70 block">Processing</span>
                        {processingDate && (
                          <span className="text-[9px] text-forest/50 font-semibold font-sans block">{processingDate}</span>
                        )}
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                          ["Shipped", "Delivered"].includes(order.status)
                            ? "bg-gold border-gold text-ivory shadow-md shadow-gold/20"
                            : order.status === "Processing"
                              ? "bg-white border-gold text-gold animate-pulse"
                              : "bg-white border-stone-200 text-stone-400"
                        }`}>
                          {["Shipped", "Delivered"].includes(order.status) ? "✓" : "3"}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-forest/70 block">Shipped</span>
                        {shippedDate && (
                          <span className="text-[9px] text-forest/50 font-semibold font-sans block">{shippedDate}</span>
                        )}
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                          order.status === "Delivered"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-250"
                            : order.status === "Shipped"
                              ? "bg-white border-gold text-gold animate-pulse"
                              : "bg-white border-stone-200 text-stone-400"
                        }`}>
                          {order.status === "Delivered" ? "✓" : "4"}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-forest/70 block">Delivered</span>
                        {deliveredDate && (
                          <span className="text-[9px] text-forest/50 font-semibold font-sans block">{deliveredDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                      <div className="font-sans text-base text-forest font-bold">
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
                  <div className="flex flex-col justify-between items-end gap-4 text-right font-sans">
                    <div>
                      <span className="text-[10px] text-forest/50 font-semibold uppercase tracking-wider">
                        Total amount ({order.paymentMethod === "Cashfree" ? "Online Pay" : "COD"})
                      </span>
                      <div className="font-sans text-3xl text-forest font-bold mt-1">
                        ₹{order.total.toLocaleString("en-IN")}
                      </div>
                      {order.paymentMethod === "Cashfree" && (
                        <div className="mt-1.5 flex justify-end">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border ${
                            order.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : "bg-amber-50 text-amber-700 border-amber-250"
                          }`}>
                            Payment: {order.paymentStatus || "Pending"}
                          </span>
                        </div>
                      )}
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
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
