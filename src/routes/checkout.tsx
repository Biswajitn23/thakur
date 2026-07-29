import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import brandLogo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/hooks/use-orders";
import { useCoupons } from "@/hooks/use-coupons";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { createCashfreeOrderFn, verifyCashfreeOrderFn } from "@/lib/cashfree-server";
import { getCashfreeInstance } from "@/lib/cashfree";
import { useCartContext } from "@/context/cart-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  CreditCard,
  ShoppingBag,
  Tag,
  AlertCircle,
  Sparkles,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: FullCheckoutPage,
});

function FullCheckoutPage() {
  const { items, removeItem, setQty, subtotal, clearCart } = useCartContext();
  const { createOrder } = useOrders();
  const { coupons } = useCoupons();
  const { settings: storeSettings } = useStoreSettings();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cashfree" | "COD">("Cashfree");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Promo Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountValue: number;
    discountType: "percent" | "flat";
  } | null>(null);

  // Auto pre-fill user info when logged in
  useEffect(() => {
    if (user) {
      if (!customerName && user.displayName) setCustomerName(user.displayName);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Enforce COD availability setting
  useEffect(() => {
    if (!storeSettings.isCodEnabled && paymentMethod === "COD") {
      setPaymentMethod("Cashfree");
    }
  }, [storeSettings.isCodEnabled, paymentMethod]);

  // Calculate discount, delivery fee, GST and final payable total
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percent") {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const deliveryFeeConfig = storeSettings.deliveryFee ?? 49;
  const freeThresholdConfig = storeSettings.freeShippingThreshold ?? 499;
  const gstRate = storeSettings.gstPercentage ?? 18;
  const isGstIncluded = storeSettings.isGstIncluded ?? true;

  const shippingFee = subtotal >= freeThresholdConfig || subtotal === 0 ? 0 : deliveryFeeConfig;
  const taxableBase = Math.max(0, subtotal - discountAmount);

  const gstAmount = isGstIncluded
    ? Math.round(taxableBase - taxableBase / (1 + gstRate / 100))
    : Math.round((taxableBase * gstRate) / 100);

  const finalTotal = isGstIncluded
    ? Math.max(0, taxableBase + shippingFee)
    : Math.max(0, taxableBase + gstAmount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive
    );

    if (matched) {
      if (subtotal < matched.minOrderValue) {
        toast.error(`Minimum order amount for coupon ${matched.code} is ₹${matched.minOrderValue}.`);
        return;
      }
      setAppliedCoupon({
        code: matched.code,
        discountValue: matched.discountValue,
        discountType: matched.discountType,
      });
      toast.success(`Coupon "${matched.code}" applied successfully!`);
      setCouponCodeInput("");
    } else {
      toast.error("Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed.");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to place an order.");
      navigate({ to: "/login" });
      return;
    }

    setPaymentError(null);

    const cleanPhone = customerPhone.replace(/[^\d]/g, "");
    if (cleanPhone.length < 10) {
      const msg = "Please enter a valid 10-digit mobile phone number.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      const msg = "Please enter a complete delivery address (street, city, state & 6-digit pincode).";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    const name = customerName.trim() || user.displayName || "Customer";
    const email = customerEmail.trim() || user.email || "customer@example.com";
    const phone = customerPhone.trim();
    const address = shippingAddress.trim();

    const orderPayloadItems = items.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      img: i.img,
    }));

    if (paymentMethod === "COD") {
      const orderId = await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        userId: user.uid,
      });

      setPlacedOrderId(orderId);
      setOrderSuccess(true);
      clearCart();
      toast.success("Order placed successfully via Cash on Delivery!");
      return;
    }

    // Cashfree Online Payment Flow
    setIsProcessingPayment(true);
    try {
      const res = await createCashfreeOrderFn({
        data: {
          orderAmount: finalTotal,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
        },
      });

      if (!res.success || !res.paymentSessionId) {
        throw new Error(res.error || "Failed to initialize payment order with Cashfree.");
      }

      const cashfree = await getCashfreeInstance();
      if (!cashfree) {
        throw new Error("Unable to load Cashfree checkout SDK. Please try again.");
      }

      console.log("[Cashfree SDK] Initializing checkout with session ID:", res.paymentSessionId);

      // Launch Cashfree Checkout Modal
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: res.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (checkoutResult?.error) {
        throw new Error(checkoutResult.error.message || "Payment cancelled or failed.");
      }

      // Verify Order Status on Server
      const verifyRes = await verifyCashfreeOrderFn({
        data: { orderId: res.orderId || res.cfOrderId || "" },
      });

      const isPaid = verifyRes.paymentStatus === "Paid" || verifyRes.orderStatus === "PAID";

      const orderId = await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "Cashfree",
        paymentStatus: isPaid ? "Paid" : "Pending",
        cfOrderId: res.cfOrderId,
        paymentId: res.orderId,
        userId: user.uid,
      });

      setPlacedOrderId(orderId);
      setOrderSuccess(true);
      clearCart();
      toast.success("Payment completed successfully!");
    } catch (err: any) {
      console.error("Cashfree checkout error:", err);
      const errMsg = err?.message || "Payment could not be completed. Please try again.";
      setPaymentError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Unauthenticated screen
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-stone-900 font-sans">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-amber-900/20 shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full grid place-items-center mx-auto text-3xl">
            🔐
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#082a1c]">Login Required to Checkout</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Please log in or register your account so we can link your shipping address and order receipt to your verified account.
          </p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="w-full py-4 bg-[#082a1c] hover:bg-stone-900 text-[#cfa860] font-bold text-xs uppercase tracking-[0.2em] rounded-full transition shadow-xl cursor-pointer"
          >
            Log In / Register Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#082a1c] font-sans antialiased">
      {/* Top Luxury Ayurvedic Navigation Bar */}
      <header className="bg-ivory/95 backdrop-blur-md border-b border-gold/25 sticky top-0 z-50 shadow-sm px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          {/* Left: Back Link */}
          <div className="w-1/3 flex justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/70 hover:text-gold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">Store</span>
            </Link>
          </div>

          {/* Center: Brand Logo */}
          <div className="w-1/3 flex justify-center">
            <Link to="/">
              <img src={brandLogo} alt="Thakur Yograj" className="h-12 sm:h-14 w-auto drop-shadow-sm transition-all" />
            </Link>
          </div>

          {/* Right: Customer Profile Account Details */}
          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-2 sm:gap-2.5 bg-forest/5 border border-gold/30 px-3 py-1 rounded-full shadow-inner max-w-full">
              <div className="w-7 h-7 rounded-full bg-forest text-gold font-bold text-xs grid place-items-center border border-gold/30 shadow-md shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-bold text-[11px] text-forest leading-tight truncate max-w-[120px]">
                  {user?.displayName || "Customer"}
                </div>
                <div className="text-[9px] text-forest/60 truncate max-w-[120px] font-mono leading-none mt-0.5">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Steps Subbar */}
        <div className="border-t border-gold/15 py-2 flex justify-center bg-ivory/50">
          <div className="flex items-center justify-center gap-4 text-[9px] tracking-[0.2em] text-forest/50 uppercase font-semibold">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("open_cart_on_home", "1");
                navigate({ to: "/" });
              }}
              className="text-forest/70 font-semibold hover:text-gold transition cursor-pointer hover:underline underline-offset-4"
            >1. Shopping Bag</button>
            <span className="text-gold/60">•</span>
            <span className="text-gold font-bold underline underline-offset-4 decoration-2">2. Address & Payment</span>
            <span className="text-gold/60">•</span>
            <span>3. Order Placed</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {orderSuccess ? (
        <div className="max-w-2xl mx-auto my-16 px-6 text-center space-y-6">
          <div className="p-8 bg-white border border-emerald-800/30 rounded-[2.5rem] shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full grid place-items-center mx-auto text-3xl">
              🎉
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#082a1c]">Order Placed Successfully!</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Thank you for choosing Thakur Yograj Ayurveda. Your order confirmation and payment details have been saved under your account (<strong>{user?.email}</strong>).
            </p>
            {placedOrderId && (
              <div className="py-3 px-5 bg-stone-50 border border-stone-150 rounded-2xl inline-flex flex-col items-center gap-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Your Order ID</span>
                <span className="font-mono text-[#082a1c] font-extrabold text-base select-all tracking-wider">{placedOrderId}</span>
              </div>
            )}
            <div className="pt-4 border-t border-stone-100">
              <Link
                to="/"
                className="px-8 py-4 bg-[#082a1c] text-[#cfa860] rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-stone-900 transition shadow-xl"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="max-w-md mx-auto my-20 px-6 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl grid place-items-center mx-auto text-3xl">
            🛍️
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#082a1c]">Your Shopping Bag is Empty</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Explore our traditional botanical remedy collection to start your healing ritual.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-4 bg-[#082a1c] text-[#cfa860] rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-stone-900 transition shadow-xl"
          >
            Explore Remedy Collection
          </Link>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (7 Cols): Account, Delivery Address & Payment */}
            <div className="lg:col-span-7 space-y-6">
              {/* Account Banner */}
              <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-serif text-lg font-bold text-[#082a1c]">Verified Account Session</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300">
                    Logged In
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-stone-900 text-sm">{user?.displayName || "Valued Customer"}</div>
                  <div className="text-stone-500">{user?.email}</div>
                </div>
              </div>

              {/* Form Component */}
              <form id="full-page-checkout-form" onSubmit={handleCheckout} className="space-y-6">
                {/* 1. Delivery Address Card */}
                <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <Truck className="w-5 h-5 text-[#082a1c]" />
                    <h3 className="font-serif text-xl font-bold text-[#082a1c]">1. Shipping & Delivery Address</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        10-Digit Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        placeholder="10-Digit Mobile Number (e.g. 9876543210)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/[^\d]/g, ""))}
                        className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Full Shipping Address & Pincode
                      </label>
                      <textarea
                        required
                        rows={3}
                        minLength={10}
                        placeholder="House / Flat No., Building, Street Name, Landmark, City, State & 6-digit Pincode"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Card */}
                <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <CreditCard className="w-5 h-5 text-[#082a1c]" />
                    <h3 className="font-serif text-xl font-bold text-[#082a1c]">2. Select Payment Method</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Cashfree Online Payment */}
                    <label
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                        paymentMethod === "Cashfree"
                          ? "border-[#082a1c] bg-[#082a1c]/5 shadow-sm"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Cashfree"
                        checked={paymentMethod === "Cashfree"}
                        onChange={() => setPaymentMethod("Cashfree")}
                        className="accent-[#082a1c] w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                          <span>Online Payment (Cashfree Gateway)</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Instant
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          UPI (GPay, PhonePe, Paytm), Credit & Debit Cards, NetBanking & Wallets
                        </p>
                      </div>
                    </label>

                    {/* Cash on Delivery (COD) */}
                    <label
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                        !storeSettings.isCodEnabled
                          ? "opacity-50 border-stone-200 bg-stone-100 cursor-not-allowed"
                          : paymentMethod === "COD"
                          ? "border-[#082a1c] bg-[#082a1c]/5 shadow-sm cursor-pointer"
                          : "border-stone-200 hover:border-stone-300 cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        disabled={!storeSettings.isCodEnabled}
                        checked={paymentMethod === "COD" && storeSettings.isCodEnabled}
                        onChange={() => storeSettings.isCodEnabled && setPaymentMethod("COD")}
                        className="accent-[#082a1c] w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                          <span>Cash on Delivery (COD)</span>
                          {!storeSettings.isCodEnabled && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          {storeSettings.isCodEnabled
                            ? "Pay cash on delivery when your order package arrives at your address"
                            : "Currently disabled by store management. Please select Online Payment (Cashfree)."}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT COLUMN (5 Cols): Order Summary & Detailed Price Breakdown */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <div className="bg-[#fdf8ee] rounded-[2rem] p-6 border-2 border-[#cfa860]/60 shadow-2xl shadow-amber-900/10 space-y-5">
                <div className="flex items-center justify-between border-b-2 border-[#cfa860]/30 pb-3">
                  <h3 className="font-serif text-xl font-bold text-[#082a1c] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#cfa860]" /> Order Summary
                  </h3>
                  <span className="text-xs font-bold text-[#082a1c] bg-[#cfa860]/25 px-3 py-1 rounded-full border border-[#cfa860]/50">
                    {items.reduce((acc, i) => acc + i.qty, 0)} Items
                  </span>
                </div>

                {/* Account Bag Items List with Quantity Controls */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div key={i.name} className="flex gap-3.5 items-center bg-[#faf8f5] p-3 rounded-2xl border border-stone-200/80">
                      <img
                        src={i.img}
                        alt={i.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#cfa860]/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-stone-900 truncate">{i.name}</div>
                        <div className="text-xs text-amber-900 font-bold mt-0.5">{i.price}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQty(i.name, i.qty - 1)}
                            className="w-6 h-6 rounded-full border border-stone-300 grid place-items-center text-stone-700 text-xs hover:bg-stone-200 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-stone-900 w-4 text-center">{i.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(i.name, i.qty + 1)}
                            className="w-6 h-6 rounded-full border border-stone-300 grid place-items-center text-stone-700 text-xs hover:bg-stone-200 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(i.name)}
                            className="ml-auto text-[10px] uppercase font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Improved Promo Code Input Section */}
                <div className="pt-2 border-t border-stone-100">
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo Code (e.g. AYURVEDA20)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:ring-2 focus:ring-[#082a1c]/20 uppercase font-mono transition"
                      />
                      <button
                        type="submit"
                        className="px-4 py-3 bg-[#082a1c] text-[#e5c178] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-900 transition cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <span>🏷️ Coupon <strong>{appliedCoupon.code}</strong> Applied!</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-rose-600 hover:underline uppercase font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown Details Box */}
                <div className="p-4.5 rounded-2xl bg-[#082a1c]/5 border border-[#cfa860]/20 space-y-3 text-xs">
                  <div className="font-serif text-base font-bold text-[#082a1c] border-b border-[#cfa860]/20 pb-2">
                    Price Breakdown & Tax Summary
                  </div>

                  <div className="flex justify-between text-stone-700">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-stone-900">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-700">
                    <span>
                      Delivery Fee{" "}
                      {freeThresholdConfig > 0 && subtotal < freeThresholdConfig && subtotal > 0 && (
                        <span className="text-[10px] text-stone-500 font-normal">
                          (Free over ₹{freeThresholdConfig})
                        </span>
                      )}
                    </span>
                    <span className={shippingFee === 0 ? "text-emerald-700 font-bold uppercase" : "font-bold text-stone-900"}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-700 text-[11px]">
                    <span>GST Tax ({gstRate}%)</span>
                    <span className={isGstIncluded ? "text-emerald-700 font-bold uppercase text-[10px]" : "font-bold text-stone-900"}>
                      {isGstIncluded ? "Included in Price" : `+ ₹${gstAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-900 font-bold border-t border-[#cfa860]/30 pt-3 text-base">
                    <span>Total Amount Payable</span>
                    <span className="font-bold text-2xl text-[#082a1c]">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Form Action Submit Button */}
                <button
                  type="submit"
                  form="full-page-checkout-form"
                  disabled={isProcessingPayment}
                  className="w-full py-4.5 rounded-full bg-[#082a1c] hover:bg-stone-900 text-[#cfa860] text-xs uppercase tracking-[0.25em] font-bold transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#cfa860] border-t-transparent rounded-full animate-spin" />
                      Initializing Payment...
                    </>
                  ) : paymentMethod === "Cashfree" ? (
                    "Pay Now with Cashfree"
                  ) : (
                    "Place Order (COD)"
                  )}
                </button>

                <p className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Guaranteed Authentic & Encrypted Ayurvedic Checkout</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
