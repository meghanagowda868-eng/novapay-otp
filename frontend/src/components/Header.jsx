import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, User, LogOut, ShoppingBag } from 'lucide-react';

export default function Header({ user, onLogout, onOpenOrders }) {
  const location = useLocation();

  return (
    <header className="header-bar">
      <div className="header-content">
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <ShieldCheck size={22} />
          </div>
          <span>NovaPay</span>
        </Link>

        <div className="nav-links">
          <Link
            to="/register"
            className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
          >
            Register Account
          </Link>

          <Link
            to="/checkout"
            className={`nav-link ${location.pathname === '/checkout' || location.pathname === '/' ? 'active' : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShoppingBag size={16} />
              Checkout
            </span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border-light)' }}
                >
                  My Orders
                </button>
              )}
              <div className="user-badge" title={user.email}>
                <span className="user-badge-dot"></span>
                <span>Welcome, {user.first_name} {user.last_name}</span>
                <button
                  onClick={onLogout}
                  className="btn btn-ghost"
                  style={{ padding: '2px 6px', marginLeft: '4px' }}
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

