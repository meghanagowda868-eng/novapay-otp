import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';
import { recognizeUser } from '../api/authApi';
import { submitCheckout } from '../api/checkoutApi';
import { isValidEmail, EMAIL_REGEX } from '../utils/validation';
import OtpModal from './OtpModal';
import {
  CheckCircle2,
  Loader2,
  ShoppingBag,
  UserCheck,
  Building,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

export default function CheckoutForm({ user, token, onLoginSuccess, onLogout, addToast }) {
  const location = useLocation();
  const initialEmail = location.state?.email || user?.email || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: initialEmail,
      phone: '',
      shipping_address: '',
    },
  });

  const watchEmail = watch('email');
  const debouncedEmail = useDebounce(watchEmail, 500);

  const [recognitionState, setRecognitionState] = useState('idle'); // idle | checking | registered | unregistered
  const [recognizedUserName, setRecognizedUserName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDismissedEmail, setModalDismissedEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Sync user email when logged in
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  // Real-time debounced recognition effect
  useEffect(() => {
    if (!debouncedEmail || !isValidEmail(debouncedEmail)) {
      setRecognitionState('idle');
      setRecognizedUserName('');
      return;
    }

    // If already logged in with this email, skip recognition modal
    if (user && user.email.toLowerCase() === debouncedEmail.toLowerCase()) {
      setRecognitionState('registered');
      setRecognizedUserName(`${user.first_name} ${user.last_name}`);
      return;
    }

    let isMounted = true;
    setRecognitionState('checking');

    recognizeUser(debouncedEmail)
      .then((res) => {
        if (!isMounted) return;

        if (res.registered) {
          setRecognitionState('registered');
          const nameStr = res.first_name ? `${res.first_name} ${res.last_name || ''}`.trim() : '';
          setRecognizedUserName(nameStr);
          // Open OTP modal if not logged in and email hasn't been dismissed
          if (!user && modalDismissedEmail.toLowerCase() !== debouncedEmail.toLowerCase()) {
            setModalOpen(true);
          }
        } else {
          setRecognitionState('unregistered');
          setRecognizedUserName('');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRecognitionState('idle');
        setRecognizedUserName('');
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedEmail, user, modalDismissedEmail]);

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleContinueAsGuest = () => {
    setModalDismissedEmail(debouncedEmail);
    setModalOpen(false);
    if (addToast) {
      addToast('Continuing checkout as guest', 'info');
    }
  };

  const handleOtpLoginSuccess = (newToken, newUser) => {
    setModalOpen(false);
    onLoginSuccess(newToken, newUser);
  };

  const onSubmitCheckout = async (data) => {
    setCheckoutLoading(true);
    try {
      const orderRes = await submitCheckout(
        data.email,
        data.phone,
        data.shipping_address,
        token
      );
      setCompletedOrder(orderRes);
      if (addToast) {
        addToast(`Order ${orderRes.order_reference} placed successfully!`, 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please check inputs.';
      if (addToast) {
        addToast(msg, 'error');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="card success-banner" style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div className="success-icon-wrap">
          <CheckCircle2 size={44} />
        </div>
        <h2 className="card-title" style={{ fontSize: '2.1rem' }}>
          Order Placed Successfully!
        </h2>
        <p className="card-subtitle" style={{ fontSize: '1.05rem', marginTop: '0.5rem' }}>
          Thank you for your order. Your purchase is recorded.
        </p>

        <div className="order-ref-card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Order ID
          </span>
          <div className="order-ref-code">{completedOrder.order_reference}</div>
        </div>

        <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <p style={{ margin: '0.3rem 0' }}><strong>Customer:</strong> {user ? `${user.first_name} ${user.last_name}` : 'Guest Customer'}</p>
          <p style={{ margin: '0.3rem 0' }}><strong>Email:</strong> {completedOrder.email}</p>
          <p style={{ margin: '0.3rem 0' }}><strong>Phone:</strong> {completedOrder.phone}</p>
          <p style={{ margin: '0.3rem 0' }}><strong>Shipping:</strong> {completedOrder.shipping_address}</p>
          <p style={{ margin: '0.3rem 0' }}><strong>Status:</strong> {completedOrder.user_id ? 'Authenticated Order' : 'Guest Checkout'}</p>
        </div>

        <button
          onClick={() => {
            setCompletedOrder(null);
            setValue('phone', '');
            setValue('shipping_address', '');
          }}
          className="btn btn-primary btn-full"
        >
          <span>Back to Checkout</span>
        </button>
      </div>
    );
  }


  return (
    <>
      <div className="card" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card-header" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={28} color="var(--primary-light)" />
            <span>Checkout</span>
          </h2>
          <p className="card-subtitle">
            Enter your details below. Existing users are recognized automatically.
          </p>
        </div>

        {/* User Login Banner */}
        {user ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserCheck size={22} color="#10b981" />
              <div>
                <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#34d399' }}>
                  Authenticated as {user.first_name} {user.last_name}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.6rem' }}
            >
              Log out
            </button>
          </div>
        ) : (
          modalDismissedEmail && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                fontSize: '0.86rem',
                color: '#fbbf24',
              }}
            >
              <span>Checking out as guest.</span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Log in instead
              </button>
            </div>
          )
        )}

        <form onSubmit={handleSubmit(onSubmitCheckout)}>
          {/* Email Field with Recognition Badge */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="checkout-email" style={{ margin: 0 }}>
                <Mail size={15} style={{ marginRight: '4px' }} />
                Email Address
              </label>

              {/* Recognition Status Badge */}
              {recognitionState === 'checking' && (
                <span className="recognition-badge checking">
                  <Loader2 size={12} className="spinner" />
                  Checking account...
                </span>
              )}

              {recognitionState === 'registered' && (
                <span className="recognition-badge found">
                  <CheckCircle2 size={12} />
                  {recognizedUserName ? `✓ Welcome back, ${recognizedUserName}` : '✓ Existing account found'}
                </span>
              )}

              {recognitionState === 'unregistered' && (
                <span className="recognition-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  No account found. Continue as guest
                </span>
              )}
            </div>

            <input
              id="checkout-email"
              type="email"
              disabled={!!user}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="name@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: EMAIL_REGEX,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="checkout-phone">
              <Phone size={15} style={{ marginRight: '4px' }} />
              Phone Number
            </label>
            <input
              id="checkout-phone"
              type="tel"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="+1 (555) 000-0000"
              {...register('phone', {
                required: 'Phone number is required',
                minLength: { value: 5, message: 'Please enter a valid phone number' },
              })}
            />
            {errors.phone && <span className="error-text">{errors.phone.message}</span>}
          </div>

          {/* Shipping Address Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="checkout-address">
              <Building size={15} style={{ marginRight: '4px' }} />
              Shipping Address
            </label>
            <textarea
              id="checkout-address"
              rows={3}
              className={`form-textarea ${errors.shipping_address ? 'error' : ''}`}
              placeholder="Street Address, Suite / Apt, City, State, ZIP Code"
              {...register('shipping_address', {
                required: 'Shipping address is required',
                minLength: { value: 5, message: 'Please enter a complete address' },
              })}
            />
            {errors.shipping_address && (
              <span className="error-text">{errors.shipping_address.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={checkoutLoading}
            style={{ marginTop: '1.25rem' }}
          >
            {checkoutLoading ? (
              <>
                <div className="spinner" />
                <span>Submitting Order...</span>
              </>
            ) : (
              <>
                <span>Complete Checkout</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* OTP Recognition Modal */}
      <OtpModal
        email={debouncedEmail}
        userName={recognizedUserName}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onLoginSuccess={handleOtpLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
        addToast={addToast}
      />

    </>
  );
}
