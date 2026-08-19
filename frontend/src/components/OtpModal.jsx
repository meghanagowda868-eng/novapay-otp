import React, { useState, useEffect, useRef } from 'react';
import { loginUser, resendOtpCode } from '../api/authApi';
import { Lock, RefreshCw, XCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function OtpModal({
  email,
  userName,
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  addToast,
}) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setResendCooldown(30);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isOpen && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Auto-advance
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpDigits(digits);
      setErrorMsg('');
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const isComplete = otpDigits.every((d) => d !== '');
  const otpCode = otpDigits.join('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isComplete || loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await loginUser(email, otpCode);
      if (addToast) {
        addToast(`Welcome back, ${response.user.first_name}!`, 'success');
      }
      onLoginSuccess(response.access_token, response.user);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid login code. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setErrorMsg('');

    try {
      const res = await resendOtpCode(email);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      if (addToast) {
        addToast(`New OTP code: ${res.otp} (Expires in 5 min)`, 'info');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend code. Try again.';
      setErrorMsg(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header-icon">
          <Lock size={28} />
        </div>

        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
          {userName ? `Welcome Back, ${userName} 👋` : 'Welcome Back 👋'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          We found an existing account for
        </p>

        <div
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 1rem',
            color: 'var(--primary-light)',
            fontWeight: '600',
            fontSize: '0.95rem',
            display: 'inline-block',
            marginBottom: '1.5rem',
          }}
        >
          {email}
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Enter your 6-digit login code to continue:
        </p>

        <form onSubmit={handleVerify}>
          <div className="otp-input-group" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className={`otp-box ${digit ? 'filled' : ''}`}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: 'var(--accent-rose)',
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '1rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(244, 63, 94, 0.1)',
                borderRadius: '6px',
              }}
            >
              <XCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!isComplete || loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Continue</span>
                <UserCheck size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="btn btn-ghost"
            style={{ fontSize: '0.88rem', width: '100%' }}
          >
            <RefreshCw size={14} className={resendLoading ? 'spinner' : ''} />
            {resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <span>Resend code</span>
            )}
          </button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="btn btn-secondary btn-full"
            style={{ fontSize: '0.88rem', padding: '0.65rem' }}
          >
            Skip for now (Continue as guest)
          </button>
        </div>
      </div>
    </div>
  );
}

