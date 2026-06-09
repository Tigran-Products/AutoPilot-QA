import { useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';

export default function TwoFactorSetup({ onClose }) {
  const { begin2FAEnrollment, finalize2FAEnrollment, disable2FA, is2FAEnabled } = useAuth();

  const already2FA = is2FAEnabled();

  const [step,    setStep]    = useState(already2FA ? 'manage' : 'start');
  const [secret,  setSecret]  = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function handleStartEnrollment() {
    setError(''); setLoading(true);
    try {
      const { secret: s, qrUrl } = await begin2FAEnrollment();
      setSecret(s);
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 2, color: { dark: '#ffffff', light: '#1e293b' } });
      setQrImage(dataUrl);
      setStep('scan');
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setStep('upgrade');
      } else {
        setError(err.message || 'Failed to start 2FA setup.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndEnroll(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await finalize2FAEnrollment(secret, otp);
      setSuccess('Two-factor authentication is now enabled!');
      setStep('done');
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect code. Make sure your authenticator clock is synced.');
      } else {
        setError(err.message || 'Enrollment failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError(''); setLoading(true);
    try {
      await disable2FA();
      setSuccess('Two-factor authentication has been disabled.');
      setStep('start');
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-800 rounded-lg px-3 py-2.5 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* ── Start / Intro ── */}
        {step === 'start' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-300 font-medium">Add an extra layer of security</p>
              <p className="text-xs text-slate-400">
                Use an authenticator app (Google Authenticator, Authy, etc.) to generate a time-based code
                each time you sign in.
              </p>
            </div>
            <button
              onClick={handleStartEnrollment}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Preparing…' : 'Set Up Authenticator App'}
            </button>
          </div>
        )}

        {/* ── Scan QR ── */}
        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              <span className="text-white font-medium">Step 1.</span> Scan this QR code with your authenticator app.
            </p>
            {qrImage && (
              <div className="flex justify-center">
                <img src={qrImage} alt="2FA QR Code" className="rounded-lg" width={200} height={200} />
              </div>
            )}
            <p className="text-xs text-slate-400">
              <span className="text-white font-medium">Step 2.</span> Enter the 6-digit code your app shows.
            </p>
            <form onSubmit={handleVerifyAndEnroll} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                placeholder="000000"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-xl text-white text-center tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Enrolling…' : 'Enable 2FA'}
              </button>
            </form>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Your account is now protected with two-factor authentication.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Upgrade required ── */}
        {step === 'upgrade' && (
          <div className="space-y-4">
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-medium text-amber-300">Firebase upgrade required</p>
              </div>
              <p className="text-xs text-slate-400">
                TOTP-based 2FA requires <strong className="text-slate-300">Firebase Identity Platform</strong> (Blaze plan).
                Upgrading is free — you only pay if you exceed usage limits.
              </p>
            </div>
            <a
              href="https://console.firebase.google.com/project/autopilot-qa-5eeb9/usage/details"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upgrade in Firebase Console
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-slate-500 text-center">
              After upgrading, enable Multi-factor Auth under<br />
              Authentication → Sign-in method → Advanced.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Manage (already enrolled) ── */}
        {step === 'manage' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-emerald-300">2FA is enabled</p>
                <p className="text-xs text-slate-400 mt-0.5">Your account has an authenticator app enrolled.</p>
              </div>
            </div>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full py-2.5 bg-red-900/40 hover:bg-red-800/60 border border-red-900 text-red-400 text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
