import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Cloud,
  DollarSign,
  Edit3,
  KeyRound,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useStore, type ProductSaveInput } from '../context/StoreContext';
import {
  PRODUCT_CATEGORIES,
  STAFF_GRANTABLE_PERMISSIONS,
  type AdminPermission,
  type OrderStatus,
  type Product,
  type StaffPermission,
} from '../types/commerce';
import { formatCurrency, getNextOrderStatus, hasAdminPermission } from '../utils/commerce';
import { ProductImage } from './ProductImage';

type AdminTab = 'overview' | 'inventory' | 'orders' | 'permissions';

const IMAGE_PRESETS = [
  {
    label: 'Amber Serum Bottle',
    url: '/src/assets/images/product_vitamin_c_serum_1795428076477.jpg',
  },
  {
    label: 'Blush Cream Jar',
    url: '/src/assets/images/product_hydra_moisturizer_1795428075942.jpg',
  },
  {
    label: 'Matte Foundation Bottle',
    url: '/src/assets/images/product_matte_foundation_1795428075921.jpg',
  },
  {
    label: 'Sage Cleanser Tube',
    url: '/src/assets/images/product_gentle_cleanser_1795428076958.jpg',
  },
];

export function AdminDashboardView() {
  const {
    products,
    orders,
    isOwner,
    adminPermissions,
    staffPermissions,
    firestoreCatalogActive,
    seedCatalogToFirestore,
    adjustProductStock,
    saveProduct,
    deleteProduct,
    advanceOrderStatus,
    updateOrderDetails,
    saveStaffPermission,
    toggleStaffPermissionActive,
    deleteStaffPermission,
    setSelectedTrackOrderNumber,
    setActiveView,
  } = useStore();

  const canViewOverview = isOwner || hasAdminPermission(adminPermissions, 'view_overview');
  const canManageStock =
    isOwner ||
    hasAdminPermission(adminPermissions, 'manage_stock') ||
    hasAdminPermission(adminPermissions, 'manage_products');
  const canManageProducts = isOwner || hasAdminPermission(adminPermissions, 'manage_products');
  const canManageOrders = isOwner || hasAdminPermission(adminPermissions, 'manage_orders');
  const canManagePermissions = isOwner;

  const availableTabs = useMemo(() => {
    const tabs: { id: AdminTab; label: string }[] = [];
    if (canViewOverview) tabs.push({ id: 'overview', label: 'Overview' });
    if (canManageStock || canManageProducts) {
      tabs.push({ id: 'inventory', label: `Inventory & Stock (${products.length})` });
    }
    if (canManageOrders) {
      tabs.push({ id: 'orders', label: `Orders & Fulfillment (${orders.length})` });
    }
    if (canManagePermissions) {
      tabs.push({ id: 'permissions', label: `Team Permissions (${staffPermissions.length})` });
    }
    return tabs;
  }, [
    canViewOverview,
    canManageStock,
    canManageProducts,
    canManageOrders,
    canManagePermissions,
    products.length,
    orders.length,
    staffPermissions.length,
  ]);

  const [tab, setTab] = useState<AdminTab>(() => availableTabs[0]?.id ?? 'inventory');
  const [invSearch, setInvSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === tab)) {
      setTab(availableTabs[0].id);
    }
  }, [availableTabs, tab]);

  const [staffEmail, setStaffEmail] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffSelectedPerms, setStaffSelectedPerms] = useState<AdminPermission[]>([
    'manage_orders',
  ]);
  const [staffFormError, setStaffFormError] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productFormError, setProductFormError] = useState('');
  const [productForm, setProductForm] = useState<ProductSaveInput>({
    name: '',
    sku: '',
    category: 'Skincare',
    price: 30,
    compareAtPrice: undefined,
    stock: 20,
    lowStockThreshold: 5,
    badge: '',
    shortDescription: '',
    ingredients: '',
    sizeLabel: '30 ml',
    imageUrl: IMAGE_PRESETS[0].url,
    featured: true,
  });

  const metrics = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const activeOrders = orders.filter(
      (o) => o.status === 'placed' || o.status === 'processing' || o.status === 'shipped'
    ).length;
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;
    return { totalRevenue, activeOrders, totalUnits, lowStockCount };
  }, [orders, products]);

  const filteredProducts = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesLow = !lowStockOnly || p.stock <= p.lowStockThreshold;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesLow && matchesSearch;
    });
  }, [products, invSearch, lowStockOnly]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const openCreateProduct = () => {
    setProductFormError('');
    setProductForm({
      name: '',
      sku: `AB-NEW-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Skincare',
      price: 32,
      compareAtPrice: undefined,
      stock: 25,
      lowStockThreshold: 5,
      badge: 'New',
      shortDescription: '',
      ingredients: '',
      sizeLabel: '30 ml',
      imageUrl: IMAGE_PRESETS[0].url,
      featured: true,
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setProductFormError('');
    setProductForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      badge: product.badge ?? '',
      shortDescription: product.shortDescription,
      ingredients: product.ingredients ?? '',
      sizeLabel: product.sizeLabel,
      imageUrl: product.imageUrl,
      featured: product.featured,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    const res = await saveProduct(productForm);
    if (!res.ok) {
      setProductFormError(res.error || 'Could not save product.');
      return;
    }
    setProductModalOpen(false);
  };

  const handleTogglePermOption = (permId: AdminPermission) => {
    setStaffSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError('');
    const res = await saveStaffPermission({
      email: staffEmail,
      name: staffName,
      permissions: staffSelectedPerms,
      active: true,
    });
    if (!res.ok) {
      setStaffFormError(res.error || 'Could not save team permissions.');
      return;
    }
    setStaffEmail('');
    setStaffName('');
    setStaffSelectedPerms(['manage_orders']);
  };

  const handleEditStaff = (entry: StaffPermission) => {
    setStaffFormError('');
    setStaffEmail(entry.email);
    setStaffName(entry.name);
    setStaffSelectedPerms(entry.permissions);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E6E2DA] mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
            {isOwner ? 'Owner Operations Console' : 'Delegated Staff Console'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#172320]">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 rounded-lg">
            <Cloud className="w-4 h-4" aria-hidden="true" />
            {isOwner
              ? firestoreCatalogActive
                ? 'Owner · Firestore Live Sync'
                : 'Owner · Full Access'
              : `Staff · ${adminPermissions.length} Permission${adminPermissions.length === 1 ? '' : 's'}`}
          </span>

          {!firestoreCatalogActive && canManageProducts && (
            <button
              type="button"
              onClick={() => void seedCatalogToFirestore()}
              className="px-4 py-2 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors"
            >
              Publish Catalog to Firestore
            </button>
          )}

          {canManageProducts && (
            <button
              type="button"
              onClick={openCreateProduct}
              className="px-4 py-2.5 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Admin Dashboard Sections"
        className="flex items-center gap-2 overflow-x-auto pb-2 mb-8"
      >
        {availableTabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
              tab === item.id
                ? 'bg-[#103C32] text-white'
                : 'bg-white border border-[#E6E2DA] text-[#465752] hover:text-[#103C32]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* KPI Strip (shown only when View Overview is granted) */}
      {canViewOverview && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5B6B66] mb-2">
            <span className="text-xs font-medium">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold text-[#172320] tabular-nums">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-[#5B6B66] mt-1">Across {orders.length} recorded orders</p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5B6B66] mb-2">
            <span className="text-xs font-medium">Active Orders</span>
            <Package className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold text-[#172320] tabular-nums">
            {metrics.activeOrders}
          </p>
          <p className="text-xs text-[#5B6B66] mt-1">Placed, preparing, or in transit</p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5B6B66] mb-2">
            <span className="text-xs font-medium">Units in Stock</span>
            <Box className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold text-[#172320] tabular-nums">
            {metrics.totalUnits}
          </p>
          <p className="text-xs text-[#5B6B66] mt-1">Across {products.length} active SKUs</p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#5B6B66] mb-2">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                metrics.lowStockCount > 0 ? 'text-[#D97706]' : 'text-[#15803D]'
              }`}
              aria-hidden="true"
            />
          </div>
          <p className="text-2xl font-semibold text-[#172320] tabular-nums">
            {metrics.lowStockCount}
          </p>
          <p className="text-xs text-[#5B6B66] mt-1">
            {metrics.lowStockCount > 0 ? 'Needs restock soon' : 'All SKUs healthy'}
          </p>
        </div>
        </section>
      )}

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && canViewOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#172320]">Recent Orders</h2>
              {canManageOrders && (
                <button
                  type="button"
                  onClick={() => setTab('orders')}
                  className="text-xs font-medium text-[#103C32] hover:underline flex items-center gap-1"
                >
                  <span>Manage all</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F0ECE4]">
              {orders.slice(0, 5).map((ord) => {
                const nextStatus = getNextOrderStatus(ord.status);
                return (
                  <div
                    key={ord.id}
                    className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#172320]">
                        <span className="font-mono">{ord.orderNumber}</span>
                        <span>·</span>
                        <span>{ord.customerName}</span>
                      </div>
                      <p className="text-xs text-[#5B6B66] mt-0.5 tabular-nums">
                        {ord.items.length} item(s) · {formatCurrency(ord.totalAmount)} ·{' '}
                        <span className="uppercase">{ord.paymentMethod}</span> ({ord.status})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageOrders && nextStatus && (
                        <button
                          type="button"
                          onClick={() => void advanceOrderStatus(ord.id)}
                          className="px-3 py-1.5 bg-[#103C32] text-white text-xs font-medium rounded-lg hover:bg-[#0B2B24] transition-colors"
                        >
                          Mark {nextStatus}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrackOrderNumber(ord.orderNumber);
                          setActiveView('track');
                        }}
                        className="px-3 py-1.5 border border-[#E6E2DA] text-xs font-medium text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#172320]">Restock Priority</h2>
              {(canManageStock || canManageProducts) && (
                <button
                  type="button"
                  onClick={() => {
                    setLowStockOnly(true);
                    setTab('inventory');
                  }}
                  className="text-xs font-medium text-[#103C32] hover:underline"
                >
                  Open Inventory
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F0ECE4]">
              {products
                .slice()
                .sort((a, b) => a.stock - b.stock)
                .slice(0, 5)
                .map((p) => {
                  const low = p.stock <= p.lowStockThreshold;
                  return (
                    <div
                      key={p.id}
                      className="px-6 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#172320] truncate">{p.name}</p>
                        <p
                          className={`text-xs tabular-nums ${
                            p.stock === 0
                              ? 'text-[#B91C1C] font-medium'
                              : low
                              ? 'text-[#D97706] font-medium'
                              : 'text-[#5B6B66]'
                          }`}
                        >
                          {p.stock} left · Threshold {p.lowStockThreshold}
                        </p>
                      </div>
                      {canManageStock && (
                        <button
                          type="button"
                          onClick={() => void adjustProductStock(p.id, 10)}
                          className="px-3 py-1.5 border border-[#E6E2DA] text-xs font-semibold text-[#103C32] rounded-lg hover:bg-[#FAF9F6] whitespace-nowrap shrink-0"
                        >
                          +10 Stock
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {tab === 'inventory' && (canManageStock || canManageProducts) && (
        <section className="bg-white border border-[#E6E2DA] rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E6E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#5B6B66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="admin-inv-search" className="sr-only">
                Search inventory
              </label>
              <input
                id="admin-inv-search"
                type="search"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Search SKU or product name..."
                className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLowStockOnly((v) => !v)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  lowStockOnly
                    ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                    : 'bg-white border-[#E6E2DA] text-[#465752]'
                }`}
              >
                {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#5B6B66]">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Stock Control</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-sm">
                {filteredProducts.map((product) => {
                  const out = product.stock <= 0;
                  const low = !out && product.stock <= product.lowStockThreshold;
                  return (
                    <tr key={product.id} className="hover:bg-[#FAF9F6]/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F8F6F3] shrink-0">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#172320]">{product.name}</p>
                            <p className="text-xs text-[#5B6B66]">{product.sizeLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#5B6B66]">{product.sku}</td>
                      <td className="py-3 px-4 text-xs text-[#374742]">{product.category}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        {canManageStock ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Decrease stock for ${product.name}`}
                              disabled={product.stock <= 0}
                              onClick={() => void adjustProductStock(product.id, -1)}
                              className="p-1.5 border border-[#E6E2DA] rounded hover:bg-[#FAF9F6] disabled:opacity-40"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-mono text-xs font-semibold tabular-nums">
                              {product.stock}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase stock for ${product.name}`}
                              onClick={() => void adjustProductStock(product.id, 1)}
                              className="p-1.5 border border-[#E6E2DA] rounded hover:bg-[#FAF9F6]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void adjustProductStock(product.id, 10)}
                              className="ml-1 px-2 py-1 text-[11px] font-medium border border-[#E6E2DA] rounded hover:bg-[#FAF9F6]"
                            >
                              +10
                            </button>
                          </div>
                        ) : (
                          <p className="text-center font-mono text-xs font-semibold tabular-nums text-[#5B6B66]">
                            {product.stock}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {out ? (
                          <span className="text-[#B91C1C]">Out of Stock</span>
                        ) : low ? (
                          <span className="text-[#D97706]">Low Stock</span>
                        ) : (
                          <span className="text-[#15803D] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageProducts ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-2 text-[#5B6B66] hover:text-[#103C32] rounded-lg hover:bg-[#EFECE4]"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteProduct(product.id)}
                              aria-label={`Delete ${product.name}`}
                              className="p-2 text-[#5B6B66] hover:text-[#B91C1C] rounded-lg hover:bg-[#FEF2F2]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#7D8C87]">Stock Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: ORDERS & FULFILLMENT */}
      {tab === 'orders' && canManageOrders && (
        <section className="bg-white border border-[#E6E2DA] rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E6E2DA] flex flex-wrap items-center gap-2">
            {(['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-[#103C32] text-white'
                      : 'bg-[#FAF9F6] text-[#465752] hover:text-[#103C32]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="divide-y divide-[#F0ECE4]">
            {filteredOrders.length === 0 ? (
              <p className="p-8 text-sm text-[#5B6B66] text-center">
                No orders match this status filter.
              </p>
            ) : (
              filteredOrders.map((ord) => {
                const next = getNextOrderStatus(ord.status);
                return (
                  <div
                    key={ord.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-semibold text-[#172320]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-sm font-medium text-[#172320]">
                          {ord.customerName}
                        </span>
                        <span className="text-xs text-[#5B6B66]">
                          · {ord.city}, {ord.postalCode}
                        </span>
                        <span className="text-xs font-semibold uppercase text-[#103C32]">
                          · {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6B66]">
                        {ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                      <p className="text-xs text-[#7D8C87]">{ord.trackingNote}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <div className="text-right mr-2">
                        <p className="text-sm font-semibold text-[#172320] tabular-nums">
                          {formatCurrency(ord.totalAmount)}
                        </p>
                        <p className="text-[11px] uppercase text-[#5B6B66]">
                          {ord.paymentMethod} · {ord.paymentStatus}
                        </p>
                      </div>

                      <label htmlFor={`status-${ord.id}`} className="sr-only">
                        Order status for {ord.orderNumber}
                      </label>
                      <select
                        id={`status-${ord.id}`}
                        value={ord.status}
                        onChange={(e) =>
                          void updateOrderDetails(ord.id, {
                            status: e.target.value as OrderStatus,
                            paymentStatus:
                              e.target.value === 'delivered' ? 'paid' : ord.paymentStatus,
                            trackingNote: ord.trackingNote,
                          })
                        }
                        className="px-3 py-2 bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-xs font-medium text-[#172320]"
                      >
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {next && (
                        <button
                          type="button"
                          onClick={() => void advanceOrderStatus(ord.id)}
                          className="px-3.5 py-2 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors whitespace-nowrap"
                        >
                          Advance to {next}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* TAB 4: OWNER-ONLY TEAM PERMISSIONS */}
      {tab === 'permissions' && canManagePermissions && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-xl p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <UserPlus className="w-5 h-5 text-[#103C32]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[#172320]">
                Grant Scoped Admin Access
              </h2>
            </div>
            <p className="text-xs text-[#5B6B66] leading-relaxed mb-5">
              Assign specific capabilities to verified Google accounts. Team members can only see
              tabs and perform actions you select below.
            </p>

            {staffFormError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
                {staffFormError}
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label
                  htmlFor="perm-staff-email"
                  className="block text-xs font-medium text-[#465752] mb-1"
                >
                  Google Email Address
                </label>
                <input
                  id="perm-staff-email"
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                />
              </div>

              <div>
                <label
                  htmlFor="perm-staff-name"
                  className="block text-xs font-medium text-[#465752] mb-1"
                >
                  Name / Role Label
                </label>
                <input
                  id="perm-staff-name"
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Operations Manager"
                  className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#465752] mb-2">
                  Allowed Capabilities
                </span>
                <div className="space-y-2">
                  {STAFF_GRANTABLE_PERMISSIONS.map((perm) => {
                    const checked = staffSelectedPerms.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#103C32] bg-[#FAF9F6]'
                            : 'border-[#E6E2DA] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermOption(perm.id)}
                          className="mt-0.5 accent-[#103C32]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#172320]">{perm.label}</p>
                          <p className="text-[11px] text-[#5B6B66] mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>Save Team Permissions</span>
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[#172320]">
                  Authorized Team Members ({staffPermissions.length})
                </h2>
              </div>
              <span className="text-xs text-[#5B6B66]">Owner access cannot be revoked</span>
            </div>

            {staffPermissions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-[#172320]">No delegated staff yet</p>
                <p className="text-xs text-[#5B6B66] mt-1">
                  Only you ({'parvejmollik2022@gmail.com'}) currently have access to the Admin
                  Dashboard.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0ECE4]">
                {staffPermissions.map((entry) => (
                  <div
                    key={entry.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#172320]">{entry.name}</p>
                        <span
                          className={`text-[11px] font-semibold ${
                            entry.active ? 'text-[#15803D]' : 'text-[#D97706]'
                          }`}
                        >
                          · {entry.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#5B6B66] truncate">{entry.email}</p>
                      <p className="text-xs text-[#374742]">
                        Access:{' '}
                        {entry.permissions
                          .map(
                            (p) =>
                              STAFF_GRANTABLE_PERMISSIONS.find((item) => item.id === p)?.label ?? p
                          )
                          .join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditStaff(entry)}
                        className="px-3 py-1.5 border border-[#E6E2DA] text-xs font-medium text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void toggleStaffPermissionActive(entry.id, !entry.active)
                        }
                        className="px-3 py-1.5 border border-[#E6E2DA] text-xs font-medium text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
                      >
                        {entry.active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteStaffPermission(entry.id)}
                        aria-label={`Revoke access for ${entry.email}`}
                        className="p-2 text-[#5B6B66] hover:text-[#B91C1C] rounded-lg hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {productModalOpen && canManageProducts && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-modal-title"
          onClick={() => setProductModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E6E2DA] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                id="admin-product-modal-title"
                className="font-display text-2xl font-semibold text-[#172320]"
              >
                {productForm.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                aria-label="Close product form"
                className="p-1.5 text-[#5B6B66] hover:text-[#172320] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label
                  htmlFor="adm-prod-name"
                  className="block text-xs font-medium text-[#465752] mb-1"
                >
                  Product Name
                </label>
                <input
                  id="adm-prod-name"
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Rosewater Hydrating Mist"
                  className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="adm-prod-sku"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    SKU
                  </label>
                  <input
                    id="adm-prod-sku"
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-[#103C32]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-prod-cat"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="adm-prod-cat"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as Product['category'],
                      })
                    }
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm bg-white focus:outline-none focus:border-[#103C32]"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="adm-prod-price"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Price (৳)
                  </label>
                  <input
                    id="adm-prod-price"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[#103C32]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-prod-stock"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Stock Units
                  </label>
                  <input
                    id="adm-prod-stock"
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[#103C32]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-prod-thresh"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Alert Threshold
                  </label>
                  <input
                    id="adm-prod-thresh"
                    type="number"
                    min="0"
                    required
                    value={productForm.lowStockThreshold}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm tabular-nums focus:outline-none focus:border-[#103C32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="adm-prod-size"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Size Label
                  </label>
                  <input
                    id="adm-prod-size"
                    type="text"
                    value={productForm.sizeLabel}
                    onChange={(e) => setProductForm({ ...productForm, sizeLabel: e.target.value })}
                    placeholder="30 ml"
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-prod-img"
                    className="block text-xs font-medium text-[#465752] mb-1"
                  >
                    Product Visual
                  </label>
                  <select
                    id="adm-prod-img"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm bg-white focus:outline-none focus:border-[#103C32]"
                  >
                    {IMAGE_PRESETS.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="adm-prod-desc"
                  className="block text-xs font-medium text-[#465752] mb-1"
                >
                  Short Description
                </label>
                <textarea
                  id="adm-prod-desc"
                  rows={3}
                  required
                  value={productForm.shortDescription}
                  onChange={(e) =>
                    setProductForm({ ...productForm, shortDescription: e.target.value })
                  }
                  placeholder="Describe benefits, finish, and skin suitability..."
                  className="w-full px-3.5 py-2 border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-[#E6E2DA] text-sm font-medium text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
