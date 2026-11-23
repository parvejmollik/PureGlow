import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { CheckoutFormInput, Order, PaymentMethod } from '../types/commerce';
import {
  calculateCartTotals,
  formatCurrency,
  FREE_SHIPPING_THRESHOLD,
  validateCheckoutForm,
} from '../utils/commerce';
import { ProductImage } from './ProductImage';

type DrawerStep = 'bag' | 'checkout' | 'confirmed';

export function CartCheckoutDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    products,
    user,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
    setActiveView,
    setSelectedTrackOrderNumber,
  } = useStore();

  const [step, setStep] = useState<DrawerStep>('bag');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFormInput, string>>
  >({});

  const [form, setForm] = useState<CheckoutFormInput>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod',
    paymentReference: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.displayName || '',
        customerEmail: prev.customerEmail || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isCartOpen && cart.length > 0 && step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
    }
  }, [isCartOpen, cart.length, step]);

  if (!isCartOpen) return null;

  const totals = calculateCartTotals(cart, appliedPromo);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (code === 'GLOW15' || code === 'WELCOME10') {
      setAppliedPromo(code);
      setPromoFeedback(`${code} applied.`);
    } else {
      setAppliedPromo('');
      setPromoFeedback('Invalid code. Try GLOW15 or WELCOME10.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const validation = validateCheckoutForm(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;

    setSubmitting(true);
    try {
      const result = await placeOrder(form, appliedPromo);
      if (!result.ok || !result.order) {
        setSubmitError(result.error || 'Could not place order.');
        return;
      }
      setConfirmedOrder(result.order);
      setStep('confirmed');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    if (step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and Checkout"
      onClick={closeDrawer}
    >
      <div
        className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col border-l border-[#E6E2DA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E6E2DA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                aria-label="Back to shopping bag"
                className="p-1.5 -ml-1.5 text-[#5B6B66] hover:text-[#172320] rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-display text-2xl font-semibold text-[#172320]">
              {step === 'bag' && 'Shopping Bag'}
              {step === 'checkout' && 'Checkout & Payment'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close drawer"
            className="p-2 text-[#5B6B66] hover:text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Bag */}
        {step === 'bag' && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-[#EFECE4] flex items-center justify-center text-[#103C32] mb-4">
                    <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-[#172320] mb-1">
                    Your bag is empty
                  </p>
                  <p className="text-sm text-[#5B6B66] mb-6 max-w-xs">
                    Explore our botanical serums, clean foundations, and daily care essentials.
                  </p>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-medium rounded-lg hover:bg-[#0B2B24] transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <>
                  {/* Free Shipping Banner */}
                  <div className="bg-white border border-[#E6E2DA] rounded-xl p-3.5 text-xs text-[#374742]">
                    {totals.freeShippingRemaining > 0 ? (
                      <span>
                        Add{' '}
                        <strong className="font-semibold text-[#103C32] tabular-nums">
                          {formatCurrency(totals.freeShippingRemaining)}
                        </strong>{' '}
                        more for free express shipping (threshold ৳{FREE_SHIPPING_THRESHOLD}).
                      </span>
                    ) : (
                      <span className="font-medium text-[#15803D]">
                        You unlocked Free Express Shipping!
                      </span>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    {cart.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const maxStock = prod?.stock ?? item.quantity;
                      return (
                        <div
                          key={item.productId}
                          className="bg-white border border-[#E6E2DA] rounded-xl p-3.5 flex gap-3.5"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F8F6F3] shrink-0">
                            <ProductImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#172320] truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-[#5B6B66]">
                                  {item.sizeLabel} · {formatCurrency(item.price)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.productId)}
                                aria-label={`Remove ${item.name} from bag`}
                                className="p-1 text-[#7D8C87] hover:text-[#B91C1C] transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="inline-flex items-center border border-[#E6E2DA] rounded-lg">
                                <button
                                  type="button"
                                  aria-label={`Decrease ${item.name} quantity`}
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity - 1)
                                  }
                                  className="px-2.5 py-1.5 text-[#172320] hover:bg-[#FAF9F6]"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 text-xs font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase ${item.name} quantity`}
                                  disabled={item.quantity >= maxStock}
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.quantity + 1)
                                  }
                                  className="px-2.5 py-1.5 text-[#172320] hover:bg-[#FAF9F6] disabled:opacity-40"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-sm font-semibold text-[#172320] tabular-nums">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Code */}
                  <form onSubmit={handleApplyPromo} className="pt-2">
                    <label
                      htmlFor="promo-code-input"
                      className="block text-xs font-medium text-[#465752] mb-1.5"
                    >
                      Promo Code (try GLOW15)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-code-input"
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="GLOW15"
                        className="flex-1 px-3 py-2 bg-white border border-[#E6E2DA] rounded-lg text-sm uppercase font-mono focus:outline-none focus:border-[#103C32]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#EFECE4] text-[#172320] text-sm font-medium rounded-lg hover:bg-[#E4DFD3] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoFeedback && (
                      <p className="text-xs text-[#103C32] mt-1.5">{promoFeedback}</p>
                    )}
                  </form>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-[#E6E2DA] space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#5B6B66]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>Discount ({totals.appliedPromoCode})</span>
                      <span className="tabular-nums">-{formatCurrency(totals.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5B6B66]">
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      {totals.shippingFee === 0 ? 'Free' : formatCurrency(totals.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#172320] pt-2 border-t border-[#F0ECE4]">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(totals.totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-5 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Checkout Form & Payment Options */}
        {step === 'checkout' && (
          <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {submitError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]"
                >
                  {submitError}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-[#172320] mb-3">
                  1. Delivery Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="chk-name"
                      className="block text-xs font-medium text-[#465752] mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="Nadia Rahman"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                    />
                    {fieldErrors.customerName && (
                      <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.customerName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="chk-email"
                        className="block text-xs font-medium text-[#465752] mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="chk-email"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                      />
                      {fieldErrors.customerEmail && (
                        <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.customerEmail}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="chk-phone"
                        className="block text-xs font-medium text-[#465752] mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        id="chk-phone"
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                        placeholder="+880 1711-000000"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                      />
                      {fieldErrors.customerPhone && (
                        <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="chk-address"
                      className="block text-xs font-medium text-[#465752] mb-1"
                    >
                      Street Address
                    </label>
                    <input
                      id="chk-address"
                      type="text"
                      value={form.shippingAddress}
                      onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                      placeholder="House 24, Road 11, Banani"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                    />
                    {fieldErrors.shippingAddress && (
                      <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.shippingAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="chk-city"
                        className="block text-xs font-medium text-[#465752] mb-1"
                      >
                        City
                      </label>
                      <input
                        id="chk-city"
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Dhaka"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                      />
                      {fieldErrors.city && (
                        <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="chk-postal"
                        className="block text-xs font-medium text-[#465752] mb-1"
                      >
                        Postal Code
                      </label>
                      <input
                        id="chk-postal"
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        placeholder="1213"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm focus:outline-none focus:border-[#103C32]"
                      />
                      {fieldErrors.postalCode && (
                        <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#172320] mb-3">
                  2. Payment Option
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: 'cod', label: 'Cash on Delivery', sub: 'Pay at doorstep', icon: Truck },
                      { id: 'bkash', label: 'bKash', sub: 'Mobile wallet', icon: Smartphone },
                      { id: 'nagad', label: 'Nagad', sub: 'Instant transfer', icon: Smartphone },
                      { id: 'card', label: 'Credit / Debit', sub: 'Visa & Mastercard', icon: CreditCard },
                    ] as { id: PaymentMethod; label: string; sub: string; icon: typeof Truck }[]
                  ).map((method) => {
                    const Icon = method.icon;
                    const active = form.paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, paymentMethod: method.id, paymentReference: '' })
                        }
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          active
                            ? 'bg-white border-[#103C32] ring-1 ring-[#103C32]'
                            : 'bg-white border-[#E6E2DA] hover:border-[#103C32]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <Icon className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
                          <span className="text-xs font-semibold text-[#172320]">
                            {method.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5B6B66]">{method.sub}</p>
                      </button>
                    );
                  })}
                </div>

                {form.paymentMethod !== 'cod' && (
                  <div className="mt-3">
                    <label
                      htmlFor="chk-payment-ref"
                      className="block text-xs font-medium text-[#465752] mb-1"
                    >
                      {form.paymentMethod === 'card'
                        ? 'Card Last 4 Digits / Authorization Ref'
                        : `${form.paymentMethod.toUpperCase()} Transaction ID`}
                    </label>
                    <input
                      id="chk-payment-ref"
                      type="text"
                      value={form.paymentReference}
                      onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                      placeholder={
                        form.paymentMethod === 'card' ? 'e.g. 4242' : 'e.g. TRX9A7210'
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm font-mono focus:outline-none focus:border-[#103C32]"
                    />
                    {fieldErrors.paymentReference && (
                      <p className="text-xs text-[#B91C1C] mt-1">
                        {fieldErrors.paymentReference}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-[#E6E2DA] space-y-3">
              <div className="flex justify-between text-sm font-semibold text-[#172320]">
                <span>Order Total ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="tabular-nums">{formatCurrency(totals.totalAmount)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Confirming Order...' : `Place Order · ${formatCurrency(totals.totalAmount)}`}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Order Confirmed */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
              Thank You, {confirmedOrder.customerName}
            </p>
            <h3 className="font-display text-3xl font-semibold text-[#172320] mb-2">
              Order {confirmedOrder.orderNumber} Confirmed
            </h3>
            <p className="text-sm text-[#5B6B66] mb-6 max-w-sm mx-auto leading-relaxed">
              We reserved your items and sent an instant order notification. Track live fulfillment
              status anytime.
            </p>

            <div className="bg-white border border-[#E6E2DA] rounded-xl p-4 text-left text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Order Number</span>
                <span className="font-mono font-semibold text-[#172320]">
                  {confirmedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Payment</span>
                <span className="font-medium text-[#172320] uppercase">
                  {confirmedOrder.paymentMethod} · {confirmedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Total</span>
                <span className="font-semibold text-[#172320] tabular-nums">
                  {formatCurrency(confirmedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedTrackOrderNumber(confirmedOrder.orderNumber);
                  setActiveView('track');
                  closeDrawer();
                }}
                className="w-full py-3 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors"
              >
                Track Order {confirmedOrder.orderNumber}
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-full py-3 bg-white border border-[#E6E2DA] text-[#172320] text-sm font-medium rounded-lg hover:bg-[#FAF9F6] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
