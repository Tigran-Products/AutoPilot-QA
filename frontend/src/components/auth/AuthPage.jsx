import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TwoFactorModal from './TwoFactorModal';

function getFirebaseError(code) {
  const map = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many failed attempts. Please try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

  // shared fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');

  // set when login requires 2FA
  const [mfaNeeded, setMfaNeeded] = useState(false);

  function resetForm() {
    setEmail(''); setPassword(''); setConfirm('');
    setError(''); setSuccess('');
  }

  function switchTo(v) {
    resetForm();
    setView(v);
    setMfaNeeded(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.needsMFA) setMfaNeeded(true);
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signUp(email, password);
      // onAuthStateChanged in AuthContext will update user → App renders main UI
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AutoTest</h1>
            <p className="text-sm text-slate-400 mt-1">Low-Code Test Automation Platform</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
            {/* View switcher tabs (only login/register) */}
            {view !== 'forgot' && (
              <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
                <button
                  onClick={() => switchTo('login')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    view === 'login'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchTo('register')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    view === 'register'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error / Success banners */}
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

            {/* ── LOGIN ─────────────────────────────────── */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => switchTo('forgot')}
                  className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors mt-1"
                >
                  Forgot your password?
                </button>
              </form>
            )}

            {/* ── REGISTER ──────────────────────────────── */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="min. 6 characters"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}

            {/* ── FORGOT PASSWORD ────────────────────────── */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-base font-semibold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400 mt-1">Enter your email and we'll send a reset link.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => switchTo('login')}
                  className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 2FA challenge modal — shown when signIn returns needsMFA */}
      {mfaNeeded && (
        <TwoFactorModal onCancel={() => setMfaNeeded(false)} />
      )}
    </>
  );
}
