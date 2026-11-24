import { LogOut, Package, Shield, UserCheck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/commerce';

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    isOwner,
    canAccessAdmin,
    adminPermissions,
    signInWithGoogle,
    logout,
    orders,
    setSelectedTrackOrderNumber,
    setActiveView,
  } = useStore();

  if (!isAuthModalOpen) return null;

  const userOrders = user
    ? orders.filter((o) => o.userId === user.uid || o.customerEmail === user.email)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="bg-white border border-[#E6E2DA] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5B6B66] mb-1">
              PureGlow Account
            </p>
            <h2 id="auth-modal-title" className="font-display text-3xl font-semibold text-[#172320]">
              {user ? 'Your Profile' : 'Sign In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Close account modal"
            className="p-1.5 text-[#5B6B66] hover:text-[#172320] rounded-lg hover:bg-[#FAF9F6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div>
            <p className="text-sm text-[#5B6B66] leading-relaxed mb-6">
              Sign in with Google to sync your orders and receive live shipment alerts.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="w-full py-3 px-4 bg-[#103C32] text-white text-sm font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors flex items-center justify-center gap-2.5"
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              <span>Continue with Google</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
              <p className="text-sm font-semibold text-[#172320]">{user.displayName}</p>
              <p className="text-xs text-[#5B6B66] mt-0.5">{user.email}</p>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-[#103C32]">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {isOwner
                    ? 'Store Owner (Full Access)'
                    : canAccessAdmin
                    ? `Authorized Staff (${adminPermissions.length} capability${adminPermissions.length === 1 ? '' : 's'})`
                    : 'Verified Customer'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#172320] mb-2">
                Your Recent Orders ({userOrders.length})
              </p>
              {userOrders.length === 0 ? (
                <p className="text-xs text-[#5B6B66] py-3">
                  No cloud orders yet. Orders placed while signed in appear here automatically.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {userOrders.slice(0, 5).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        setSelectedTrackOrderNumber(ord.orderNumber);
                        setActiveView('track');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full p-3 rounded-lg border border-[#E6E2DA] hover:border-[#103C32] flex items-center justify-between text-left text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#103C32]" aria-hidden="true" />
                        <span className="font-mono font-semibold text-[#172320]">
                          {ord.orderNumber}
                        </span>
                        <span className="capitalize text-[#5B6B66]">· {ord.status}</span>
                      </div>
                      <span className="font-semibold text-[#172320] tabular-nums">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              {canAccessAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('admin');
                    setIsAuthModalOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#103C32] text-white text-xs font-semibold rounded-lg hover:bg-[#0B2B24] transition-colors"
                >
                  Open Admin Console
                </button>
              )}
              <button
                type="button"
                onClick={() => void logout()}
                className="flex-1 py-2.5 px-4 border border-[#E6E2DA] text-[#172320] text-xs font-medium rounded-lg hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
