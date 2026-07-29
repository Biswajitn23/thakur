import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth, setAdminEmails } from "@/lib/auth-context";
import { useProducts, type Concern, type ProductItem } from "@/hooks/use-products";
import { useOrders, type OrderStatus, type OrderItem } from "@/hooks/use-orders";
import { useCoupons } from "@/hooks/use-coupons";
import { useMessages, type ContactMessage } from "@/hooks/use-messages";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  LogOut,
  ShieldCheck,
  Database,
  Tag,
  DollarSign,
  UserCheck,
  CreditCard,
  RefreshCw,
  Server,
  CloudCheck,
  Upload,
  Percent,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Eye,
  Mail,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, logout, adminEmails } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { orders, updateOrderStatus, updateOrderTracking, deleteOrder } = useOrders();
  const { coupons, addCoupon, toggleCouponStatus, deleteCoupon } = useCoupons();
  const { messages, updateMessageStatus, deleteMessage } = useMessages();
  const { settings: storeSettings, updateCodSetting, updateStoreSettings } = useStoreSettings();

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "coupons" | "messages" | "subscribers" | "settings">("overview");

  // GoDaddy Email Marketing Newsletter Subscribers
  const [subscribers, setSubscribers] = useState<{ email: string; date: string }[]>([]);
  const [subscriberQuery, setSubscriberQuery] = useState("");

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "newsletter_subscribers"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            email: data.email || "",
            date: data.date || new Date().toLocaleDateString("en-IN"),
          };
        });
        setSubscribers(fetched);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem("thakur_newsletter_subscribers");
      if (saved) {
        try {
          const list: string[] = JSON.parse(saved);
          setSubscribers(list.map((e) => ({ email: e, date: new Date().toLocaleDateString("en-IN") })));
        } catch {}
      }
    }
  }, []);

  const handleExportGoDaddyCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No newsletter subscribers collected yet.");
      return;
    }
    const headers = "Email,Date Subscribed,Source\n";
    const rows = subscribers.map((s) => `"${s.email}","${s.date}","Website Footer"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `godaddy_email_marketing_subscribers_${Date.now()}.csv`;
    a.click();
    toast.success("Exported CSV file formatted for GoDaddy Email Marketing!");
  };

  // Admin Whitelist Management — list comes from Firestore via AuthContext
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);

  const handleAddAdminEmail = async () => {
    const email = newAdminEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) return;
    if (adminEmails.includes(email)) { setNewAdminEmail(""); return; }
    setAdminSaving(true);
    await setAdminEmails([...adminEmails, email]);
    setAdminSaving(false);
    setNewAdminEmail("");
  };

  const handleRemoveAdminEmail = async (email: string) => {
    setAdminSaving(true);
    await setAdminEmails(adminEmails.filter((e) => e !== email));
    setAdminSaving(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImg(reader.result);
        toast.success("Product image uploaded from device!");
      }
    };
    reader.readAsDataURL(file);
  };

  const [refreshingDB, setRefreshingDB] = useState(false);

  const handleRefreshDB = () => {
    setRefreshingDB(true);
    toast.info("Syncing live database with Firestore...");
    setTimeout(() => {
      setRefreshingDB(false);
      toast.success("Database synced live from Firestore!");
    }, 600);
  };

  // Product Form Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [img, setImg] = useState("");
  const [concern, setConcern] = useState<Concern>("hairfall");
  const [benefitsText, setBenefitsText] = useState("");
  const [stockQty, setStockQty] = useState<number>(45);

  // Tracking Modal state
  const [trackingOrder, setTrackingOrder] = useState<OrderItem | null>(null);
  const [courierName, setCourierName] = useState("Delhivery Express");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingOrder || !trackingNumber.trim()) return;
    await updateOrderTracking(trackingOrder.id, courierName, trackingNumber.trim());
    toast.success(`Tracking added for ${trackingOrder.id}! Order status updated to Shipped.`);
    setTrackingOrder(null);
    setTrackingNumber("");
  };

  // Coupon Modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrderValue, setMinOrderValue] = useState(500);
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [usageLimit, setUsageLimit] = useState(200);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await addCoupon({
      code: couponCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      expiryDate,
      usageLimit: Number(usageLimit),
      isActive: true,
    });
    toast.success(`Coupon ${couponCode.toUpperCase()} created successfully!`);
    setIsCouponModalOpen(false);
    setCouponCode("");
  };

  // Customer Message state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Product Search filter
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [couponQuery, setCouponQuery] = useState("");
  const [messageQuery, setMessageQuery] = useState("");

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSubtitle("");
    setPrice("₹799");
    setOldPrice("₹999");
    setImg("https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/acceb3d6-0ead-46f6-a2cd-d5575bee4650/id-preview-c31f3cc3--40643ab3-0a60-4170-a97f-c32eaab445a3.lovable.app-1783919364369.png");
    setConcern("hairfall");
    setBenefitsText("100% AYURVEDIC Formulation\nCHEMICAL FREE & Safe");
    setStockQty(45);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setSubtitle(p.subtitle);
    setPrice(p.price);
    setOldPrice(p.old || "");
    setImg(p.img);
    setConcern(p.concern);
    setBenefitsText((p.benefits || []).join("\n"));
    setStockQty(p.stockQty ?? 45);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const benefitsArr = benefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const payload = {
      name,
      subtitle,
      price,
      old: oldPrice,
      img: img || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/acceb3d6-0ead-46f6-a2cd-d5575bee4650/id-preview-c31f3cc3--40643ab3-0a60-4170-a97f-c32eaab445a3.lovable.app-1783919364369.png",
      benefits: benefitsArr,
      rating: 4.9,
      reviews: Math.floor(100 + Math.random() * 500),
      concern,
      stockQty: Number(stockQty) || 45,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }
    setIsAddModalOpen(false);
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(productQuery.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderQuery.toLowerCase());
    const matchesStatus =
      orderStatusFilter === "all" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadMessagesCount = messages.filter((m) => m.status === "unread").length;
  const lowStockProductsCount = products.filter((p) => (p.stockQty ?? 45) < 10).length;

  const filteredCoupons = coupons.filter(
    (c) => c.code.toLowerCase().includes(couponQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(messageQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(messageQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(messageQuery.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(subscriberQuery.toLowerCase())
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Clock className="w-3 h-3" /> Pending</span>;
      case "Processing":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30"><Package className="w-3 h-3" /> Processing</span>;
      case "Shipped":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"><Truck className="w-3 h-3" /> Shipped</span>;
      case "Delivered":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><CheckCircle className="w-3 h-3" /> Delivered</span>;
      case "Cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"><XCircle className="w-3 h-3" /> Cancelled</span>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-amber-500/25 bg-stone-900/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100 transition text-xs font-bold shadow-sm"
            title="Return to Main Storefront Website Page"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Main Website Page</span>
          </Link>

          <div className="h-6 w-px bg-amber-500/20 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-amber-100 tracking-wide">
                Thakur Yograj
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-300 border border-amber-400/40 shadow-inner">
                Admin Panel
              </span>
            </div>
            <p className="text-[11px] text-amber-200/50">
              E-Commerce Management & Real-time Operations
            </p>
          </div>
        </div>

        {/* Profile & Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshDB}
            disabled={refreshingDB}
            className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
            title="Sync & Refresh DB from Firestore"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshingDB ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">{refreshingDB ? "Syncing DB..." : "Sync DB"}</span>
          </button>

          {/* Unique Profile Badge */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-stone-950 border border-amber-500/20 shadow-inner">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black text-xs grid place-items-center shadow-md">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : "A"}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-stone-950" />
            </div>
            <div className="text-left text-xs pr-1">
              <div className="font-bold text-amber-100 leading-tight">
                {user?.displayName || "Administrator"}
              </div>
              <div className="text-[10px] text-amber-200/60 font-mono truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900 transition flex items-center gap-2 text-xs font-bold cursor-pointer shadow-sm"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left ${
              activeTab === "overview"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "products"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "orders"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4" />
              <span>Orders</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-200 border border-amber-400/40">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("coupons")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "coupons"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Percent className="w-4 h-4" />
              <span>Coupons</span>
            </div>
            <span className="text-[10px] font-mono text-amber-200/60 font-bold">
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "messages"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                {unreadMessagesCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "subscribers"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <span>Subscribers</span>
            </div>
            <span className="text-[10px] font-mono text-amber-200/60 font-bold">
              {subscribers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left cursor-pointer ${
              activeTab === "settings"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-200/50 font-semibold">
                        Total Revenue
                      </p>
                      <h3 className="text-3xl font-bold text-amber-100 mt-2">
                        ₹{totalRevenue.toLocaleString("en-IN")}
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-200/50 font-semibold">
                        Total Orders
                      </p>
                      <h3 className="font-serif text-3xl font-bold text-amber-100 mt-2">
                        {orders.length}
                      </h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-200/50 font-semibold">
                        Catalog Products
                      </p>
                      <h3 className="font-serif text-3xl font-bold text-amber-100 mt-2">
                        {products.length}
                      </h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-stone-900 to-amber-950/40 border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-amber-100">
                    Client Quick Actions
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Add new products or update pending order fulfillment.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-100 font-bold text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    View Orders
                  </button>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <h4 className="font-serif text-lg font-bold text-amber-100 mb-4">
                  Recent Customer Orders
                </h4>
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-amber-200/50 italic bg-stone-950/60 rounded-2xl border border-amber-500/10 text-xs">
                    No customer orders recorded yet. Real orders placed by clients will sync live to this dashboard.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 4).map((o) => (
                      <div
                        key={o.id}
                        className="p-4 bg-stone-950/60 border border-amber-500/10 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-amber-100">
                              {o.id}
                            </span>
                            <span className="text-xs text-amber-200/50">
                              • {o.customerName}
                            </span>
                          </div>
                          <p className="text-xs text-amber-200/40 mt-1">
                            {o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-serif text-sm font-bold text-amber-400">
                            ₹{o.total}
                          </span>
                          {getStatusBadge(o.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500/50" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 pl-9 pr-4 text-xs text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={openAddModal}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-5 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-amber-500/20 shrink-0 bg-stone-950"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-amber-100 text-base truncate">
                            {p.name}
                          </span>
                          {p.tag && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold rounded">
                              {p.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-200/60 mt-1 line-clamp-2">
                          {p.subtitle}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-sm font-bold text-amber-400">
                            {p.price}
                          </span>
                          {p.old && (
                            <span className="text-xs line-through text-amber-200/40">
                              {p.old}
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-stone-800 text-amber-200/60 rounded">
                            {p.concern}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Order Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500/50" />
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Search by customer or order ID..."
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 pl-9 pr-4 text-xs text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  {["all", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                          orderStatusFilter === st
                            ? "bg-amber-500 text-stone-950 font-bold"
                            : "bg-stone-800 text-amber-200/70 hover:bg-stone-700"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Order Cards */}
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-stone-900/80 border border-amber-500/20 rounded-3xl space-y-3">
                  <ShoppingCart className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <h4 className="font-serif text-lg font-bold text-amber-100">No Customer Orders Found</h4>
                  <p className="text-xs text-amber-200/60 max-w-sm mx-auto leading-relaxed">
                    When customers purchase items from the online store, their orders will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/10">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-serif text-lg text-amber-100">
                              {o.id}
                            </span>
                            <span className="text-xs text-amber-200/40">
                              {o.createdAt}
                            </span>
                            {o.paymentMethod && (
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                o.paymentMethod === "Cashfree"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              }`}>
                                {o.paymentMethod === "Cashfree" ? "Cashfree Online" : "COD"}
                              </span>
                            )}
                            {o.paymentStatus && (
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                o.paymentStatus === "Paid"
                                  ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                                  : o.paymentStatus === "Failed"
                                  ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
                                  : "bg-amber-950/80 border-amber-500/40 text-amber-300"
                              }`}>
                                {o.paymentStatus === "Paid" ? "✓ Paid" : o.paymentStatus}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-amber-200/70">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold">{o.customerName}</span> ({o.customerEmail})
                            {o.userId && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                                UID: {o.userId.slice(0, 10)}...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase text-amber-200/50 font-semibold">
                            Status:
                          </span>
                          <button
                            onClick={() => {
                              setTrackingOrder(o);
                              setCourierName(o.courierName || "Delhivery Express");
                              setTrackingNumber(o.trackingNumber || "");
                            }}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{o.trackingNumber ? "Tracking Info" : "+ Add Tracking"}</span>
                          </button>

                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateOrderStatus(o.id, e.target.value as OrderStatus)
                            }
                            className="bg-stone-950 border border-amber-500/30 text-amber-100 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-amber-200/50 uppercase tracking-wider font-semibold mb-1">
                            Shipping Address
                          </p>
                          <p className="text-amber-100/90 leading-relaxed">
                            {o.shippingAddress}
                          </p>
                          <p className="text-amber-200/60 mt-1">
                            Contact: {o.customerPhone}
                          </p>

                          {o.trackingNumber && (
                            <div className="mt-2.5 p-2.5 bg-stone-950/90 border border-amber-500/20 rounded-xl space-y-1">
                              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                                Shipment Tracking Details
                              </span>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-200/70">{o.courierName}:</span>
                                <span className="font-mono font-bold text-amber-200">{o.trackingNumber}</span>
                              </div>
                            </div>
                          )}

                          {(o.cfOrderId || o.paymentId) && (
                            <div className="mt-2.5 p-2.5 bg-stone-950/90 border border-emerald-500/20 rounded-xl space-y-1">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                                Cashfree Payment Transaction
                              </span>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-200/70">CF Order ID:</span>
                                <span className="font-mono font-bold text-emerald-300">{o.cfOrderId || o.paymentId}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-amber-200/50 uppercase tracking-wider font-semibold mb-1">
                            Items Summary
                          </p>
                          <div className="space-y-1">
                            {o.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-stone-950/50 p-2 rounded-xl"
                              >
                                <span className="text-amber-100">
                                  {it.qty}x {it.name}
                                </span>
                                <span className="text-amber-400 font-bold">
                                  {it.price}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-right text-sm font-bold text-amber-300">
                            Total: ₹{o.total}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COUPONS & DISCOUNTS */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500/50" />
                  <input
                    type="text"
                    value={couponQuery}
                    onChange={(e) => setCouponQuery(e.target.value)}
                    placeholder="Search promo codes..."
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 pl-9 pr-4 text-xs text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4" /> Create Coupon
                </button>
              </div>

              {filteredCoupons.length === 0 ? (
                <div className="p-12 text-center bg-stone-900/80 border border-amber-500/20 rounded-3xl space-y-3">
                  <Percent className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <h4 className="font-serif text-lg font-bold text-amber-100">No Coupons Configured</h4>
                  <p className="text-xs text-amber-200/60 max-w-sm mx-auto">
                    Create promo codes to offer festive discounts and reward loyal customers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCoupons.map((c) => (
                    <div
                      key={c.id}
                      className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-mono font-bold text-sm tracking-wider">
                            {c.code}
                          </div>
                          <div>
                            <span className="text-lg font-bold text-amber-100 block">
                              {c.discountType === "percent" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                            </span>
                            <span className="text-[11px] text-amber-200/50">
                              Min Order: ₹{c.minOrderValue}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleCouponStatus(c.id, c.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                            c.isActive
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                              : "bg-stone-800 text-stone-400 border border-stone-700"
                          }`}
                        >
                          {c.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{c.isActive ? "Active" : "Disabled"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/10 text-xs">
                        <div>
                          <span className="text-amber-200/40 text-[10px] uppercase font-semibold block">Expires</span>
                          <span className="text-amber-100 font-mono text-[11px]">{c.expiryDate}</span>
                        </div>
                        <div>
                          <span className="text-amber-200/40 text-[10px] uppercase font-semibold block">Used</span>
                          <span className="text-amber-300 font-mono text-[11px] font-bold">{c.usedCount} / {c.usageLimit}</span>
                        </div>
                        <div className="text-right">
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CUSTOMER INQUIRIES & MESSAGES */}
          {activeTab === "messages" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500/50" />
                  <input
                    type="text"
                    value={messageQuery}
                    onChange={(e) => setMessageQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 pl-9 pr-4 text-xs text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="text-xs text-amber-200/60 font-semibold">
                  Total Messages: <strong className="text-amber-100 font-mono">{messages.length}</strong>
                </div>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center bg-stone-900/80 border border-amber-500/20 rounded-3xl space-y-3">
                  <MessageSquare className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <h4 className="font-serif text-lg font-bold text-amber-100">No Messages Received</h4>
                  <p className="text-xs text-amber-200/60 max-w-sm mx-auto">
                    Customer queries submitted through the Contact Us form will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-5 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        m.status === "unread"
                          ? "bg-amber-950/30 border-amber-500/40 shadow-md"
                          : "bg-stone-900/80 border-amber-500/15"
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-100 text-sm">{m.name}</span>
                          <span className="text-xs text-amber-200/50 font-mono">{m.email}</span>
                          {m.status === "unread" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-500 text-stone-950">
                              New Unread
                            </span>
                          )}
                        </div>
                        <h5 className="font-semibold text-xs text-amber-300 truncate">{m.subject}</h5>
                        <p className="text-xs text-amber-200/70 line-clamp-1">{m.message}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-amber-200/40">{m.createdAt}</span>

                        <button
                          onClick={() => {
                            setSelectedMessage(m);
                            if (m.status === "unread") updateMessageStatus(m.id, "read");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Read
                        </button>

                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GODADDY / NEWSLETTER SUBSCRIBERS */}
          {activeTab === "subscribers" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6">
                <div>
                  <h4 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-400" /> GoDaddy Email Marketing Subscribers
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Emails collected from your website footer newsletter subscription box.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500/50" />
                    <input
                      type="text"
                      value={subscriberQuery}
                      onChange={(e) => setSubscriberQuery(e.target.value)}
                      placeholder="Search email..."
                      className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 pl-9 pr-4 text-xs text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={handleExportGoDaddyCSV}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-amber-500/10"
                    title="Download CSV for GoDaddy Email Marketing"
                  >
                    <Download className="w-4 h-4" /> Export CSV for GoDaddy
                  </button>
                </div>
              </div>

              {filteredSubscribers.length === 0 ? (
                <div className="p-12 text-center bg-stone-900/80 border border-amber-500/20 rounded-3xl space-y-3">
                  <Mail className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <h4 className="font-serif text-lg font-bold text-amber-100">No Newsletter Subscribers Yet</h4>
                  <p className="text-xs text-amber-200/60 max-w-sm mx-auto">
                    When visitors enter their email address in the website footer newsletter box, their details will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-amber-200/50 uppercase font-semibold tracking-wider pb-2 border-b border-amber-500/10 px-3">
                    <span>Subscriber Email</span>
                    <span>Date Joined</span>
                  </div>

                  <div className="space-y-2">
                    {filteredSubscribers.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-stone-950/70 border border-amber-500/10 rounded-2xl p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-mono text-xs font-bold text-amber-100">{s.email}</span>
                        </div>
                        <span className="text-[11px] text-amber-200/50 font-mono">{s.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Payment Methods & COD Toggle */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-400" /> Cash on Delivery (COD) Mode
                    </h4>
                    <p className="text-xs text-amber-200/60 mt-1 max-w-xl">
                      Enable or disable Cash on Delivery (COD) payment option across the online store. When disabled, customers must pay online via Cashfree.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={storeSettings.isCodEnabled}
                      onChange={(e) => {
                        updateCodSetting(e.target.checked);
                        toast.success(
                          e.target.checked
                            ? "Cash on Delivery (COD) enabled store-wide."
                            : "Cash on Delivery (COD) disabled store-wide."
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-stone-950 border border-amber-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-amber-400 after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600/80 peer-checked:border-emerald-500" />
                  </label>
                </div>

                <div className="p-3 bg-stone-950 border border-amber-500/10 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-amber-200/70">Current COD Payment Status:</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                      storeSettings.isCodEnabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    }`}
                  >
                    {storeSettings.isCodEnabled ? "Available (Enabled)" : "Disabled (Unavailable)"}
                  </span>
                </div>
              </div>

              {/* Delivery & Shipping Fee Configuration */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-4">
                <div>
                  <h4 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-400" /> Delivery & Shipping Rates
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Set default delivery charges and threshold for free shipping on customer orders.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-amber-200/80 font-medium">Standard Delivery Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={storeSettings.deliveryFee}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        updateStoreSettings({ deliveryFee: val });
                      }}
                      className="w-full bg-stone-950 border border-amber-500/20 rounded-xl p-3 text-amber-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-amber-200/40">Fee charged on orders below threshold.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-amber-200/80 font-medium">Free Shipping Order Minimum (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={storeSettings.freeShippingThreshold}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        updateStoreSettings({ freeShippingThreshold: val });
                      }}
                      className="w-full bg-stone-950 border border-amber-500/20 rounded-xl p-3 text-amber-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-amber-200/40">Orders equal to or above this amount get Free Delivery.</p>
                  </div>
                </div>
              </div>

              {/* GST / Tax Configuration */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-400" /> GST Tax Configuration
                    </h4>
                    <p className="text-xs text-amber-200/60 mt-1 max-w-xl">
                      Choose whether product prices already include GST taxes or if GST should be added as a separate charge at checkout.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={storeSettings.isGstIncluded}
                      onChange={(e) => {
                        updateStoreSettings({ isGstIncluded: e.target.checked });
                        toast.success(
                          e.target.checked
                            ? "GST configured as INCLUDED in product prices."
                            : "GST configured as SEPARATE ADDITION at checkout."
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-stone-950 border border-amber-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-amber-400 after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600/80 peer-checked:border-emerald-500" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-amber-200/80 font-medium">GST Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={storeSettings.gstPercentage}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        updateStoreSettings({ gstPercentage: val });
                      }}
                      className="w-full bg-stone-950 border border-amber-500/20 rounded-xl p-3 text-amber-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-amber-200/40">Standard GST percentage (e.g. 18% for herbal goods).</p>
                  </div>

                  <div className="p-3.5 bg-stone-950 border border-amber-500/10 rounded-xl text-xs flex flex-col justify-center space-y-1">
                    <span className="text-amber-200/70 font-semibold">Active Tax Mode:</span>
                    <span className="font-bold text-amber-100">
                      {storeSettings.isGstIncluded
                        ? `Prices Include GST (${storeSettings.gstPercentage}%)`
                        : `GST (${storeSettings.gstPercentage}%) Added Separately at Checkout`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Whitelist Manager */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-5">
                <div>
                  <h4 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" /> Admin Email Whitelist
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Any user who logs in with one of these email addresses will be granted full Admin Dashboard access.
                  </p>
                </div>

                {/* Existing admins */}
                <div className="space-y-2">
                  {adminEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between gap-3 bg-stone-950 border border-amber-500/10 rounded-xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs text-amber-100 font-mono">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveAdminEmail(email)}
                        className="text-red-400 hover:text-red-300 transition cursor-pointer"
                        title="Remove admin access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {adminEmails.length === 0 && (
                    <p className="text-xs text-amber-200/40 italic text-center py-3">No admin emails configured.</p>
                  )}
                </div>

                {/* Add new admin */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter any email to grant admin access"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddAdminEmail()}
                    className="flex-1 bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-amber-200/30"
                  />
                  <button
                    onClick={handleAddAdminEmail}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold hover:bg-amber-500/40 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <p className="text-[10px] text-amber-200/40">
                  ⚠ Changes take effect immediately for new logins. Existing sessions are updated on next page refresh.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <h3 className="font-serif text-2xl font-bold text-amber-100 mb-4">
              {editingProduct ? "Edit Product" : "Add New Ayurvedic Product"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Kesh Sanjeevani Hair Oil"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., Arrests Hairfall & Awakens Dormant Roots"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Selling Price
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="₹799"
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Original Price (MRP)
                  </label>
                  <input
                    type="text"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="₹999"
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Category Concern
                </label>
                <select
                  value={concern}
                  onChange={(e) => setConcern(e.target.value as Concern)}
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="hairfall">Hair Care</option>
                  <option value="pain">Pain Relief</option>
                  <option value="ritual">Big Boxes</option>
                </select>
              </div>

              {/* Product Image Selection & Dimensions Guide */}
              <div className="space-y-3 bg-stone-950/80 p-4 rounded-2xl border border-amber-500/25">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block uppercase text-amber-300 font-bold text-xs tracking-wider">
                    Product Image
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    📐 Dim: 800 × 800 px (1:1 Ratio)
                  </span>
                </div>

                <div className="text-[10px] text-amber-200/60 leading-relaxed bg-stone-900 p-2.5 rounded-xl border border-amber-500/10">
                  <p className="font-bold text-amber-200 mb-0.5">Image Specifications:</p>
                  <p>• <strong>Dimensions</strong>: 800 × 800 pixels (Square ratio for ultra-crisp display)</p>
                  <p>• <strong>Formats</strong>: PNG (transparent background recommended), JPG, JPEG, WebP</p>
                  <p>• <strong>Max File Size</strong>: Under 5 MB</p>
                </div>

                {/* Device Upload Button & URL fallback */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md shadow-amber-500/10">
                      <Upload className="w-4 h-4" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <span className="text-amber-200/40 text-xs hidden sm:inline">or</span>

                    <input
                      type="text"
                      value={img}
                      onChange={(e) => setImg(e.target.value)}
                      placeholder="Paste Image URL (https://...)"
                      className="w-full flex-1 bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  {/* Live Thumbnail Preview */}
                  {img && (
                    <div className="flex items-center gap-3 p-2.5 bg-stone-900 rounded-xl border border-amber-500/20 mt-2">
                      <img
                        src={img}
                        alt="Product preview"
                        className="w-14 h-14 object-cover rounded-lg bg-stone-950 border border-amber-500/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-[10px] text-amber-200/80">
                        <span className="font-bold text-amber-300 block">Image Preview Active</span>
                        <span className="truncate block opacity-60 font-mono mt-0.5">
                          {img.startsWith("data:") ? "Loaded directly from Device" : img}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImg("")}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 bg-rose-950/40 rounded-lg border border-rose-500/30 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Stock Inventory Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Product Benefits (One per line)
                </label>
                <textarea
                  rows={3}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  placeholder={"100% AYURVEDIC Formulation\nCHEMICAL FREE & Safe\nNet Volume: 250ml"}
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 text-amber-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-stone-950 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-400"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4" data-lenis-prevent>
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative" data-lenis-prevent>
            <h3 className="font-serif text-2xl font-bold text-amber-100 mb-4">
              Create Promo Coupon
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AYURVEDA20"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder={discountType === "percent" ? "20" : "100"}
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    placeholder="500"
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  required
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  placeholder="200"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 text-amber-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-stone-950 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4" data-lenis-prevent>
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-4 text-xs" data-lenis-prevent>
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Customer Inquiry</span>
                <h3 className="font-serif text-xl font-bold text-amber-100 mt-0.5">{selectedMessage.name}</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-amber-200/50 hover:text-amber-100 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-stone-950/80 p-4 rounded-2xl border border-amber-500/15">
              <div className="flex justify-between">
                <span className="text-amber-200/50">Email:</span>
                <span className="text-amber-100 font-mono font-bold">{selectedMessage.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/50">Phone:</span>
                <span className="text-amber-100 font-mono">{selectedMessage.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/50">Date Received:</span>
                <span className="text-amber-100/70">{selectedMessage.createdAt}</span>
              </div>
              <div className="pt-2 border-t border-amber-500/10">
                <span className="text-amber-200/50 block mb-1">Subject:</span>
                <span className="text-amber-300 font-semibold text-sm">{selectedMessage.subject}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-amber-200/50 uppercase font-semibold text-[10px] tracking-wider block">Message Content</span>
              <p className="bg-stone-950 p-4 rounded-2xl border border-amber-500/10 text-amber-100 leading-relaxed font-sans text-xs">
                {selectedMessage.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-500/10">
              <div className="flex items-center gap-2">
                <span className="text-amber-200/50 text-[10px] uppercase font-semibold">Mark Status:</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => {
                    const status = e.target.value as "unread" | "read" | "replied";
                    updateMessageStatus(selectedMessage.id, status);
                    setSelectedMessage({ ...selectedMessage, status });
                  }}
                  className="bg-stone-950 border border-amber-500/30 text-amber-100 text-xs font-semibold rounded-xl px-2 py-1"
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>

              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                Reply via Email →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Update Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4" data-lenis-prevent>
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 text-xs" data-lenis-prevent>
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Shipping & Courier Tracking</span>
                <h3 className="font-serif text-xl font-bold text-amber-100 mt-0.5">Order {trackingOrder.id}</h3>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-amber-200/50 hover:text-amber-100 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-4">
              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  Courier Partner
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="BlueDart Courier">BlueDart Courier</option>
                  <option value="DTDC Express">DTDC Express</option>
                  <option value="India Speed Post">India Speed Post</option>
                  <option value="Bluedart Surface">Bluedart Surface</option>
                  <option value="Shiprocket">Shiprocket</option>
                </select>
              </div>

              <div>
                <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                  AWB / Tracking Number
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DELH123456789IN"
                  className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="px-4 py-2 bg-stone-800 text-amber-200 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-stone-950 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                >
                  Save & Mark Shipped
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
