import { useState } from 'react';
import { Minus, Plus, Star, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/commerce';
import { ProductImage } from './ProductImage';

export function ProductModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);

  if (!quickViewProduct) return null;

  const outOfStock = quickViewProduct.stock <= 0;
  const maxQty = Math.max(1, quickViewProduct.stock);
  const clampedQty = Math.min(quantity, maxQty);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={() => {
        setQuantity(1);
        setQuickViewProduct(null);
      }}
    >
      <div
        className="bg-white rounded-2xl border border-[#E6E2DA] max-w-3xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#F8F6F3] aspect-[4/3] md:aspect-auto md:h-full">
          <ProductImage
            src={quickViewProduct.imageUrl}
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="text-xs text-[#5B6B66]">
              <span>{quickViewProduct.category}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono">{quickViewProduct.sku}</span>
              <span aria-hidden="true"> · </span>
              <span>{quickViewProduct.sizeLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuantity(1);
                setQuickViewProduct(null);
              }}
              aria-label="Close product details"
              className="p-1.5 text-[#5B6B66] hover:text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2
            id="product-modal-title"
            className="font-display text-3xl font-semibold text-[#172320] mb-2"
          >
            {quickViewProduct.name}
          </h2>

          <div className="flex items-center gap-2 text-xs text-[#5B6B66] mb-4 tabular-nums">
            <Star className="w-4 h-4 fill-[#D97706] text-[#D97706]" aria-hidden="true" />
            <span className="font-semibold text-[#172320]">
              {quickViewProduct.rating.toFixed(1)}
            </span>
            <span>({quickViewProduct.reviewCount} reviews)</span>
            <span aria-hidden="true">·</span>
            <span className={outOfStock ? 'text-[#B91C1C] font-medium' : 'text-[#15803D] font-medium'}>
              {outOfStock ? 'Out of stock' : `${quickViewProduct.stock} units available`}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5 mb-5 tabular-nums">
            <span className="text-2xl font-semibold text-[#172320]">
              {formatCurrency(quickViewProduct.price)}
            </span>
            {quickViewProduct.compareAtPrice && (
              <span className="text-sm text-[#7D8C87] line-through">
                {formatCurrency(quickViewProduct.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="text-sm text-[#374742] leading-relaxed mb-5">
            {quickViewProduct.shortDescription}
          </p>

          {quickViewProduct.ingredients && (
            <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg p-3.5 mb-6">
              <p className="text-xs font-semibold text-[#172320] mb-1">Key Ingredients</p>
              <p className="text-xs text-[#5B6B66] leading-relaxed">
                {quickViewProduct.ingredients}
              </p>
            </div>
          )}

          <div className="mt-auto flex items-center gap-3">
            <div className="flex items-center border border-[#E6E2DA] rounded-lg bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={clampedQty <= 1 || outOfStock}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 text-[#172320] disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold tabular-nums min-w-[2.25rem] text-center">
                {outOfStock ? 0 : clampedQty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={clampedQty >= maxQty || outOfStock}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="p-3 text-[#172320] disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addToCart(quickViewProduct, clampedQty, true);
                setQuantity(1);
                setQuickViewProduct(null);
              }}
              className="flex-1 py-3 px-5 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] disabled:bg-[#D1D5DB] disabled:text-[#6B7280] transition-colors"
            >
              {outOfStock ? 'Currently Sold Out' : 'Add to Shopping Bag'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
