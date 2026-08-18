# eMerchant Authority / Authorize.Net checkout frontend (v58)

- Preserves the approved Fantasy MMAdness coin-cart and billing-details design.
- Creates a server-priced order and submits the one-time token to Authorize.Net
  Accept Hosted using a secure form POST.
- Keeps card number, expiry, and CVV out of the frontend and Fantasy MMAdness API.
- Shows verifying, success, failure, cancellation, and delayed-webhook states.
- Routes signed-in wallet top-ups through the same hosted checkout instead of the
  retired stored-card endpoint.
- Keeps the one-time FM+ 30-day pass available. Monthly auto-renew is visibly
  marked coming soon until recurring billing is enabled on the merchant account.

Backend deployment must provide the Authorize.Net environment variables and
register the signed payment webhook described in the backend release notes.
