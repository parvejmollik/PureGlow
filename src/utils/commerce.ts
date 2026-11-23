import {
  FIELD_LIMITS,
  type CartItem,
  type CheckoutFormInput,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type SortOption,
} from '../types/commerce';

export const FREE_SHIPPING_THRESHOLD = 50;
export const STANDARD_SHIPPING_FEE = 6.5;

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingRemaining: number;
  appliedPromoCode: string | null;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(value: number): string {
  return `৳${roundCurrency(value).toFixed(2)}`;
}

export function calculateCartTotals(
  items: Pick<CartItem, 'price' | 'quantity'>[],
  promoCodeInput?: string
): CartTotals {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.quantity), 0)
  );

  const normalizedPromo = (promoCodeInput ?? '').trim().toUpperCase();
  let discountRate = 0;
  let appliedPromoCode: string | null = null;

  if (normalizedPromo === 'GLOW15' && subtotal > 0) {
    discountRate = 0.15;
    appliedPromoCode = 'GLOW15';
  } else if (normalizedPromo === 'WELCOME10' && subtotal > 0) {
    discountRate = 0.1;
    appliedPromoCode = 'WELCOME10';
  }

  const discountAmount = roundCurrency(subtotal * discountRate);
  const discountedSubtotal = roundCurrency(Math.max(0, subtotal - discountAmount));

  const shippingFee =
    subtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const totalAmount = roundCurrency(discountedSubtotal + shippingFee);
  const freeShippingRemaining =
    subtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : roundCurrency(FREE_SHIPPING_THRESHOLD - discountedSubtotal);

  return {
    subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    freeShippingRemaining,
    appliedPromoCode,
  };
}

export function canAdjustCartQuantity(availableStock: number, requestedQuantity: number): number {
  if (availableStock <= 0) return 0;
  if (requestedQuantity <= 0) return 0;
  return Math.min(availableStock, Math.floor(requestedQuantity));
}

export interface CheckoutValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CheckoutFormInput, string>>;
}

export function validateCheckoutForm(input: CheckoutFormInput): CheckoutValidationResult {
  const errors: Partial<Record<keyof CheckoutFormInput, string>> = {};

  const name = input.customerName.trim();
  const email = input.customerEmail.trim();
  const phone = input.customerPhone.trim();
  const address = input.shippingAddress.trim();
  const city = input.city.trim();
  const postalCode = input.postalCode.trim();
  const ref = input.paymentReference.trim();

  if (name.length < 2 || name.length > FIELD_LIMITS.customerNameMax) {
    errors.customerName = 'Enter your full name (2–100 characters).';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > FIELD_LIMITS.emailMax) {
    errors.customerEmail = 'Enter a valid email address for order updates.';
  }

  if (phone.length < 5 || phone.length > FIELD_LIMITS.phoneMax) {
    errors.customerPhone = 'Enter a valid delivery phone number.';
  }

  if (address.length < 5 || address.length > FIELD_LIMITS.addressMax) {
    errors.shippingAddress = 'Enter your street address and apartment/house details.';
  }

  if (city.length < 2 || city.length > FIELD_LIMITS.cityMax) {
    errors.city = 'Enter your city.';
  }

  if (postalCode.length < 2 || postalCode.length > FIELD_LIMITS.postalCodeMax) {
    errors.postalCode = 'Enter a postal or ZIP code.';
  }

  if (input.paymentMethod === 'card' && ref.length < 4) {
    errors.paymentReference = 'Enter the last 4 digits or cardholder reference.';
  }

  if ((input.paymentMethod === 'bkash' || input.paymentMethod === 'nagad') && ref.length < 6) {
    errors.paymentReference = 'Enter your mobile wallet Transaction ID (min 6 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface StockDeductionResult {
  ok: boolean;
  error?: string;
  updatedProducts: Product[];
  lowStockProducts: Product[];
}

export function applyOrderStockDeductions(
  products: Product[],
  cartItems: Pick<CartItem, 'productId' | 'name' | 'quantity'>[],
  nowIso: string
): StockDeductionResult {
  if (cartItems.length === 0) {
    return { ok: false, error: 'Your shopping bag is empty.', updatedProducts: products, lowStockProducts: [] };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of cartItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      return {
        ok: false,
        error: `Product "${item.name}" is no longer available.`,
        updatedProducts: products,
        lowStockProducts: [],
      };
    }
    if (item.quantity <= 0) {
      return {
        ok: false,
        error: `Invalid quantity for "${product.name}".`,
        updatedProducts: products,
        lowStockProducts: [],
      };
    }
    if (product.stock < item.quantity) {
      return {
        ok: false,
        error: `Only ${product.stock} unit(s) left for "${product.name}".`,
        updatedProducts: products,
        lowStockProducts: [],
      };
    }
  }

  const qtyByProduct = new Map<string, number>();
  for (const item of cartItems) {
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const lowStockProducts: Product[] = [];
  const updatedProducts = products.map((product) => {
    const deduct = qtyByProduct.get(product.id);
    if (!deduct) return product;
    const nextStock = Math.max(0, product.stock - deduct);
    const updated: Product = {
      ...product,
      stock: nextStock,
      updatedAtIso: nowIso,
    };
    if (nextStock <= updated.lowStockThreshold) {
      lowStockProducts.push(updated);
    }
    return updated;
  });

  return { ok: true, updatedProducts, lowStockProducts };
}

export const ORDER_TIMELINE_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'placed', label: 'Order Placed', description: 'Order confirmed & stock reserved' },
  { status: 'processing', label: 'Preparing', description: 'Items packed at PureGlow studio' },
  { status: 'shipped', label: 'Shipped', description: 'Handed over to express courier' },
  { status: 'delivered', label: 'Delivered', description: 'Signed & delivered to recipient' },
];

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'placed':
      return 'processing';
    case 'processing':
      return 'shipped';
    case 'shipped':
      return 'delivered';
    default:
      return null;
  }
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'placed';
}

export function getDefaultTrackingNote(status: OrderStatus, orderNumber: string): string {
  switch (status) {
    case 'placed':
      return `Order ${orderNumber} confirmed. Inventory reserved for fulfillment.`;
    case 'processing':
      return `Order ${orderNumber} is being quality checked and packed.`;
    case 'shipped':
      return `Order ${orderNumber} has shipped via tracked express delivery.`;
    case 'delivered':
      return `Order ${orderNumber} was delivered. Thank you for choosing PureGlow.`;
    case 'cancelled':
      return `Order ${orderNumber} was cancelled.`;
  }
}

export function filterAndSortProducts(
  products: Product[],
  category: ProductCategory | 'All',
  searchQuery: string,
  sortBy: SortOption
): Product[] {
  const q = searchQuery.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchesCategory = category === 'All' || p.category === category;
    const matchesSearch =
      q.length === 0 ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered];
  switch (sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'rating_desc':
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.reviewCount - a.reviewCount);
      break;
  }
  return sorted;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AB-${rand}`;
}
