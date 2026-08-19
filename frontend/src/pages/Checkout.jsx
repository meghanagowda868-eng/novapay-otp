import React from 'react';
import CheckoutForm from '../components/CheckoutForm';

export default function Checkout({ user, token, onLoginSuccess, onLogout, addToast }) {
  return (
    <div style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      <CheckoutForm
        user={user}
        token={token}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        addToast={addToast}
      />
    </div>
  );
}
