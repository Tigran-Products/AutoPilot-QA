const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialise Firebase Admin once (safe to call from multiple requires)
if (getApps().length === 0) {
  // On Railway/Render: set FIREBASE_SERVICE_ACCOUNT_JSON to the full JSON string
  // of your Firebase service account key (Project Settings → Service Accounts).
  // For local dev: set GOOGLE_APPLICATION_CREDENTIALS to the key file path instead.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  } else {
    initializeApp(); // falls back to GOOGLE_APPLICATION_CREDENTIALS
  }
}

/**
 * Express middleware — verifies Firebase ID token from
 * Authorization: Bearer <token>
 * Attaches decoded payload to req.user { uid, email, … }
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

module.exports = { verifyToken };
