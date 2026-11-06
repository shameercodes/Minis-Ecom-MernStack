const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
  console.error(
    '❌ JWT_SECRET is not set. Add it in Replit Secrets (or backend/.env). Required for login and register.',
  );
  process.exit(1);
}

connectDB();

const app = express();

const corsOrigins = [
  "http://localhost:5173",
  "https://minis-ecom-mern-stack-fxdr.vercel.app",
  "https://minis-ecom-mern-stack--alishameer251.replit.app",
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];



https: app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// const authRoutes = require('./routes/authRoutes');
// const productRoutes = require('./routes/productRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const contactRoutes = require('./routes/contactRoutes');
// const adminRoutes = require('./routes/adminRoutes');

console.log("[ROUTE CHECK]", {
  authRoutes: typeof authRoutes,
  productRoutes: typeof productRoutes,
  orderRoutes: typeof orderRoutes,
  cartRoutes: typeof cartRoutes,
  contactRoutes: typeof contactRoutes,
  adminRoutes: typeof adminRoutes,
});
const { registerOptionsHandler } = require('./handlers/registerOptionsHandler');
const { emailConfigured } = require('./utils/sendVerificationEmail');
const { smsSignupConfigured } = require('./utils/registerSms');

/** Bump when behavior Replit-users care about changes (see GET /api/health). */
const MINIS_API_BUILD = 'register-mail-2026-05-11';

/**
 * Single router tree mounted twice:
 * - `/api/auth`, `/api/products`, … (canonical)
 * - `/auth`, `/products`, … (same handlers — fixes clients that omit `/api`)
 *
 * This avoids mutating req.url (unreliable on some hosts / proxies).
 */
const api = express.Router();

// Public paths must be registered BEFORE `api.use('/auth', …)` so they win over a stale/partial auth router on Replit.
api.get('/health', (req, res) =>
  res.json({
    status: 'OK',
    message: 'MINIS API running',
    apiBuild: MINIS_API_BUILD,
  }),
);
api.get('/deploy-check', (_, res) =>
  res.json({ ok: true, apiBuild: MINIS_API_BUILD }),
);
api.get('/mail/register-options', registerOptionsHandler);
api.get('/auth/register-options', registerOptionsHandler);
api.get('/auth/register/options', registerOptionsHandler);

if (typeof authRoutes.resendVerificationHandler === 'function') {
  const resend = authRoutes.resendVerificationHandler;
  api.post('/mail/resend', resend);
  ['/resend-email-verification', '/resend-verification', '/resend'].forEach((p) => {
    api.post(`/auth${p}`, resend);
  });
} else {
  console.warn('[MINIS] authRoutes missing resendVerificationHandler — redeploy backend/routes/authRoutes.js');
}

api.use('/auth', authRoutes);
api.use('/products', productRoutes);
api.use('/orders', orderRoutes);
api.use('/cart', cartRoutes);
api.use('/contact', contactRoutes);
api.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send("MINIS API is running...");
});

// Browsers / bots hit these on the raw API host — not your Vercel app. Without handlers they
// fell through to JSON 404 and looked like "backend errors" in Replit logs.
app.get('/favicon.ico', (_, res) => res.status(204).end());
app.get('/robots.txt', (_, res) =>
  res.type('text/plain').send('User-agent: *\nDisallow: /\n'),
);

// Match `/api/*` first, then the same tree at repo root so `/auth/...` works when a proxy
// forwards without the `/api` prefix (common source of JSON { message: "Route not found" }).
app.use('/api', api);
app.use(api);

app.use((req, res) => {
  const looksLikeApi =
    req.path.startsWith('/api') ||
    /^\/(auth|products|orders|contact|admin|cart|health|mail)(\/|$)/.test(
      req.path,
    );

  if (looksLikeApi) {
    return res.status(404).json({
      message: 'Route not found',
      method: req.method,
      path: req.path,
    });
  }

  // Random probes / scanners — plain 404 so logs are less alarming than API-shaped JSON.
  res.status(404).type('text/plain').send('Not found');
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

if (!emailConfigured()) {
  console.warn(
    '[MINIS] Outbound mail is OFF. Signup verification needs Gmail: EMAIL_USER + EMAIL_PASS (app password), or other providers via RESEND_API_KEY / EMAIL_HOST + EMAIL_USER + EMAIL_PASS.',
  );
}
if (!smsSignupConfigured()) {
  console.warn(
    '[MINIS] Phone SMS OTP is OFF: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (and optionally DEFAULT_SMS_COUNTRY_CODE).',
  );
}

app.listen(PORT, () =>
  console.log(
    `🚀 Server running on port ${PORT} [MINIS_API_BUILD=${MINIS_API_BUILD}] — expect apiBuild field on GET /api/health`,
  ),
);
