import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOrderStockDeductions,
  calculateCartTotals,
  canAdjustCartQuantity,
  canCustomerCancelOrder,
  emailToPermissionDocId,
  filterAndSortProducts,
  formatCurrency,
  getNextOrderStatus,
  hasAdminPermission,
  resolveAdminAccess,
  validateCheckoutForm,
} from './commerce';
import { SEED_PRODUCTS } from '../data/seedCatalog';
import type { StaffPermission } from '../types/commerce';

test('formatCurrency formats amounts in Taka (৳)', () => {
  assert.equal(formatCurrency(38), '৳38.00');
  assert.equal(formatCurrency(42.5), '৳42.50');
});

test('calculateCartTotals computes subtotal, promo discount, and free shipping threshold', () => {
  const belowThreshold = calculateCartTotals([{ price: 30, quantity: 1 }]);
  assert.equal(belowThreshold.subtotal, 30);
  assert.equal(belowThreshold.shippingFee, 6.5);
  assert.equal(belowThreshold.totalAmount, 36.5);
  assert.equal(belowThreshold.freeShippingRemaining, 20);

  const aboveThreshold = calculateCartTotals([{ price: 38, quantity: 2 }]);
  assert.equal(aboveThreshold.subtotal, 76);
  assert.equal(aboveThreshold.shippingFee, 0);
  assert.equal(aboveThreshold.totalAmount, 76);

  const withPromo = calculateCartTotals([{ price: 60, quantity: 1 }], 'glow15');
  assert.equal(withPromo.discountAmount, 9);
  assert.equal(withPromo.appliedPromoCode, 'GLOW15');
  assert.equal(withPromo.shippingFee, 0);
  assert.equal(withPromo.totalAmount, 51);
});

test('validateCheckoutForm rejects invalid inputs and accepts complete COD or bKash checkout', () => {
  const invalid = validateCheckoutForm({
    customerName: 'A',
    customerEmail: 'bad-email',
    customerPhone: '12',
    shippingAddress: 'x',
    city: '',
    postalCode: '',
    paymentMethod: 'bkash',
    paymentReference: '123',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.customerEmail);
  assert.ok(invalid.errors.paymentReference);

  const validCod = validateCheckoutForm({
    customerName: 'Nadia Rahman',
    customerEmail: 'nadia@example.com',
    customerPhone: '+8801711004812',
    shippingAddress: 'House 24, Road 11, Banani',
    city: 'Dhaka',
    postalCode: '1213',
    paymentMethod: 'cod',
    paymentReference: '',
  });
  assert.equal(validCod.valid, true);
});

test('applyOrderStockDeductions decrements stock and flags low-stock thresholds', () => {
  const res = applyOrderStockDeductions(
    SEED_PRODUCTS,
    [{ productId: 'prod-velvet-rose-blush-balm', name: 'Peony Velvet Cheek & Lip Balm', quantity: 2 }],
    '2026-11-23T00:00:00.000Z'
  );
  assert.equal(res.ok, true);
  const updated = res.updatedProducts.find((p) => p.id === 'prod-velvet-rose-blush-balm');
  assert.equal(updated?.stock, 2);
  assert.equal(res.lowStockProducts.length, 1);

  const overStock = applyOrderStockDeductions(
    SEED_PRODUCTS,
    [{ productId: 'prod-velvet-rose-blush-balm', name: 'Peony Velvet Cheek & Lip Balm', quantity: 99 }],
    '2026-11-23T00:00:00.000Z'
  );
  assert.equal(overStock.ok, false);
  assert.match(overStock.error ?? '', /Only 4 unit/);
});

test('order status state machine & cart quantity clamp', () => {
  assert.equal(getNextOrderStatus('placed'), 'processing');
  assert.equal(getNextOrderStatus('processing'), 'shipped');
  assert.equal(getNextOrderStatus('shipped'), 'delivered');
  assert.equal(getNextOrderStatus('delivered'), null);
  assert.equal(canCustomerCancelOrder('placed'), true);
  assert.equal(canCustomerCancelOrder('shipped'), false);
  assert.equal(canAdjustCartQuantity(5, 10), 5);
  assert.equal(canAdjustCartQuantity(0, 3), 0);
});

test('filterAndSortProducts filters by category/search and sorts by price', () => {
  const skincare = filterAndSortProducts(SEED_PRODUCTS, 'Skincare', 'serum', 'price_asc');
  assert.equal(skincare.length, 1);
  assert.equal(skincare[0].id, 'prod-vitamin-c-serum');

  const allAsc = filterAndSortProducts(SEED_PRODUCTS, 'All', '', 'price_asc');
  assert.ok(allAsc[0].price <= allAsc[1].price);
});

test('resolveAdminAccess grants full access to verified owner and scopes staff permissions strictly', () => {
  const staff: StaffPermission[] = [
    {
      id: 'staff_at_example_dot_com',
      email: 'staff@example.com',
      name: 'Inventory Clerk',
      permissions: ['manage_stock', 'manage_permissions'],
      active: true,
      grantedBy: 'parvejmollik2022@gmail.com',
      createdAtIso: '2026-11-23T00:00:00.000Z',
      updatedAtIso: '2026-11-23T00:00:00.000Z',
    },
    {
      id: 'paused_at_example_dot_com',
      email: 'paused@example.com',
      name: 'Paused Staff',
      permissions: ['manage_orders'],
      active: false,
      grantedBy: 'parvejmollik2022@gmail.com',
      createdAtIso: '2026-11-23T00:00:00.000Z',
      updatedAtIso: '2026-11-23T00:00:00.000Z',
    },
  ];

  // Unauthenticated / random customer gets zero admin access
  const anon = resolveAdminAccess(null, false, staff);
  assert.equal(anon.canAccessAdmin, false);
  assert.equal(anon.permissions.length, 0);

  const shopper = resolveAdminAccess('customer@example.com', true, staff);
  assert.equal(shopper.canAccessAdmin, false);

  // Unverified owner email gets zero access
  const unverifiedOwner = resolveAdminAccess('parvejmollik2022@gmail.com', false, staff);
  assert.equal(unverifiedOwner.canAccessAdmin, false);

  // Verified owner gets all 5 permissions
  const owner = resolveAdminAccess('parvejmollik2022@gmail.com', true, staff);
  assert.equal(owner.isOwner, true);
  assert.equal(owner.canAccessAdmin, true);
  assert.equal(hasAdminPermission(owner.permissions, 'manage_permissions'), true);
  assert.equal(hasAdminPermission(owner.permissions, 'manage_orders'), true);

  // Staff gets ONLY granted permissions (and never manage_permissions)
  const permitted = resolveAdminAccess('staff@example.com', true, staff);
  assert.equal(permitted.isOwner, false);
  assert.equal(permitted.canAccessAdmin, true);
  assert.equal(hasAdminPermission(permitted.permissions, 'manage_stock'), true);
  assert.equal(hasAdminPermission(permitted.permissions, 'manage_orders'), false);
  assert.equal(hasAdminPermission(permitted.permissions, 'manage_permissions'), false);

  // Paused staff loses access immediately
  const paused = resolveAdminAccess('paused@example.com', true, staff);
  assert.equal(paused.canAccessAdmin, false);

  assert.equal(emailToPermissionDocId('Alice.Smith@Gmail.com'), 'alice_smith_gmail_com');
});
