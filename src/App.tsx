import { useState } from 'react';
import { Bell, Lock, UserCheck, X } from 'lucide-react';
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

function AdminAccessGate() {
  const { authReady, user, signInWithGoogle, setActiveView } = useStore();

  return (
    <main className="max-w-lg mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-[#EFECE4] text-[#103C32] flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
          PureGlow Private Console
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#172320] mb-3">
          Authorized Access Only
        </h1>

        {!authReady ? (
          <p className="text-sm text-[#5B6B66]">Verifying credentials...</p>
        ) : !user ? (
          <>
            <p className="text-sm text-[#5B6B66] leading-relaxed mb-6">
              This store console is restricted to the store owner and team members with explicit
              permissions. Sign in with your authorized Google account to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                <span>Sign In with Google</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('storefront')}
                className="px-5 py-2.5 border border-[#E6E2DA] text-sm font-medium text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
              >
                Return to Store
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[#5B6B66] leading-relaxed mb-6">
              Signed in as <span className="font-medium text-[#172320]">{user.email}</span>. Your
              account does not currently have store management permissions. Contact the store owner
              to request scoped access.
            </p>
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="px-5 py-2.5 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors"
            >
              Return to Store
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function StoreShell() {
  const { activeView, canAccessAdmin, toast, dismissToast } = useStore();
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
        {activeView === 'admin' &&
          (canAccessAdmin ? <AdminDashboardView /> : <AdminAccessGate />)}
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
