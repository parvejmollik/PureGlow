import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { OrderTrackingView } from './components/OrderTrackingView';
import { ProductModal } from './components/ProductModal';
import { StorefrontView } from './components/StorefrontView';
import { StoreProvider, useStore } from './context/StoreContext';
import type { ProductCategory } from './types/commerce';

function StoreShell() {
  const { activeView, toast, dismissToast } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172320]">
      <Header onSelectCategoryAndScroll={setSelectedCategory} />

      <div className="flex-1">
        {activeView === 'storefront' && (
          <StorefrontView
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}
        {activeView === 'track' && <OrderTrackingView />}
        {activeView === 'admin' && <AdminDashboardView />}
      </div>

      <ProductModal />
      <CartCheckoutDrawer />
      <AuthModal />

      {/* Live Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-[#103C32] text-white rounded-xl p-4 shadow-xl border border-white/15 flex items-start gap-3"
        >
          <Bell className="w-4 h-4 text-[#F3C4CE] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">{toast.title}</p>
            <p className="text-xs text-[#D8E5DF] mt-0.5">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="p-1 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StoreShell />
      </StoreProvider>
    </ErrorBoundary>
  );
}
