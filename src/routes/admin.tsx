import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getAdminEmails, setAdminEmails } from "@/lib/auth-context";
import { useProducts, type Concern, type ProductItem } from "@/hooks/use-products";
import { useOrders, type OrderStatus } from "@/hooks/use-orders";
import { isFirebaseConfigured } from "@/lib/firebase";
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
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, logout } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "settings">("overview");

  // Admin Whitelist Management
  const [adminEmails, setAdminEmailsState] = useState<string[]>(() => getAdminEmails());
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const handleAddAdminEmail = () => {
    const email = newAdminEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) return;
    if (adminEmails.includes(email)) { setNewAdminEmail(""); return; }
    const updated = [...adminEmails, email];
    setAdminEmailsState(updated);
    setAdminEmails(updated);
    setNewAdminEmail("");
  };

  const handleRemoveAdminEmail = (email: string) => {
    const updated = adminEmails.filter((e) => e !== email);
    setAdminEmailsState(updated);
    setAdminEmails(updated);
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

  // Product Search filter
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSubtitle("");
    setPrice("₹799");
    setOldPrice("₹999");
    setImg("https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/acceb3d6-0ead-46f6-a2cd-d5575bee4650/id-preview-c31f3cc3--40643ab3-0a60-4170-a97f-c32eaab445a3.lovable.app-1783919364369.png");
    setConcern("hairfall");
    setBenefitsText("100% AYURVEDIC Formulation\nCHEMICAL FREE & Safe");
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
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }
    setIsAddModalOpen(false);
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
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
      <header className="border-b border-amber-500/20 bg-stone-900/90 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 transition"
            title="Return to Store Front"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-amber-100">
                Thakur Yograj
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-amber-200/50">
              E-Commerce Management Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 border border-amber-500/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{user?.email || "Admin User"}</span>
          </div>

          <button
            onClick={() => logout()}
            className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900 transition flex items-center gap-2 text-xs font-semibold"
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
            className={`flex-1 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left ${
              activeTab === "products"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 md:w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left ${
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
            onClick={() => setActiveTab("settings")}
            className={`flex-1 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-semibold transition text-left ${
              activeTab === "settings"
                ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10"
                : "text-amber-200/70 hover:bg-stone-800 hover:text-amber-100"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Firebase & DB</span>
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
                      <h3 className="font-serif text-3xl font-bold text-amber-100 mt-2">
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
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-amber-200/70">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold">{o.customerName}</span> (
                          {o.customerEmail})
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase text-amber-200/50 font-semibold">
                          Status:
                        </span>
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
                          className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-xl transition"
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
            </div>
          )}

          {/* TAB 4: SETTINGS / FIREBASE */}
          {activeTab === "settings" && (
            <div className="space-y-6">
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

              {/* Firebase Status */}
              <div className="bg-stone-900/80 border border-amber-500/20 rounded-3xl p-6 space-y-6">
                <div>
                  <h4 className="font-serif text-xl font-bold text-amber-100">
                    Firebase Integration Status
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    Check your current cloud backend state.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    isFirebaseConfigured
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-200"
                  }`}
                >
                  <Database className="w-5 h-5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">
                      {isFirebaseConfigured
                        ? "Firebase Cloud Connected"
                        : "Running in Fallback Local Storage Mode"}
                    </h5>
                    <p className="text-xs opacity-80 mt-0.5">
                      {isFirebaseConfigured
                        ? "Your app is reading & writing live data directly to Firebase Firestore."
                        : "Environment variables VITE_FIREBASE_* are not set yet. The Admin Panel is currently persisting data to browser LocalStorage so you can test immediately!"}
                    </p>
                  </div>
                </div>

                <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/10 text-xs space-y-2">
                  <p className="font-bold text-amber-400 uppercase tracking-wider">
                    How to attach live Firebase credentials:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-200/70">
                    <li>Create a free project at console.firebase.google.com</li>
                    <li>Enable Authentication (Email & Google) and Firestore Database</li>
                    <li>Create a <code className="text-amber-300">.env</code> file in your project root with:</li>
                  </ol>
                  <pre className="p-3 bg-stone-900 rounded-xl text-[11px] text-emerald-300 overflow-x-auto">
{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id`}
                  </pre>
                </div>
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

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block uppercase text-amber-200/70 font-semibold mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => setImg(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-stone-950 border border-amber-500/20 rounded-xl py-2 px-3 text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
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
    </div>
  );
}
