import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TwoFactorModal({ onCancel }) {
  const { completeMFASignIn, cancelMFASignIn } = useAuth();
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await completeMFASignIn(otp);
      // onAuthStateChanged fires → user is set → App renders main UI
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect code. Try again.');
      } else {
        setError(err.message || 'Verification failed.');
      }
      setLoading(false);
    }
  }

  function handleCancel() {
    cancelMFASignIn();
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-600/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-base font-semibold text-white text-center">Two-Factor Verification</h2>
        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
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
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
