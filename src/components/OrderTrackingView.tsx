import { useEffect, useState } from 'react';
import { Check, Package, Search, Truck, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  canCustomerCancelOrder,
  formatCurrency,
  ORDER_TIMELINE_STEPS,
} from '../utils/commerce';
import { ProductImage } from './ProductImage';

export function OrderTrackingView() {
  const {
    orders,
    selectedTrackOrderNumber,
    setSelectedTrackOrderNumber,
    cancelCustomerOrder,
    setActiveView,
  } = useStore();

  const [lookupInput, setLookupInput] = useState(selectedTrackOrderNumber || '');

  useEffect(() => {
    if (selectedTrackOrderNumber) {
      setLookupInput(selectedTrackOrderNumber);
    }
  }, [selectedTrackOrderNumber]);

  const activeOrder =
    orders.find(
      (o) => o.orderNumber.toUpperCase() === selectedTrackOrderNumber.trim().toUpperCase()
    ) || orders[0];

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    setSelectedTrackOrderNumber(lookupInput.trim().toUpperCase());
  };

  const currentStepIndex = activeOrder
    ? ORDER_TIMELINE_STEPS.findIndex((s) => s.status === activeOrder.status)
    : -1;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
            Live Fulfillment Status
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#172320]">
            Track Your Order
          </h1>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="w-4 h-4 text-[#5B6B66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="order-lookup-input" className="sr-only">
              Order Number
            </label>
            <input
              id="order-lookup-input"
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Enter Order # e.g. AB-1042"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-[#103C32]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-medium rounded-lg hover:bg-[#0B2B24] transition-colors whitespace-nowrap shrink-0"
          >
            Track
          </button>
        </form>
      </div>

      {/* Recent Order Switcher */}
      {orders.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium text-[#5B6B66] mb-2.5">Recent Orders</p>
          <div className="flex flex-wrap gap-2">
            {orders.slice(0, 6).map((ord) => {
              const selected = activeOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedTrackOrderNumber(ord.orderNumber)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2 ${
                    selected
                      ? 'bg-[#103C32] text-white border-[#103C32]'
                      : 'bg-white text-[#172320] border-[#E6E2DA] hover:border-[#103C32]'
                  }`}
                >
                  <span className="font-mono">{ord.orderNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{ord.status}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!activeOrder ? (
        <div className="bg-white border border-[#E6E2DA] rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-[#103C32] mx-auto mb-3" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[#172320] mb-2">
            No order matched that number
          </h2>
          <p className="text-sm text-[#5B6B66] mb-6">
            Check your confirmation number or place a new order from the storefront.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('storefront')}
            className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-medium rounded-lg hover:bg-[#0B2B24]"
          >
            Back to Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Status Timeline & Items */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white border border-[#E6E2DA] rounded-xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#F0ECE4]">
                <div>
                  <p className="text-xs text-[#5B6B66] mb-1">
                    Placed {new Date(activeOrder.createdAtIso).toLocaleDateString()} ·{' '}
                    <span className="uppercase">{activeOrder.paymentMethod}</span> (
                    {activeOrder.paymentStatus})
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-[#172320]">
                    Order <span className="font-mono text-2xl">{activeOrder.orderNumber}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                      activeOrder.status === 'cancelled'
                        ? 'bg-[#FEF2F2] text-[#B91C1C]'
                        : activeOrder.status === 'delivered'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#F3EFE8] text-[#103C32]'
                    }`}
                  >
                    {activeOrder.status}
                  </span>

                  {canCustomerCancelOrder(activeOrder.status) && (
                    <button
                      type="button"
                      onClick={() => void cancelCustomerOrder(activeOrder.id)}
                      className="px-3.5 py-1.5 border border-[#FECACA] text-[#B91C1C] text-xs font-medium rounded-lg hover:bg-[#FEF2F2] transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {activeOrder.status === 'cancelled' ? (
                <div className="py-6 flex items-start gap-3 text-[#B91C1C]">
                  <XCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">Order Cancelled</p>
                    <p className="text-xs text-[#5B6B66] mt-1">{activeOrder.trackingNote}</p>
                  </div>
                </div>
              ) : (
                <div className="py-7">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {ORDER_TIMELINE_STEPS.map((step, idx) => {
                      const completed = idx <= currentStepIndex;
                      const current = idx === currentStepIndex;
                      return (
                        <div
                          key={step.status}
                          className={`p-3.5 rounded-xl border ${
                            current
                              ? 'border-[#103C32] bg-[#FAF9F6]'
                              : completed
                              ? 'border-[#D1FAE5] bg-[#F0FDF4]/60'
                              : 'border-[#F0ECE4] bg-white opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                                completed
                                  ? 'bg-[#103C32] text-white'
                                  : 'bg-[#E6E2DA] text-[#5B6B66]'
                              }`}
                            >
                              {completed ? <Check className="w-3 h-3" /> : idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-[#172320]">
                              {step.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5B6B66] leading-snug">
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-start gap-3">
                    <Truck className="w-4 h-4 text-[#103C32] mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-[#172320]">Latest Update</p>
                      <p className="text-xs text-[#5B6B66] mt-0.5">{activeOrder.trackingNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="pt-6 border-t border-[#F0ECE4]">
                <h3 className="text-sm font-semibold text-[#172320] mb-4">
                  Items in This Shipment
                </h3>
                <div className="divide-y divide-[#F0ECE4]">
                  {activeOrder.items.map((item) => (
                    <div
                      key={`${activeOrder.id}-${item.productId}`}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F8F6F3] shrink-0">
                          <ProductImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#172320] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#5B6B66] font-mono tabular-nums">
                            {item.sku} · Qty {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#172320] tabular-nums shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right: Receipt & Shipping Summary */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#E6E2DA] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#172320] mb-4">
                Delivery Destination
              </h3>
              <div className="text-sm text-[#374742] space-y-1">
                <p className="font-semibold text-[#172320]">{activeOrder.customerName}</p>
                <p>{activeOrder.shippingAddress}</p>
                <p>
                  {activeOrder.city}, {activeOrder.postalCode}
                </p>
                <p className="text-xs text-[#5B6B66] pt-2">{activeOrder.customerPhone}</p>
                <p className="text-xs text-[#5B6B66]">{activeOrder.customerEmail}</p>
              </div>
            </div>

            <div className="bg-white border border-[#E6E2DA] rounded-xl p-6 space-y-2.5 text-sm">
              <h3 className="font-semibold text-[#172320] mb-2">Order Summary</h3>
              <div className="flex justify-between text-[#5B6B66]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(activeOrder.subtotal)}</span>
              </div>
              {activeOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -{formatCurrency(activeOrder.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#5B6B66]">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {activeOrder.shippingFee === 0
                    ? 'Free'
                    : formatCurrency(activeOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-[#172320] pt-3 border-t border-[#F0ECE4]">
                <span>Total Paid / Due</span>
                <span className="tabular-nums">{formatCurrency(activeOrder.totalAmount)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
