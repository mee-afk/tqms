import { account } from './account.js';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { api, Problem } from './routes/operations.js';
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'DENY');
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  if (!['localhost', '127.0.0.1', '[::1]'].includes(req.hostname)) return res.status(403).json({
    error: {
      message: 'Local access only.'
    }
  });
  if (!['GET', 'HEAD'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw new Problem(403, 'Untrusted origin.');
    if (req.method !== 'DELETE' && !req.is('application/json')) throw new Problem(415, 'Send a JSON request.');
  }
  next();
});
app.use(express.json({
  limit: '3mb'
}));
app.get('/api/health', (_req, res) => res.json({
  data: {
    status: 'ok',
    service: 'Lodbod TQMS'
  }
}));
app.use('/api', account);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (process.env.TQMS_FAIL_READ === '1' && req.method === 'GET') throw new Problem(503, 'Checkpoint records are temporarily unavailable.');
  setTimeout(next, Math.min(3000, Number(process.env.TQMS_DELAY_MS) || 0));
}, api);
app.use('/api', () => {
  throw new Problem(404, 'Endpoint not found.');
});
const web = resolve(process.env.TQMS_WEB_DIR || '../frontend/dist');
app.use(express.static(web));
app.get('/{*path}', (_req, res) => res.sendFile(resolve(web, 'index.html')));
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: 'Check the form values.',
        fields: Object.fromEntries(err.issues.map(i => [i.path[0], i.message]))
      }
    });
    return;
  }
  if (err instanceof Problem) {
    res.status(err.status).json({
      error: {
        message: err.message,
        fields: err.fields
      }
    });
    return;
  }
  const status = err.status === 413 ? 413 : err.status === 400 ? 400 : 500;
  if (status === 500) console.error('Request failed:', err.message);
  res.status(status).json({
    error: {
      message: status === 413
        ? 'Request too large.'
        : status === 400 ? 'Invalid JSON.' : 'Could not complete the request. Try again.'
    }
  });
};
app.use(onError);
const port = Number(process.env.PORT) || 4000;
app.listen(port, '127.0.0.1', () => console.log('Lodbod TQMS: http://127.0.0.1:' + port));
