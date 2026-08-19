import React, { useState, useEffect } from 'react';
import { getUserOrders } from '../api/authApi';
import { Package, Clock, MapPin, X, Loader2, Calendar, Phone } from 'lucide-react';

export default function OrderHistoryModal({ isOpen, onClose, token, addToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      getUserOrders(token)
        .then((data) => {
          setOrders(data);
        })
        .catch((err) => {
          const msg = err.response?.data?.detail || 'Failed to load order history.';
          if (addToast) addToast(msg, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, token, addToast]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px', width: '92%', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} color="var(--primary-light)" />
            <span>My Order History</span>
          </h3>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', borderRadius: '50%', minWidth: 'auto' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: '500' }}>No orders placed yet</p>
            <p style={{ fontSize: '0.85rem' }}>Your past completed checkouts will appear here.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                    {order.order_reference}
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                    }}
                  >
                    Recorded
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gap: '0.4rem' }}>
                  {order.created_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{order.phone}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <MapPin size={14} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{order.shipping_address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
