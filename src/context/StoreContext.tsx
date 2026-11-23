import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import { SEED_NOTIFICATIONS, SEED_ORDERS, SEED_PRODUCTS } from '../data/seedCatalog';
import type {
  AppView,
  CartItem,
  CheckoutFormInput,
  Order,
  OrderNotification,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types/commerce';
import {
  applyOrderStockDeductions,
  calculateCartTotals,
  canAdjustCartQuantity,
  generateOrderNumber,
  getDefaultTrackingNote,
  getNextOrderStatus,
  sanitizeText,
  validateCheckoutForm,
} from '../utils/commerce';

const STORAGE_KEYS = {
  cart: 'antixor_cart_v1',
  products: 'antixor_products_v1',
  orders: 'antixor_orders_v1',
  notifications: 'antixor_notifications_v1',
} as const;

export interface ToastNotice {
  id: string;
  title: string;
  message: string;
}

export interface ProductSaveInput {
  id?: string;
  name: string;
  sku: string;
  category: Product['category'];
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  badge?: string;
  shortDescription: string;
  ingredients?: string;
  sizeLabel: string;
  imageUrl: string;
  featured: boolean;
}

interface StoreContextValue {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedTrackOrderNumber: string;
  setSelectedTrackOrderNumber: (orderNumber: string) => void;

  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  firestoreConnected: boolean;
  firestoreCatalogActive: boolean;

  products: Product[];
  cart: CartItem[];
  cartCount: number;
  orders: Order[];
  notifications: OrderNotification[];
  unreadNotificationCount: number;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  toast: ToastNotice | null;
  dismissToast: () => void;

  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  placeOrder: (
    form: CheckoutFormInput,
    promoCode?: string
  ) => Promise<{ ok: boolean; order?: Order; error?: string }>;

  advanceOrderStatus: (orderId: string) => Promise<void>;
  updateOrderDetails: (
    orderId: string,
    updates: { status: OrderStatus; paymentStatus: PaymentStatus; trackingNote: string }
  ) => Promise<void>;
  cancelCustomerOrder: (orderId: string) => Promise<void>;

  adjustProductStock: (productId: string, delta: number) => Promise<void>;
  saveProduct: (input: ProductSaveInput) => Promise<{ ok: boolean; error?: string }>;
  deleteProduct: (productId: string) => Promise<void>;
  seedCatalogToFirestore: () => Promise<void>;

  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota failures
  }
}

function timestampToIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<AppView>('storefront');
  const [selectedTrackOrderNumber, setSelectedTrackOrderNumber] = useState<string>('AB-1042');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [firestoreCatalogActive, setFirestoreCatalogActive] = useState(false);

  const [localProducts, setLocalProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_KEYS.products, SEED_PRODUCTS)
  );
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
  const [localOrders, setLocalOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_KEYS.orders, SEED_ORDERS)
  );
  const [firestoreOrders, setFirestoreOrders] = useState<Order[]>([]);

  const [localNotifications, setLocalNotifications] = useState<OrderNotification[]>(() =>
    readStorage<OrderNotification[]>(STORAGE_KEYS.notifications, SEED_NOTIFICATIONS)
  );
  const [firestoreNotifications, setFirestoreNotifications] = useState<OrderNotification[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const showToast = useCallback((title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToast({ id, title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return user.email === BOOTSTRAPPED_ADMIN_EMAIL || hasAdminDoc;
  }, [user, hasAdminDoc]);

  // Persist local fallback state
  useEffect(() => {
    writeStorage(STORAGE_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.products, localProducts);
  }, [localProducts]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.orders, localOrders);
  }, [localOrders]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.notifications, localNotifications);
  }, [localNotifications]);

  // Startup Firestore connectivity check
  useEffect(() => {
    testConnection().then((ok) => setFirestoreConnected(ok));
  }, []);

  // Auth listener & user profile sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setHasAdminDoc(false);
        setFirestoreOrders([]);
        setFirestoreNotifications([]);
        return;
      }

      if (nextUser.emailVerified) {
        // Ensure user profile doc exists in Firestore
        const userRef = doc(db, 'users', nextUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: nextUser.uid,
              displayName: sanitizeText(nextUser.displayName || 'Beauty Member', 100),
              email: sanitizeText(nextUser.email || '', 160),
              role: 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Profile sync skipped:', err);
        }

        try {
          const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
          setHasAdminDoc(adminSnap.exists());
        } catch {
          setHasAdminDoc(false);
        }
      }
    });

    return () => unsub();
  }, []);

  // Public products catalog listener
  useEffect(() => {
    const productsQuery = query(collection(db, 'products'));
    const unsub = onSnapshot(
      productsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setFirestoreCatalogActive(false);
          setFirestoreProducts([]);
          return;
        }
        const items: Product[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name ?? ''),
            sku: String(data.sku ?? ''),
            category: data.category as Product['category'],
            price: Number(data.price ?? 0),
            compareAtPrice:
              typeof data.compareAtPrice === 'number' ? data.compareAtPrice : undefined,
            stock: Number(data.stock ?? 0),
            lowStockThreshold: Number(data.lowStockThreshold ?? 5),
            rating: Number(data.rating ?? 4.8),
            reviewCount: Number(data.reviewCount ?? 0),
            badge: typeof data.badge === 'string' && data.badge ? data.badge : undefined,
            shortDescription: String(data.shortDescription ?? ''),
            ingredients: typeof data.ingredients === 'string' ? data.ingredients : undefined,
            sizeLabel: String(data.sizeLabel ?? '30 ml'),
            imageUrl: String(data.imageUrl ?? ''),
            featured: Boolean(data.featured),
            createdAtIso: timestampToIso(data.createdAt),
            updatedAtIso: timestampToIso(data.updatedAt),
          };
        });
        setFirestoreProducts(items);
        setFirestoreCatalogActive(true);
      },
      (error) => {
        console.warn('Products snapshot fallback:', error);
      }
    );

    return () => unsub();
  }, []);

  // Authenticated orders & notifications listeners
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const ordersQuery = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const docs: Order[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: String(data.orderNumber ?? ''),
            userId: String(data.userId ?? ''),
            customerName: String(data.customerName ?? ''),
            customerEmail: String(data.customerEmail ?? ''),
            customerPhone: String(data.customerPhone ?? ''),
            shippingAddress: String(data.shippingAddress ?? ''),
            city: String(data.city ?? ''),
            postalCode: String(data.postalCode ?? ''),
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal ?? 0),
            shippingFee: Number(data.shippingFee ?? 0),
            discountAmount: Number(data.discountAmount ?? 0),
            totalAmount: Number(data.totalAmount ?? 0),
            paymentMethod: data.paymentMethod,
            paymentReference:
              typeof data.paymentReference === 'string' ? data.paymentReference : undefined,
            paymentStatus: data.paymentStatus,
            status: data.status,
            trackingNote: String(data.trackingNote ?? ''),
            createdAtIso: timestampToIso(data.createdAt),
            updatedAtIso: timestampToIso(data.updatedAt),
          };
        });
        docs.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setFirestoreOrders(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const notifQuery = isAdmin
      ? query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'notifications'), where('userId', '==', user.uid));

    const unsubNotifs = onSnapshot(
      notifQuery,
      (snapshot) => {
        const docs: OrderNotification[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId ?? ''),
            orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
            orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
            title: String(data.title ?? ''),
            message: String(data.message ?? ''),
            type: data.type,
            read: Boolean(data.read),
            createdAtIso: timestampToIso(data.createdAt),
          };
        });
        docs.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setFirestoreNotifications(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubOrders();
      unsubNotifs();
    };
  }, [authReady, user, isAdmin]);

  const products = firestoreCatalogActive ? firestoreProducts : localProducts;

  const orders = useMemo(() => {
    if (user && user.emailVerified) {
      const merged = new Map<string, Order>();
      for (const o of localOrders) merged.set(o.id, o);
      for (const o of firestoreOrders) merged.set(o.id, o);
      return Array.from(merged.values()).sort((a, b) =>
        b.createdAtIso.localeCompare(a.createdAtIso)
      );
    }
    return localOrders;
  }, [user, firestoreOrders, localOrders]);

  const notifications = useMemo(() => {
    if (user && user.emailVerified) {
      const merged = new Map<string, OrderNotification>();
      for (const n of localNotifications) merged.set(n.id, n);
      for (const n of firestoreNotifications) merged.set(n.id, n);
      return Array.from(merged.values()).sort((a, b) =>
        b.createdAtIso.localeCompare(a.createdAtIso)
      );
    }
    return localNotifications;
  }, [user, firestoreNotifications, localNotifications]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      showToast('Signed In', `Welcome back, ${cred.user.displayName || cred.user.email}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete sign-in.';
      showToast('Sign-In Cancelled', msg);
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Signed Out', 'You have been signed out of your account.');
  }, [showToast]);

  const seedCatalogToFirestore = useCallback(async () => {
    if (!isAdmin) return;
    const batch = writeBatch(db);
    for (const p of SEED_PRODUCTS) {
      const ref = doc(db, 'products', p.id);
      batch.set(ref, {
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        ...(p.compareAtPrice !== undefined ? { compareAtPrice: p.compareAtPrice } : {}),
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        rating: p.rating,
        reviewCount: p.reviewCount,
        ...(p.badge ? { badge: p.badge } : {}),
        shortDescription: p.shortDescription,
        ...(p.ingredients ? { ingredients: p.ingredients } : {}),
        sizeLabel: p.sizeLabel,
        imageUrl: p.imageUrl,
        featured: p.featured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
      showToast('Database Synced', 'Seed catalog published to Cloud Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  }, [isAdmin, showToast]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, openDrawer = true) => {
      if (product.stock <= 0) {
        showToast('Out of Stock', `${product.name} is currently sold out.`);
        return;
      }

      setCart((prev) => {
        const existingItem = prev.find((i) => i.productId === product.id);
        const desiredQty = (existingItem?.quantity ?? 0) + quantity;
        const clampedQty = canAdjustCartQuantity(product.stock, desiredQty);
        if (clampedQty <= 0) return prev;

        if (existingItem) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: clampedQty, price: product.price } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            imageUrl: product.imageUrl,
            sizeLabel: product.sizeLabel,
            quantity: clampedQty,
          },
        ];
      });

      if (openDrawer) {
        setIsCartOpen(true);
      } else {
        showToast('Added to Bag', `${product.name} added to your shopping bag.`);
      }
    },
    [showToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = products.find((p) => p.id === productId);
      const maxStock = product?.stock ?? 99;
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
        return;
      }
      const clamped = canAdjustCartQuantity(maxStock, quantity);
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: clamped } : item
        )
      );
    },
    [products]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const placeOrder = useCallback(
    async (
      form: CheckoutFormInput,
      promoCode?: string
    ): Promise<{ ok: boolean; order?: Order; error?: string }> => {
      const validation = validateCheckoutForm(form);
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0] ?? 'Please check your checkout details.';
        return { ok: false, error: firstError };
      }

      const nowIso = new Date().toISOString();
      const deduction = applyOrderStockDeductions(products, cart, nowIso);
      if (!deduction.ok) {
        return { ok: false, error: deduction.error };
      }

      const totals = calculateCartTotals(cart, promoCode);
      const orderNumber = generateOrderNumber();
      const orderId = `ord-${Date.now()}`;
      const ownerId = user?.uid ?? 'demo-customer';
      const isInstantPaid = form.paymentMethod !== 'cod';

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: ownerId,
        customerName: sanitizeText(form.customerName, 100),
        customerEmail: sanitizeText(form.customerEmail, 160),
        customerPhone: sanitizeText(form.customerPhone, 30),
        shippingAddress: sanitizeText(form.shippingAddress, 250),
        city: sanitizeText(form.city, 80),
        postalCode: sanitizeText(form.postalCode, 20),
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference.trim()
          ? sanitizeText(form.paymentReference, 64)
          : undefined,
        paymentStatus: isInstantPaid ? 'paid' : 'pending',
        status: 'placed',
        trackingNote: getDefaultTrackingNote('placed', orderNumber),
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };

      const customerNotif: OrderNotification = {
        id: `notif-cust-${Date.now()}`,
        userId: ownerId,
        orderId,
        orderNumber,
        title: `Order ${orderNumber} Confirmed`,
        message: `We received your ${form.paymentMethod.toUpperCase()} order totaling ৳${totals.totalAmount.toFixed(2)}.`,
        type: 'order_placed',
        read: false,
        createdAtIso: nowIso,
      };

      const adminNotif: OrderNotification = {
        id: `notif-adm-${Date.now() + 1}`,
        userId: 'admin',
        orderId,
        orderNumber,
        title: `New Order ${orderNumber}`,
        message: `${newOrder.customerName} placed an order for ৳${totals.totalAmount.toFixed(2)}.`,
        type: 'order_placed',
        read: false,
        createdAtIso: nowIso,
      };

      const lowStockNotifs: OrderNotification[] = deduction.lowStockProducts.map((p, idx) => ({
        id: `notif-stock-${Date.now() + idx + 2}`,
        userId: 'admin',
        title: `Low Stock Alert: ${p.name}`,
        message: `SKU ${p.sku} has ${p.stock} unit(s) remaining (threshold: ${p.lowStockThreshold}).`,
        type: 'low_stock',
        read: false,
        createdAtIso: nowIso,
      }));

      // Persist to Firestore if authenticated & verified
      if (user && user.emailVerified) {
        const batch = writeBatch(db);
        const orderRef = doc(db, 'orders', orderId);
        batch.set(orderRef, {
          orderNumber: newOrder.orderNumber,
          userId: newOrder.userId,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail,
          customerPhone: newOrder.customerPhone,
          shippingAddress: newOrder.shippingAddress,
          city: newOrder.city,
          postalCode: newOrder.postalCode,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          shippingFee: newOrder.shippingFee,
          discountAmount: newOrder.discountAmount,
          totalAmount: newOrder.totalAmount,
          paymentMethod: newOrder.paymentMethod,
          ...(newOrder.paymentReference ? { paymentReference: newOrder.paymentReference } : {}),
          paymentStatus: newOrder.paymentStatus,
          status: newOrder.status,
          trackingNote: newOrder.trackingNote,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (firestoreCatalogActive) {
          for (const updatedProd of deduction.updatedProducts) {
            const oldProd = products.find((p) => p.id === updatedProd.id);
            if (oldProd && oldProd.stock !== updatedProd.stock) {
              batch.update(doc(db, 'products', updatedProd.id), {
                stock: updatedProd.stock,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        batch.set(doc(db, 'notifications', customerNotif.id), {
          userId: customerNotif.userId,
          orderId: customerNotif.orderId,
          orderNumber: customerNotif.orderNumber,
          title: customerNotif.title,
          message: customerNotif.message,
          type: customerNotif.type,
          read: false,
          createdAt: serverTimestamp(),
        });

        batch.set(doc(db, 'notifications', adminNotif.id), {
          userId: 'admin',
          orderId: adminNotif.orderId,
          orderNumber: adminNotif.orderNumber,
          title: adminNotif.title,
          message: adminNotif.message,
          type: adminNotif.type,
          read: false,
          createdAt: serverTimestamp(),
        });

        for (const lowNotif of lowStockNotifs) {
          batch.set(doc(db, 'notifications', lowNotif.id), {
            userId: 'admin',
            title: lowNotif.title,
            message: lowNotif.message,
            type: lowNotif.type,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'orders');
        }
      }

      if (!firestoreCatalogActive) {
        setLocalProducts(deduction.updatedProducts);
      }
      setLocalOrders((prev) => [newOrder, ...prev]);
      setLocalNotifications((prev) => [customerNotif, adminNotif, ...lowStockNotifs, ...prev]);
      setSelectedTrackOrderNumber(orderNumber);
      setCart([]);

      showToast('Order Placed', `Order ${orderNumber} confirmed and inventory updated.`);
      return { ok: true, order: newOrder };
    },
    [products, cart, user, firestoreCatalogActive, showToast]
  );

  const updateOrderDetails = useCallback(
    async (
      orderId: string,
      updates: { status: OrderStatus; paymentStatus: PaymentStatus; trackingNote: string }
    ) => {
      const target = orders.find((o) => o.id === orderId);
      if (!target) return;

      const nowIso = new Date().toISOString();
      const note = sanitizeText(updates.trackingNote, 240) || getDefaultTrackingNote(updates.status, target.orderNumber);

      if (isAdmin && firestoreOrders.some((o) => o.id === orderId)) {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status: updates.status,
            paymentStatus: updates.paymentStatus,
            trackingNote: note,
            updatedAt: serverTimestamp(),
          });

          const notifId = `notif-status-${Date.now()}`;
          await setDoc(doc(db, 'notifications', notifId), {
            userId: target.userId,
            orderId: target.id,
            orderNumber: target.orderNumber,
            title: `Order ${target.orderNumber}: ${updates.status.toUpperCase()}`,
            message: note,
            type: 'status_update',
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
        }
      }

      setLocalOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: updates.status,
                paymentStatus: updates.paymentStatus,
                trackingNote: note,
                updatedAtIso: nowIso,
              }
            : o
        )
      );

      const notif: OrderNotification = {
        id: `notif-status-${Date.now()}`,
        userId: target.userId,
        orderId: target.id,
        orderNumber: target.orderNumber,
        title: `Order ${target.orderNumber} ${updates.status === 'delivered' ? 'Delivered' : `Updated to ${updates.status}`}`,
        message: note,
        type: 'status_update',
        read: false,
        createdAtIso: nowIso,
      };
      setLocalNotifications((prev) => [notif, ...prev]);
      showToast('Order Updated', `${target.orderNumber} marked as ${updates.status}.`);
    },
    [orders, isAdmin, firestoreOrders, showToast]
  );

  const advanceOrderStatus = useCallback(
    async (orderId: string) => {
      const target = orders.find((o) => o.id === orderId);
      if (!target) return;
      const next = getNextOrderStatus(target.status);
      if (!next) return;
      const nextPayment: PaymentStatus =
        next === 'delivered' ? 'paid' : target.paymentStatus;
      await updateOrderDetails(orderId, {
        status: next,
        paymentStatus: nextPayment,
        trackingNote: getDefaultTrackingNote(next, target.orderNumber),
      });
    },
    [orders, updateOrderDetails]
  );

  const cancelCustomerOrder = useCallback(
    async (orderId: string) => {
      const target = orders.find((o) => o.id === orderId);
      if (!target || target.status !== 'placed') return;

      const nowIso = new Date().toISOString();
      const note = `Order ${target.orderNumber} was cancelled by customer.`;

      if (user && user.emailVerified && firestoreOrders.some((o) => o.id === orderId)) {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'cancelled',
            trackingNote: note,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
        }
      }

      setLocalOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'cancelled', trackingNote: note, updatedAtIso: nowIso }
            : o
        )
      );

      setLocalNotifications((prev) => [
        {
          id: `notif-cancel-${Date.now()}`,
          userId: target.userId,
          orderId: target.id,
          orderNumber: target.orderNumber,
          title: `Order ${target.orderNumber} Cancelled`,
          message: note,
          type: 'status_update',
          read: false,
          createdAtIso: nowIso,
        },
        ...prev,
      ]);
      showToast('Order Cancelled', `${target.orderNumber} has been cancelled.`);
    },
    [orders, user, firestoreOrders, showToast]
  );

  const adjustProductStock = useCallback(
    async (productId: string, delta: number) => {
      const target = products.find((p) => p.id === productId);
      if (!target) return;
      const nextStock = Math.max(0, Math.floor(target.stock + delta));
      const nowIso = new Date().toISOString();

      if (isAdmin && firestoreCatalogActive) {
        try {
          await updateDoc(doc(db, 'products', productId), {
            stock: nextStock,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
        }
      } else {
        setLocalProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stock: nextStock, updatedAtIso: nowIso } : p
          )
        );
      }

      if (nextStock <= target.lowStockThreshold && nextStock < target.stock) {
        setLocalNotifications((prev) => [
          {
            id: `notif-low-${Date.now()}`,
            userId: 'admin',
            title: `Low Stock Alert: ${target.name}`,
            message: `SKU ${target.sku} is now at ${nextStock} unit(s).`,
            type: 'low_stock',
            read: false,
            createdAtIso: nowIso,
          },
          ...prev,
        ]);
      }
    },
    [products, isAdmin, firestoreCatalogActive]
  );

  const saveProduct = useCallback(
    async (input: ProductSaveInput): Promise<{ ok: boolean; error?: string }> => {
      const cleanName = sanitizeText(input.name, 120);
      const cleanSku = sanitizeText(input.sku, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, '-');
      const cleanDesc = sanitizeText(input.shortDescription, 300);

      if (cleanName.length < 2) return { ok: false, error: 'Product name must be at least 2 characters.' };
      if (cleanSku.length < 3) return { ok: false, error: 'SKU must be at least 3 characters.' };
      if (input.price <= 0) return { ok: false, error: 'Price must be greater than ৳0.' };
      if (input.stock < 0) return { ok: false, error: 'Stock cannot be negative.' };
      if (cleanDesc.length < 5) return { ok: false, error: 'Description must be at least 5 characters.' };

      const nowIso = new Date().toISOString();
      const id = input.id || `prod-${Date.now()}`;
      const existingProd = products.find((p) => p.id === id);

      const nextProduct: Product = {
        id,
        name: cleanName,
        sku: cleanSku,
        category: input.category,
        price: Number(input.price),
        compareAtPrice:
          input.compareAtPrice && input.compareAtPrice >= input.price
            ? Number(input.compareAtPrice)
            : undefined,
        stock: Math.floor(input.stock),
        lowStockThreshold: Math.max(0, Math.floor(input.lowStockThreshold)),
        rating: existingProd?.rating ?? 4.9,
        reviewCount: existingProd?.reviewCount ?? 1,
        badge: input.badge?.trim() ? sanitizeText(input.badge, 32) : undefined,
        shortDescription: cleanDesc,
        ingredients: input.ingredients?.trim() ? sanitizeText(input.ingredients, 500) : undefined,
        sizeLabel: sanitizeText(input.sizeLabel || '30 ml', 40),
        imageUrl: sanitizeText(
          input.imageUrl || '/src/assets/images/product_vitamin_c_serum_1795428076477.jpg',
          300
        ),
        featured: input.featured,
        createdAtIso: existingProd?.createdAtIso ?? nowIso,
        updatedAtIso: nowIso,
      };

      if (isAdmin && firestoreCatalogActive) {
        try {
          const ref = doc(db, 'products', id);
          if (existingProd) {
            await updateDoc(ref, {
              name: nextProduct.name,
              sku: nextProduct.sku,
              category: nextProduct.category,
              price: nextProduct.price,
              ...(nextProduct.compareAtPrice !== undefined
                ? { compareAtPrice: nextProduct.compareAtPrice }
                : {}),
              stock: nextProduct.stock,
              lowStockThreshold: nextProduct.lowStockThreshold,
              ...(nextProduct.badge ? { badge: nextProduct.badge } : {}),
              shortDescription: nextProduct.shortDescription,
              ...(nextProduct.ingredients ? { ingredients: nextProduct.ingredients } : {}),
              sizeLabel: nextProduct.sizeLabel,
              imageUrl: nextProduct.imageUrl,
              featured: nextProduct.featured,
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(ref, {
              name: nextProduct.name,
              sku: nextProduct.sku,
              category: nextProduct.category,
              price: nextProduct.price,
              ...(nextProduct.compareAtPrice !== undefined
                ? { compareAtPrice: nextProduct.compareAtPrice }
                : {}),
              stock: nextProduct.stock,
              lowStockThreshold: nextProduct.lowStockThreshold,
              rating: nextProduct.rating,
              reviewCount: nextProduct.reviewCount,
              ...(nextProduct.badge ? { badge: nextProduct.badge } : {}),
              shortDescription: nextProduct.shortDescription,
              ...(nextProduct.ingredients ? { ingredients: nextProduct.ingredients } : {}),
              sizeLabel: nextProduct.sizeLabel,
              imageUrl: nextProduct.imageUrl,
              featured: nextProduct.featured,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `products/${id}`);
        }
      } else {
        setLocalProducts((prev) => {
          const exists = prev.some((p) => p.id === id);
          if (exists) return prev.map((p) => (p.id === id ? nextProduct : p));
          return [nextProduct, ...prev];
        });
      }

      showToast('Inventory Saved', `${nextProduct.name} (${nextProduct.stock} in stock) updated.`);
      return { ok: true };
    },
    [products, isAdmin, firestoreCatalogActive, showToast]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (isAdmin && firestoreCatalogActive) {
        try {
          await deleteDoc(doc(db, 'products', productId));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
        }
      } else {
        setLocalProducts((prev) => prev.filter((p) => p.id !== productId));
      }
      setCart((prev) => prev.filter((c) => c.productId !== productId));
      showToast('Product Removed', 'Item removed from store catalog.');
    },
    [isAdmin, firestoreCatalogActive, showToast]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (user && user.emailVerified && firestoreNotifications.some((n) => n.id === notificationId)) {
        try {
          await updateDoc(doc(db, 'notifications', notificationId), { read: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
        }
      }
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    },
    [user, firestoreNotifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (user && user.emailVerified && firestoreNotifications.some((n) => !n.read)) {
      const batch = writeBatch(db);
      for (const n of firestoreNotifications) {
        if (!n.read) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'notifications');
      }
    }
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user, firestoreNotifications]);

  const value: StoreContextValue = {
    activeView,
    setActiveView,
    selectedTrackOrderNumber,
    setSelectedTrackOrderNumber,
    user,
    authReady,
    isAdmin,
    firestoreConnected,
    firestoreCatalogActive,
    products,
    cart,
    cartCount,
    orders,
    notifications,
    unreadNotificationCount,
    isCartOpen,
    setIsCartOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    quickViewProduct,
    setQuickViewProduct,
    toast,
    dismissToast,
    signInWithGoogle,
    logout,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    advanceOrderStatus,
    updateOrderDetails,
    cancelCustomerOrder,
    adjustProductStock,
    saveProduct,
    deleteProduct,
    seedCatalogToFirestore,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
