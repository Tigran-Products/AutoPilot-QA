import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getMultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [mfaResolver, setMfaResolver] = useState(null); // set when login needs 2FA

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  // ── Registration ─────────────────────────────────────────────────────────────
  async function signUp(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  // Returns { needsMFA: true, resolver } when 2FA is enrolled, otherwise resolves normally.
  async function signIn(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { needsMFA: false, user: cred.user };
    } catch (err) {
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
        return { needsMFA: true, resolver };
      }
      throw err;
    }
  }

  // Call after signIn returns needsMFA = true.
  async function completeMFASignIn(otpCode) {
    if (!mfaResolver) throw new Error('No pending MFA sign-in');
    const totpHint = mfaResolver.hints.find(
      (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID
    );
    if (!totpHint) throw new Error('No TOTP factor found');
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, otpCode);
    const cred = await mfaResolver.resolveSignIn(assertion);
    setMfaResolver(null);
    return cred.user;
  }

  function cancelMFASignIn() {
    setMfaResolver(null);
  }

  // ── Sign out ──────────────────────────────────────────────────────────────────
  async function signOut() {
    await firebaseSignOut(auth);
  }

  // ── Password reset ────────────────────────────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  // ── 2FA Enrollment ────────────────────────────────────────────────────────────
  // Step 1: generate secret + return { secret, qrUrl }
  async function begin2FAEnrollment() {
    if (!user) throw new Error('Must be signed in');
    const session   = await multiFactor(user).getSession();
    const secret    = await TotpMultiFactorGenerator.generateSecret(session);
    const qrUrl     = secret.generateQrCodeUrl(user.email, 'AutoTest');
    return { secret, qrUrl };
  }

  // Step 2: verify the code and enroll
  async function finalize2FAEnrollment(secret, otpCode, displayName = 'Authenticator') {
    if (!user) throw new Error('Must be signed in');
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, otpCode);
    await multiFactor(user).enroll(assertion, displayName);
  }

  // ── 2FA Unenrollment ──────────────────────────────────────────────────────────
  async function disable2FA() {
    if (!user) throw new Error('Must be signed in');
    const mf = multiFactor(user);
    if (mf.enrolledFactors.length === 0) throw new Error('No 2FA factor enrolled');
    await mf.unenroll(mf.enrolledFactors[0]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function is2FAEnabled() {
    return user ? multiFactor(user).enrolledFactors.length > 0 : false;
  }

  async function getIdToken() {
    if (!user) return null;
    return user.getIdToken();
  }

  const value = {
    user,
    loading: user === undefined,
    signUp,
    signIn,
    completeMFASignIn,
    cancelMFASignIn,
    signOut,
    resetPassword,
    begin2FAEnrollment,
    finalize2FAEnrollment,
    disable2FA,
    is2FAEnabled,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
