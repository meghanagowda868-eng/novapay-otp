import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Toast from './components/Toast';
import OrderHistoryModal from './components/OrderHistoryModal';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import { getMe } from './api/authApi';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nova_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('nova_token') || null;
  });

  const [toasts, setToasts] = useState([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Re-validate token on mount
  useEffect(() => {
    if (token) {
      getMe(token)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('nova_user', JSON.stringify(userData));
        })
        .catch(() => {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('nova_token');
          localStorage.removeItem('nova_user');
        });
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nova_token', newToken);
    localStorage.setItem('nova_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    addToast('Logged out successfully', 'info');
  };

  return (
    <div className="app-container">
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/checkout" replace />} />
          <Route path="/register" element={<Register addToast={addToast} />} />
          <Route
            path="/checkout"
            element={
              <Checkout
                user={user}
                token={token}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
                addToast={addToast}
              />
            }
          />
          <Route path="*" element={<Navigate to="/checkout" replace />} />
        </Routes>
      </main>

      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        token={token}
        addToast={addToast}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

