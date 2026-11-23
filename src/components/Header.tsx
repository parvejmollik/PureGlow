import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Menu, PackageCheck, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { AppView, ProductCategory } from '../types/commerce';

interface HeaderProps {
  onSelectCategoryAndScroll: (category: ProductCategory | 'All') => void;
}

export function Header({ onSelectCategoryAndScroll }: HeaderProps) {
  const {
    activeView,
    setActiveView,
    cartCount,
    setIsCartOpen,
    setIsAuthModalOpen,
    user,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedTrackOrderNumber,
  } = useStore();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navigate = (view: AppView, anchorId?: string) => {
    setActiveView(view);
    setMobileNavOpen(false);
    if (view === 'storefront' && anchorId) {
      window.setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E2DA]">
      {!bannerDismissed && (
        <div className="bg-[#103C32] text-[#FAF9F6] text-xs px-4 py-1.5 flex items-center justify-center relative">
          <p className="truncate pr-6 text-center">
            Free express shipping on orders over ৳50 · Use code{' '}
            <span className="font-mono font-medium text-[#F3C4CE]">GLOW15</span> for 15% off
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 text-[#FAF9F6]/70 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
            className="md:hidden p-2 -ml-1 text-[#172320] hover:bg-[#EFECE4] rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategoryAndScroll('All');
              navigate('storefront');
            }}
            className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#103C32] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#103C32]"
          >
            PureGlow
          </button>
        </div>

        {/* Zone 2: Primary Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#465752]"
        >
          <button
            type="button"
            onClick={() => navigate('storefront', 'catalog-section')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              activeView === 'storefront'
                ? 'border-[#103C32] text-[#103C32]'
                : 'border-transparent hover:text-[#103C32]'
            }`}
          >
            Shop
          </button>
          <button
            type="button"
            onClick={() => navigate('storefront', 'categories-section')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#103C32] transition-colors"
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => navigate('track')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              activeView === 'track'
                ? 'border-[#103C32] text-[#103C32]'
                : 'border-transparent hover:text-[#103C32]'
            }`}
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => navigate('admin')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              activeView === 'admin'
                ? 'border-[#103C32] text-[#103C32]'
                : 'border-transparent hover:text-[#103C32]'
            }`}
          >
            Admin
          </button>
        </nav>

        {/* Zone 3: Actions (Notifications, Account, Primary Bag CTA) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label={`Order notifications (${unreadNotificationCount} unread)`}
              aria-expanded={notifOpen}
              className="relative p-2 text-[#172320] hover:bg-[#EFECE4] rounded-lg transition-colors min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
            >
              <Bell className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#103C32] text-white text-[10px] font-semibold tabular-nums flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="region"
                aria-label="Notification Center"
                className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[104px] sm:top-auto sm:mt-2 sm:w-96 bg-white border border-[#E6E2DA] rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-[#E6E2DA] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#172320]">
                    Order &amp; Stock Alerts
                  </span>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsRead()}
                      className="text-xs font-medium text-[#103C32] hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#F0ECE4]">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-sm text-[#5B6B66] text-center">
                      No order notifications yet.
                    </p>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          void markNotificationRead(n.id);
                          if (n.orderNumber) {
                            setSelectedTrackOrderNumber(n.orderNumber);
                            setActiveView('track');
                            setNotifOpen(false);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#FAF9F6] transition-colors flex items-start gap-3 ${
                          !n.read ? 'bg-[#FCEEEF]/40' : ''
                        }`}
                      >
                        <PackageCheck
                          className="w-4 h-4 mt-0.5 text-[#103C32] shrink-0"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#172320] truncate">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#103C32]">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5B6B66] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            aria-label={user ? `Account (${user.displayName || user.email})` : 'Sign in'}
            className="p-2 sm:px-3 sm:py-2 text-sm font-medium text-[#172320] hover:bg-[#EFECE4] rounded-lg transition-colors flex items-center gap-2 min-w-[40px] min-h-[40px] sm:min-h-[44px] justify-center whitespace-nowrap shrink-0"
          >
            <UserIcon className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
            <span className="hidden lg:inline max-w-[110px] truncate">
              {user ? user.displayName?.split(' ')[0] || 'Account' : 'Sign In'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping bag with ${cartCount} items`}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#103C32] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#0B2B24] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 min-h-[40px] sm:min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-[#E6E2DA] bg-[#FAF9F6] px-4 py-3 flex flex-col gap-1"
        >
          <button
            type="button"
            onClick={() => navigate('storefront', 'catalog-section')}
            className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#172320] hover:bg-[#EFECE4]"
          >
            Shop Collection
          </button>
          <button
            type="button"
            onClick={() => navigate('storefront', 'categories-section')}
            className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#172320] hover:bg-[#EFECE4]"
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => navigate('track')}
            className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#172320] hover:bg-[#EFECE4]"
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => navigate('admin')}
            className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#172320] hover:bg-[#EFECE4]"
          >
            Admin Dashboard
          </button>
        </nav>
      )}
    </header>
  );
}
