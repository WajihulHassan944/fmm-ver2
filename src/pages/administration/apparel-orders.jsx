import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaBoxOpen,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRedo,
  FaSearch,
  FaShoppingBag,
} from 'react-icons/fa';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'FULFILLING', 'SHIPPED', 'CANCELLED'];

const money = (value, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));
  } catch {
    return `$${Number(value || 0).toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getAdminToken = () => (typeof window === 'undefined' ? '' : window.localStorage.getItem('adminAuthToken') || '');

const ApparelOrdersAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, confirmed: 0, fulfilling: 0, shipped: 0, cancelled: 0, revenue: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchOrders = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setError('Admin login is required to view apparel orders.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/admin/apparel-orders', {
        status: statusFilter,
        search,
        page: 1,
        limit: 100,
      }), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Unable to load apparel orders.');
      setOrders(Array.isArray(payload?.orders) ? payload.orders : []);
      setSummary(payload?.summary || {});
    } catch (err) {
      setError(err.message || 'Unable to load apparel orders.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const summaryCards = useMemo(() => [
    { label: 'Total orders', value: summary.total || 0 },
    { label: 'Pending', value: summary.pending || 0 },
    { label: 'Confirmed', value: summary.confirmed || 0 },
    { label: 'Fulfilling', value: summary.fulfilling || 0 },
    { label: 'Shipped', value: summary.shipped || 0 },
    { label: 'Revenue', value: money(summary.revenue || 0) },
  ], [summary]);

  const updateOrderStatus = async (order, nextStatus) => {
    if (!order?._id || !nextStatus || nextStatus === order.status) return;
    const token = getAdminToken();
    setUpdatingId(order._id);
    setError('');
    try {
      const response = await fetch(buildPublicApiUrl(`/api/admin/apparel-orders/${order._id}/status`), {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Unable to update apparel order.');
      setOrders((current) => current.map((row) => (row._id === order._id ? payload.order : row)));
      setSummary(payload.summary || summary);
    } catch (err) {
      setError(err.message || 'Unable to update apparel order.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <AdminPrivateRoute>
      <Head>
        <title>Apparel Orders | Fantasy MMAdness Admin</title>
      </Head>
      <div className="admin-dashboard-experience fmm-admin-apparel-orders-v20">
        <section className="admin-page-heading">
          <div>
            <p className="admin-page-eyebrow"><FaShoppingBag aria-hidden="true" /> Commerce</p>
            <h1>Apparel orders</h1>
            <p>Review guest and logged-in apparel orders, shipping details, items, totals, and fulfilment status from one admin screen.</p>
          </div>
          <div className="admin-page-actions">
            <button type="button" className="admin-action-secondary" onClick={fetchOrders} disabled={loading}>
              <FaRedo aria-hidden="true" /> Refresh
            </button>
          </div>
        </section>

        <section className="fmm-admin-apparel-summary-v20" aria-label="Apparel order summary">
          {summaryCards.map((card) => (
            <article key={card.label}>
              <span>{card.label}</span>
              <strong>{typeof card.value === 'number' ? Number(card.value).toLocaleString() : card.value}</strong>
            </article>
          ))}
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading fmm-admin-apparel-toolbar-v20">
            <div>
              <h2>Order queue</h2>
              <span>{loading ? 'Loading apparel orders…' : `${orders.length.toLocaleString()} visible order${orders.length === 1 ? '' : 's'}`}</span>
            </div>
            <div className="fmm-admin-apparel-filters-v20">
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span><FaSearch aria-hidden="true" /> Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, order #, SKU" />
              </label>
            </div>
          </div>

          {error && <p className="fmm-admin-apparel-error-v20">{error}</p>}

          <div className="admin-data-table-scroll fmm-admin-apparel-table-v20">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Ship to</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Loading apparel orders…</td></tr>
                ) : orders.length ? orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </td>
                    <td>
                      <strong>{order.customerName}</strong>
                      <small><FaEnvelope aria-hidden="true" /> {order.email}</small>
                      {order.phone ? <small><FaPhoneAlt aria-hidden="true" /> {order.phone}</small> : null}
                    </td>
                    <td>
                      <div className="fmm-admin-apparel-items-v20">
                        {(order.items || []).map((item) => (
                          <span key={`${order._id}-${item.sku}-${item.size}`}>
                            <FaBoxOpen aria-hidden="true" /> {item.quantity}× {item.name} · {item.size} · {money(item.lineTotal, order.currency)}
                          </span>
                        ))}
                      </div>
                      {order.notes ? <small className="fmm-admin-apparel-note-v20">Note: {order.notes}</small> : null}
                    </td>
                    <td>
                      <small><FaMapMarkerAlt aria-hidden="true" /> {order.shippingAddress}</small>
                      <small>{[order.city, order.state, order.zipCode].filter(Boolean).join(', ')}</small>
                      <small>{order.country}</small>
                    </td>
                    <td><strong>{money(order.subtotal, order.currency)}</strong></td>
                    <td>
                      <select
                        value={order.status || 'PENDING'}
                        onChange={(event) => updateOrderStatus(order, event.target.value)}
                        disabled={updatingId === order._id}
                        aria-label={`Update status for ${order.orderNumber}`}
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6">No apparel orders found for the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <style jsx>{`
          .fmm-admin-apparel-orders-v20 { padding-bottom: 56px; }
          .admin-page-eyebrow { display: inline-flex; align-items: center; gap: 8px; }
          .fmm-admin-apparel-summary-v20 {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 14px;
            margin: 22px 0;
          }
          .fmm-admin-apparel-summary-v20 article {
            padding: 18px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 18px;
            background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035));
            box-shadow: 0 18px 40px rgba(0,0,0,.22);
          }
          .fmm-admin-apparel-summary-v20 span { display: block; color: rgba(255,255,255,.62); font-size: .76rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
          .fmm-admin-apparel-summary-v20 strong { display: block; margin-top: 8px; color: #ffcf45; font-size: clamp(1.4rem, 2vw, 2rem); }
          .fmm-admin-apparel-toolbar-v20 { align-items: flex-start; gap: 18px; }
          .fmm-admin-apparel-filters-v20 { display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
          .fmm-admin-apparel-filters-v20 label { display: grid; gap: 6px; color: rgba(255,255,255,.62); font-size: .76rem; font-weight: 900; text-transform: uppercase; }
          .fmm-admin-apparel-filters-v20 label span { display: inline-flex; align-items: center; gap: 6px; }
          .fmm-admin-apparel-filters-v20 input,
          .fmm-admin-apparel-filters-v20 select,
          .fmm-admin-apparel-table-v20 select {
            min-height: 42px;
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 12px;
            color: #fff;
            background: rgba(4, 8, 15, .88);
            padding: 0 12px;
            outline: none;
          }
          .fmm-admin-apparel-filters-v20 input { width: min(320px, 64vw); }
          .fmm-admin-apparel-error-v20 { margin: 12px 0; color: #ff9b9b; font-weight: 900; }
          .fmm-admin-apparel-table-v20 small { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: rgba(255,255,255,.62); }
          .fmm-admin-apparel-items-v20 { display: grid; gap: 6px; min-width: 260px; }
          .fmm-admin-apparel-items-v20 span { display: inline-flex; align-items: center; gap: 7px; color: rgba(255,255,255,.85); }
          .fmm-admin-apparel-note-v20 { color: #ffcf45 !important; }
          .fmm-admin-apparel-table-v20 td { vertical-align: top; }
          .fmm-admin-apparel-table-v20 select { min-width: 132px; font-weight: 900; }
          @media (max-width: 1180px) {
            .fmm-admin-apparel-summary-v20 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .fmm-admin-apparel-toolbar-v20 { display: grid; }
            .fmm-admin-apparel-filters-v20 { justify-content: flex-start; }
          }
          @media (max-width: 720px) {
            .fmm-admin-apparel-summary-v20 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
        `}</style>
      </div>
    </AdminPrivateRoute>
  );
};

export default ApparelOrdersAdminPage;
