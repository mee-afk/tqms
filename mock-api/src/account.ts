import { Router } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.env.TQMS_DATA_DIR || 'data',
  file = join(dir, 'account.json');
// A server restart signs out every browser. The password hash stays on disk.
const sessions = new Map<string, number>();
const username = 'thankot';
const password = () => process.env.TQMS_INITIAL_PASSWORD || 'Thankot@2083';
function encode(value: string) {
  const salt = randomBytes(16).toString('hex');
  return {
    salt,
    hash: scryptSync(value, salt, 32).toString('hex')
  };
}
function store(value: string) {
  mkdirSync(dir, {
    recursive: true
  });
  writeFileSync(file + '.tmp', JSON.stringify(encode(value)), {
    mode: 0o600
  });
  renameSync(file + '.tmp', file);
}
function matches(value: unknown) {
  if (typeof value !== 'string' || value.length > 150) return false;
  if (!existsSync(file)) store(password());
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  return timingSafeEqual(Buffer.from(stored.hash, 'hex'), scryptSync(value, stored.salt, 32));
}
export const account = Router();
const token = (cookie = '') => cookie.match(/(?:^|; )tqms_session=([0-9a-f]+)/)?.[1] || '';
account.get('/session', (req, res) => res.json({
  data: {
    signedIn: (sessions.get(token(req.headers.cookie)) || 0) > Date.now()
  }
}));
let failures = 0,
  until = 0;
account.post('/login', (req, res) => {
  if (until > Date.now()) return res.status(429).json({
    error: {
      message: 'Too many attempts. Try again in a minute.'
    }
  });
  if (req.body?.username !== username || !matches(req.body?.password)) {
    if (++failures >= 8) {
      until = Date.now() + 60000;
      failures = 0;
    }
    return res.status(401).json({
      error: {
        message: 'Check the username and password.'
      }
    });
  }
  failures = 0;
  const key = randomBytes(32).toString('hex'),
    age = req.body.remember ? 7 * 86400000 : 8 * 3600000;
  sessions.set(key, Date.now() + age);
  res.cookie('tqms_session', key, {
    httpOnly: true,
    sameSite: 'strict',
    ...(req.body.remember ? {
      maxAge: age
    } : {})
  }).json({
    data: true
  });
});
account.use((req, res, next) => {
  if ((sessions.get(token(req.headers.cookie)) || 0) <= Date.now()) return res.status(401).json({
    error: {
      message: 'Please sign in.'
    }
  });
  next();
});
account.post('/logout', (req, res) => {
  sessions.delete(token(req.headers.cookie));
  res.clearCookie('tqms_session').json({
    data: true
  });
});
account.post('/password', (req, res) => {
  const {
    current,
    password,
    confirm
  } = req.body || {};
  if (!matches(current) || typeof password !== 'string' || password.length < 8 || password.length > 150 || confirm !== password) return res.status(422).json({
    error: {
      message: 'Check the current password, then enter and confirm a new password of at least eight characters.'
    }
  });
  store(password);
  sessions.clear();
  res.clearCookie('tqms_session').json({
    data: true
  });
});
