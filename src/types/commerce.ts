export type ProductCategory =
  | 'Skincare'
  | 'Makeup'
  | 'Hair Care'
  | 'Fragrance'
  | 'Body Care';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Skincare',
  'Makeup',
  'Hair Care',
  'Fragrance',
  'Body Care',
];

export type PaymentMethod = 'card' | 'bkash' | 'nagad' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type NotificationType = 'order_placed' | 'status_update' | 'low_stock';

export const FIELD_LIMITS = {
  productNameMax: 120,
  skuMax: 40,
  shortDescMax: 300,
  ingredientsMax: 500,
  sizeLabelMax: 40,
  badgeMax: 32,
  customerNameMax: 100,
  emailMax: 160,
  phoneMax: 30,
  addressMax: 250,
  cityMax: 80,
  postalCodeMax: 20,
  trackingNoteMax: 240,
  maxLineItems: 20,
} as const;

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  shortDescription: string;
  ingredients?: string;
  sizeLabel: string;
  imageUrl: string;
  featured: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  sizeLabel: string;
  quantity: number;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  items: OrderLineItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNote: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface OrderNotification {
  id: string;
  userId: string;
  orderId?: string;
  orderNumber?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAtIso: string;
}

export interface CheckoutFormInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
}

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating_desc';

export type AppView = 'storefront' | 'track' | 'admin';
