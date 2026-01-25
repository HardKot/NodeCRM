import crypto from 'node:crypto';
import { ObjectUtils, Result } from '../utils/index.js';

class SecurityError extends Error {}

class SecurityService {
  static config = Symbol();

  static scope = 'instance';
  static injects = [SecurityService.config];

  #secret;
  #algorithm;

  constructor(options = {}) {
    this.#secret = options.secret ?? 'default';
    this.#algorithm = options.algorithm ?? 'sha256';
    this.password = {
      abc: options.passwordAbc ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      length: options.passwordLength ?? 8,
      symbols: options.passwordSymbols ?? '!@#$%^&*()_+[]{}|;:,.<>?',
      numbers: options.passwordNumbers ?? '0123456789',
    };

    Object.freeze(this);
  }

  async passwordHash(password, algorithm = this.#algorithm) {
    const salt = await this.#generateSalt();
    const hash = crypto
      .createHash(algorithm)
      .update(password + salt + this.#secret)
      .digest('hex');
    return `${this.#algorithm}$${hash}$${salt}`;
  }
  async passwordVerify(password, hashedPassword) {
    const [algorithm, hash, salt] = hashedPassword.split('$');
    const computedHash = crypto
      .createHash(algorithm)
      .update(password + salt + this.#secret)
      .digest('hex');
    return computedHash === hash;
  }
  async generatePassword() {
    let password = '';
    const abc = this.password.abc + this.password.numbers + this.password.symbols;

    for (let i = 0; i < this.password.length; i++) {
      const index = Math.floor(Math.random() * abc);
      password += this.password[index];
    }
    return password;
  }

  async encodeJwt(data, exp = 30 * 60 * 1000, algorithm = this.#algorithm) {
    const header = ObjectUtils.toBase64Url({
      alg: algorithm.replace('sha', 'HS'),
      typ: 'JWT',
    });
    data.jti = crypto.randomUUID();
    data.iat = Date.now();
    data.exp = exp;

    const payload = ObjectUtils.toBase64Url(data);
    const signatureBase = `${header}.${payload}`;
    const signature = this.#hashObject(signatureBase);
    return `${signatureBase}.${signature}`;
  }
  async decodeJwt(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return Result.failure(new SecurityError('Invalid token format'));

    const [headerB64, payloadB64, signatureB64] = parts;
    if (signatureB64 !== (await this.#hashObject(`${headerB64}.${payloadB64}`, this.#algorithm))) {
      return Result.failure(new SecurityError('Invalid token signature'));
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (Date.now() > payload.exp) return Result.failure(new SecurityError('Token has expired'));
    return Result.success(payload);
  }

  async #generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }

  async #hashObject(data, algorithm) {
    return crypto.createHmac(algorithm, this.#secret).update(data).digest('base64url');
  }
}

export { SecurityService };
