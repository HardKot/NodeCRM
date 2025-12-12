import crypto from 'node:crypto';

class JwtService {
  #secret;

  constructor(secret, options = {}) {
    this.#secret = secret;
    this.algorithm = options.algorithm || 'HS256';
  }

  encode(content) {
    const header = this.objectToBase64Url({
      alg: this.algorithm,
      typ: 'JWT',
    });
    const payload = this.objectToBase64Url(content);
    const signature = `${header}.${payload}`;
    const signed = this.hash(signature);
    return `${signature}.${signed}`;
  }

  decode(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];

    const signatureCheck = this.hash(`${headerB64}.${payloadB64}`);
    if (signatureCheck !== signatureB64) throw new Error('Invalid token signature');

    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  }

  objectToBase64Url(obj) {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  hash(data) {
    const algorithm = this.algorithm.replace('HS', 'sha');
    const hmac = crypto.createHmac(algorithm, this.#secret);
    hmac.update(data);
    return hmac.digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}

export { JwtService };
