// lib/security/jwt.js
import crypto from 'node:crypto';

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (str.length % 4);
  if (pad !== 4) str += '='.repeat(pad);
  return Buffer.from(str, 'base64').toString('utf8');
}

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function parse(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const header = safeJson(base64urlDecode(h));
  const payload = safeJson(base64urlDecode(p));
  if (!header || !payload) return null;
  return { header, payload, signature: s, raw: { header: h, payload: p } };
}

function timingSafeEq(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signHmac(alg, data, secret) {
  const map = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };
  const hash = map[alg];
  if (!hash) throw new Error('Unsupported HMAC alg');
  return crypto.createHmac(hash, secret).update(data).digest('base64url');
}

function signRsa(alg, data, privateKey) {
  const map = {
    RS256: 'RSA-SHA256',
    RS384: 'RSA-SHA384',
    RS512: 'RSA-SHA512',
  };
  const name = map[alg];
  if (!name) throw new Error('Unsupported RSA alg');
  const signer = crypto.createSign(name);
  signer.update(data);
  signer.end();
  return signer.sign(privateKey).toString('base64url');
}

function verifyRsaEcdsa(alg, data, signature, publicKey) {
  const map = {
    RS256: 'RSA-SHA256',
    RS384: 'RSA-SHA384',
    RS512: 'RSA-SHA512',
    ES256: 'sha256',
    ES384: 'sha384',
    ES512: 'sha512',
  };
  const name = map[alg];
  if (!name) throw new Error('Unsupported RSA/ECDSA alg');
  const verify = crypto.createVerify(name);
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, Buffer.from(signature, 'base64url'));
}

export function verify(token, { secret, publicKey, clockSkewSec = 60 }) {
  const parsed = parse(token);
  if (!parsed) return { valid: false, reason: 'format' };
  const { header, payload, raw, signature } = parsed;
  if (!header.alg || header.alg === 'none') return { valid: false, reason: 'alg' };

  const signingInput = `${raw.header}.${raw.payload}`;

  let ok = false;
  try {
    if (header.alg.startsWith('HS')) {
      if (!secret) return { valid: false, reason: 'secret' };
      const expected = signHmac(header.alg, signingInput, secret);
      ok = timingSafeEq(expected, signature);
    } else if (header.alg.startsWith('RS')) {
      if (!publicKey) return { valid: false, reason: 'key' };
      ok = verifyRsaEcdsa(header.alg, signingInput, signature, publicKey);
    } else {
      return { valid: false, reason: 'alg_unsupported' };
    }
  } catch {
    return { valid: false, reason: 'verify_error' };
  }
  if (!ok) return { valid: false, reason: 'signature' };

  const now = Math.floor(Date.now() / 1000);
  if (payload.nbf && now + clockSkewSec < payload.nbf) return { valid: false, reason: 'nbf' };
  if (payload.exp && now - clockSkewSec >= payload.exp) return { valid: false, reason: 'exp' };

  return { valid: true, header, payload };
}

export function sign(payload, { alg = 'HS256', secret, privateKey, header = {} } = {}) {
  if (typeof payload !== 'object' || payload == null) throw new Error('payload must be object');
  const baseHeader = { typ: 'JWT', alg, ...header };
  const h = base64urlJson(baseHeader);
  const p = base64urlJson(payload);
  const signingInput = `${h}.${p}`;

  let signature;
  if (alg.startsWith('HS')) {
    if (!secret) throw new Error('secret required for HMAC');
    signature = signHmac(alg, signingInput, secret);
  } else if (alg.startsWith('RS')) {
    if (!privateKey) throw new Error('privateKey required for RSA');
    signature = signRsa(alg, signingInput, privateKey);
  } else {
    throw new Error('Unsupported alg');
  }
  return `${signingInput}.${signature}`;
}
