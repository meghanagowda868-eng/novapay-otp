import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { EMAIL_REGEX } from '../utils/validation';
import { ShieldCheck, ArrowRight, Clock, Copy, Check } from 'lucide-react';

export default function RegistrationForm({ addToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    let timer;
    if (registeredData && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [registeredData, timeLeft]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await registerUser(data.first_name, data.last_name, data.email);
      setRegisteredData(res);
      setTimeLeft(5 * 60); // 5 minutes
      if (addToast) {
        addToast('Registration successful! OTP code generated.', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      if (addToast) {
        addToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyOtp = () => {
    if (registeredData?.otp) {
      navigator.clipboard.writeText(registeredData.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout', { state: { email: registeredData.user.email } });
  };

  if (registeredData) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div className="card-header">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#10b981',
            }}
          >
            <ShieldCheck size={36} />
          </div>
          <h2 className="card-title">Registration Complete</h2>
          <p className="card-subtitle">
            Welcome, {registeredData.user.first_name} {registeredData.user.last_name}!
          </p>
        </div>

        <div className="otp-display-box">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Your 6-digit login code</p>
          <div className="otp-code-digits">
            {registeredData.otp.split('').join(' ')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <span className="timer-pill">
              <Clock size={14} />
              Expires in {formatTime(timeLeft)}
            </span>

            <button
              onClick={handleCopyOtp}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border-light)' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy OTP'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem' }}>
          Save or copy this code. You will use it to log in during checkout.
        </p>

        <button onClick={handleProceedToCheckout} className="btn btn-primary btn-full">
          <span>Continue to Checkout</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="card-header">
        <h2 className="card-title">Create your account</h2>
        <p className="card-subtitle">Register to unlock fast recognition & one-click checkout.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label" htmlFor="first_name">First Name</label>
          <input
            id="first_name"
            type="text"
            className={`form-input ${errors.first_name ? 'error' : ''}`}
            placeholder="John"
            {...register('first_name', { required: 'First name is required' })}
          />
          {errors.first_name && <span className="error-text">{errors.first_name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="last_name">Last Name</label>
          <input
            id="last_name"
            type="text"
            className={`form-input ${errors.last_name ? 'error' : ''}`}
            placeholder="Doe"
            {...register('last_name', { required: 'Last name is required' })}
          />
          {errors.last_name && <span className="error-text">{errors.last_name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="john.doe@example.com"
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: EMAIL_REGEX,
                message: 'Please enter a valid email address',
              },
            })}
          />
          {errors.email && <span className="error-text">{errors.email.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? (
            <>
              <div className="spinner" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>
    </div>
  );
}
