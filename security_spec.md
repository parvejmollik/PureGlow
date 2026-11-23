# Security Specification & Hardened Rules Audit

## 1. Data Invariants
1. **Default Deny**: All unmatched paths are explicitly denied.
2. **Product Integrity**: Only verified admins may create, edit product details, or delete products. Authenticated verified customers placing an order may only decrement `stock` (never increase it, never negative, and only modifying `stock` and `updatedAt` with server `request.time`).
3. **Order Ownership & PII Isolation**: Every order contains customer shipping PII and belongs strictly to `userId == request.auth.uid`. Only the order owner or an admin may read (`get` / `list`) an order.
4. **No Self-Assigned Roles**: Customers creating a `users/{userId}` document may only set `role == 'customer'` and cannot escalate to `'admin'` or modify `role` on update. Admin privilege is determined solely via verified bootstrapped admin email (`parvejmollik2022@gmail.com`) or `/admins/{uid}` presence.
5. **Terminal Order Protection**: Once an order reaches `delivered` or `cancelled`, non-admin users cannot mutate it. Customers may only cancel an order while it is still `placed`.
6. **Strict Schema & Bounds**: Every string validates `.size()`, every document ID validates `^[a-zA-Z0-9_-]+$` (`<= 128` chars), every array validates `size() <= 20` and first-element type, and `createdAt`/`updatedAt` strictly validate `request.time`.
7. **Zero `get()`/`exists()` inside `allow list`**: List rules evaluate strictly on `resource.data` and `request.auth.token` claims (`isBootstrappedAdmin()`), preventing O(n) read amplification.

## 2. The "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. Unauthenticated order creation (`request.auth == null`).
2. Unverified email user writing an order (`email_verified == false`).
3. Identity spoofing: User A creates order with `userId: "user-b"`.
4. Shadow field injection: Adding `isApproved: true` or `adminOverride: true` to `orders` or `products`.
5. Privilege escalation: User writes `role: "admin"` inside `users/{userId}`.
6. Negative or inflated stock manipulation by customer: Customer updates `products/{id}` setting `stock: 9999` or `stock: -5`.
7. Customer editing product `price` during checkout update (`affectedKeys` includes `price`).
8. State shortcutting: Customer updates their own order status directly from `placed` to `delivered`.
9. Terminal state bypass: Customer cancels an order already in `shipped` or `delivered` status.
10. Resource poisoning / Denial of Wallet: Passing a 10KB string for `orderId` or `customerName`.
11. Cross-user PII read: User A reads User B's `orders/{orderId}` or `users/{userB}`.
12. Timestamp forgery: Client supplies `createdAt` in the past/future instead of `request.time`.
