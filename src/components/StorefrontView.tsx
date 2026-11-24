import { useState } from 'react';
import {
  ArrowRight,
  Award,
  HeartHandshake,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import {
  CATEGORY_SHOWCASE,
  CUSTOMER_TESTIMONIALS,
  HERO_IMAGE_URL,
} from '../data/seedCatalog';
import { useStore } from '../context/StoreContext';
import { PRODUCT_CATEGORIES, type ProductCategory, type SortOption } from '../types/commerce';
import { filterAndSortProducts, formatCurrency } from '../utils/commerce';
import { ProductImage } from './ProductImage';

interface StorefrontViewProps {
  selectedCategory: ProductCategory | 'All';
  onSelectCategory: (cat: ProductCategory | 'All') => void;
}

export function StorefrontView({
  selectedCategory,
  onSelectCategory,
}: StorefrontViewProps) {
  const { products, addToCart, setQuickViewProduct, setActiveView } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'subscribed' | 'error'>('idle');

  const filteredProducts = filterAndSortProducts(
    products,
    selectedCategory,
    searchQuery,
    sortBy
  );

  const handleCategoryClick = (cat: ProductCategory | 'All') => {
    onSelectCategory(cat);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setNewsletterStatus('error');
      return;
    }
    setNewsletterStatus('subscribed');
    setNewsletterEmail('');
  };

  return (
    <main>
      {/* 1. Split Botanical Hero */}
      <section className="bg-[#103C32] text-[#FAF9F6] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center py-4 lg:py-20">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#F3C4CE] mb-4">
                Natural Beauty Care
              </p>
              <h1
                className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.06] tracking-tight text-white mb-5"
                style={{ textWrap: 'balance' }}
              >
                Real Beauty Starts With Healthy Skin
              </h1>
              <p className="text-base text-[#D8E5DF] max-w-xl leading-relaxed mb-8">
                Discover clean botanical skincare, breathable complexion essentials, and daily
                rituals crafted with transparent active ingredients and real-time studio dispatch.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleCategoryClick('All')}
                  className="px-6 py-3.5 bg-[#F3C4CE] text-[#103C32] text-sm font-semibold rounded-lg hover:bg-[#F7D6DD] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('track')}
                  className="px-6 py-3.5 border border-white/25 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                >
                  Track an Order
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex items-stretch">
              <div className="w-full min-h-[320px] lg:min-h-[500px] rounded-xl lg:rounded-none overflow-hidden relative bg-[#0B2B24]">
                <ProductImage
                  src={HERO_IMAGE_URL}
                  alt="Model with radiant skin holding a pink peony against deep emerald foliage"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Column Trust Strip */}
      <section className="bg-white border-b border-[#E6E2DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center shrink-0 text-[#103C32]">
                <ShieldCheck className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172320]">100% Authentic</p>
                <p className="text-xs text-[#5B6B66]">Clean &amp; cruelty-free formulas</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center shrink-0 text-[#103C32]">
                <Truck className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172320]">Tracked Express Shipping</p>
                <p className="text-xs text-[#5B6B66]">Free over ৳50 · Live updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center shrink-0 text-[#103C32]">
                <RotateCcw className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172320]">Easy 30-Day Returns</p>
                <p className="text-xs text-[#5B6B66]">Hassle-free exchanges</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-center shrink-0 text-[#103C32]">
                <HeartHandshake className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172320]">Dermatologist Tested</p>
                <p className="text-xs text-[#5B6B66]">Gentle on sensitive skin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section
        id="categories-section"
        className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8"
      >
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
              Top Categories
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#172320]">
              Shop by Category
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleCategoryClick('All')}
            className="text-sm font-medium text-[#103C32] hover:underline whitespace-nowrap shrink-0"
          >
            View All ({products.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_SHOWCASE.map((cat) => {
            const count = products.filter((p) => p.category === cat.category).length;
            const isActive = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => handleCategoryClick(cat.category)}
                className={`group text-left bg-white rounded-xl border transition-all overflow-hidden ${
                  isActive
                    ? 'border-[#103C32] ring-1 ring-[#103C32]'
                    : 'border-[#E6E2DA] hover:border-[#103C32]/50'
                }`}
              >
                <div className="aspect-[4/3] bg-[#F3EFE8] overflow-hidden">
                  <ProductImage
                    src={cat.imageUrl}
                    alt={`${cat.category} collection`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold text-[#172320]">{cat.category}</p>
                  <p className="text-xs text-[#5B6B66] mt-0.5 tabular-nums">
                    {cat.subtitle} · {count}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Interactive Product Catalog */}
      <section
        id="catalog-section"
        className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
              Curated Essentials
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#172320]">
              Our Collection
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#5B6B66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search serums, SPF, SKU..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm text-[#172320] placeholder:text-[#7D8C87] focus:outline-none focus:border-[#103C32]"
              />
            </div>

            <div>
              <label htmlFor="product-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="product-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-[#E6E2DA] rounded-lg text-sm text-[#172320] focus:outline-none focus:border-[#103C32]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter products by category"
          className="flex items-center gap-2 overflow-x-auto pb-2 mb-8"
        >
          {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#103C32] text-white'
                    : 'bg-white border border-[#E6E2DA] text-[#465752] hover:border-[#103C32] hover:text-[#103C32]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Uniform Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E6E2DA] rounded-xl p-12 text-center">
            <p className="font-display text-2xl font-semibold text-[#172320] mb-2">
              No matching beauty essentials
            </p>
            <p className="text-sm text-[#5B6B66] mb-6">
              Try clearing your search filter or browsing all categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('All');
              }}
              className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-medium rounded-lg hover:bg-[#0B2B24] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            data-testid="product-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
              return (
                <article
                  key={product.id}
                  className="bg-white border border-[#E6E2DA] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    className="aspect-[4/3] bg-[#F8F6F3] overflow-hidden relative block text-left"
                    aria-label={`View details for ${product.name}`}
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#5B6B66] mb-1.5">
                      <span>
                        {product.category} · {product.sizeLabel}
                      </span>
                      {product.badge && (
                        <span className="font-medium text-[#103C32]">{product.badge}</span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-[#172320] leading-snug mb-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(product)}
                        className="text-left hover:text-[#103C32] transition-colors"
                      >
                        {product.name}
                      </button>
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#5B6B66] mb-3 tabular-nums">
                      <Star
                        className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-[#172320]">{product.rating.toFixed(1)}</span>
                      <span>({product.reviewCount})</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          outOfStock
                            ? 'text-[#B91C1C] font-medium'
                            : lowStock
                            ? 'text-[#B45309] font-medium'
                            : 'text-[#15803D]'
                        }
                      >
                        {outOfStock
                          ? 'Out of stock'
                          : lowStock
                          ? `Only ${product.stock} left`
                          : `${product.stock} in stock`}
                      </span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[#F0ECE4] flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-base font-semibold text-[#172320]">
                          {formatCurrency(product.price)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-[#7D8C87] line-through">
                            {formatCurrency(product.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(product, 1, true)}
                        className="px-4 py-2 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] disabled:bg-[#D1D5DB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                      >
                        {outOfStock ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Botanical Promise Banner */}
      <section className="bg-[#103C32] text-white py-14 my-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#F3C4CE] mb-2">
              Why PureGlow
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Clean ingredients. Real results. Always transparent.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Award className="w-6 h-6 text-[#F3C4CE] mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white mb-1">Clean Botanicals</h3>
              <p className="text-sm text-[#D8E5DF] leading-relaxed">
                Zero parabens, sulfates, or synthetic fragrances in every batch.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-6 h-6 text-[#F3C4CE] mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white mb-1">Clinically Tested</h3>
              <p className="text-sm text-[#D8E5DF] leading-relaxed">
                pH-balanced formulations verified for sensitive skin barriers.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Truck className="w-6 h-6 text-[#F3C4CE] mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white mb-1">Flexible Payments</h3>
              <p className="text-sm text-[#D8E5DF] leading-relaxed">
                Pay securely via Card, bKash, Nagad, or Cash on Delivery.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <RotateCcw className="w-6 h-6 text-[#F3C4CE] mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white mb-1">Live Order Alerts</h3>
              <p className="text-sm text-[#D8E5DF] leading-relaxed">
                Instant notifications from warehouse packing to doorstep delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
            Verified Reviews
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#172320]">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_TESTIMONIALS.map((review) => (
            <blockquote
              key={review.id}
              className="bg-white border border-[#E6E2DA] rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-3" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="w-4 h-4 fill-[#D97706] text-[#D97706]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#374742] leading-relaxed mb-5">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>
              <footer className="text-xs text-[#5B6B66] pt-3 border-t border-[#F0ECE4]">
                <span className="font-semibold text-[#172320]">{review.name}</span> ·{' '}
                <span>{review.location}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* 7. Newsletter & Footer */}
      <footer className="bg-[#103C32] text-[#FAF9F6] pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/15">
            <div className="md:col-span-4">
              <p className="font-display text-2xl font-semibold text-white mb-3">
                PureGlow
              </p>
              <p className="text-sm text-[#D8E5DF] leading-relaxed max-w-xs">
                Clean botanical skincare and everyday beauty essentials with live inventory and
                transparent delivery tracking.
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-3">Shop</h3>
              <ul className="space-y-2 text-sm text-[#D8E5DF]">
                {PRODUCT_CATEGORIES.slice(0, 4).map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="hover:text-white transition-colors"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-3">Customer Care</h3>
              <ul className="space-y-2 text-sm text-[#D8E5DF]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveView('track')}
                    className="hover:text-white transition-colors"
                  >
                    Track Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('All')}
                    className="hover:text-white transition-colors"
                  >
                    All Products
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                Get Exclusive Offers &amp; Beauty Tips
              </h3>
              <p className="text-xs text-[#D8E5DF] mb-4">
                Join our community for early access to botanical drops and subscriber-only codes.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <label htmlFor="footer-newsletter" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterStatus !== 'idle') setNewsletterStatus('idle');
                  }}
                  placeholder="Your email address"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#F3C4CE]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#F3C4CE] text-[#103C32] text-sm font-semibold rounded-lg hover:bg-[#F7D6DD] transition-colors whitespace-nowrap shrink-0"
                >
                  Subscribe
                </button>
              </form>
              {newsletterStatus === 'subscribed' && (
                <p className="text-xs text-[#F3C4CE] mt-2">
                  Subscribed! Use code GLOW15 at checkout for 15% off.
                </p>
              )}
              {newsletterStatus === 'error' && (
                <p className="text-xs text-[#FCA5A5] mt-2">
                  Please enter a valid email address.
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B7CCC3]">
            <p>© 2026 PureGlow. All rights reserved.</p>
            <p>Accepted Payments: Visa · Mastercard · bKash · Nagad · Cash on Delivery</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
