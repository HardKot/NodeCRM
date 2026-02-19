import * as crypto from 'node:crypto';
import { Result } from '../utils';

class JwtError extends Error {}

class JwtService {
  #hasher: (data: string) => string;

  constructor(
    secret: string,
    public alg: string,
    public expiresIn: number
  ) {
    this.#hasher = (v: string)=> {
      switch (this.alg) {
        case 'HS256':
        case 'HS384':
        case 'HS512':
          return crypto
            .createHmac(`sha${this.alg.slice(2)}`, secret)
            .update(v)
            .digest('base64');
        default:
          throw new Error(`Unsupported algorithm: ${this.alg}`);
      }
    }
  }

  generate(data: Record<string, any>, jti?: string) {
    const header = this.encodeBase64Url({
      alg: this.alg,
      typ: 'JWT',
    });

    if (!jti) jti = crypto.randomUUID();
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.expiresIn;

    const payload = this.encodeBase64Url({
      ...data,
      iat,
      exp,
      jti,
    });

    const unsignedToken = `${header}.${payload}`;
    const signature = this.getSignature(unsignedToken);

    return `${unsignedToken}.${signature}`;
  }


  getJTI(token: string): Result<string, JwtError> {
    try {
      const [_, payload] = token.split('.');
      const data = this.decodeBase64Url<{ jti?: string }>(payload);
      if (!data.jti) {
        return Result.failure(new JwtError('Token does not contain jti'));
      }
      return Result.success(data.jti);
    } catch (error) {
      return Result.failure(new JwtError('Invalid token'));
    }
  }

  verify<T extends { exp?: number }>(token: string): Result<T, JwtError> {
    const [header, payload, signature] = token.split('.');

    if (this.getSignature(`${header}.${payload}`) !== signature) {
      return Result.failure(new JwtError('Invalid token signature'));
    }

    try {
      const data = this.decodeBase64Url<T>(payload);

      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
        return Result.failure(new JwtError('Token has expired'));
      }

      return Result.success(data);
    } catch (error) {
      return Result.failure(new JwtError('Invalid token payload'));
    }
  }

  private getSignature(token: string): string {
    const [header, payload] = token.split('.');
    return this.#hasher(`${header}.${payload}`)
      .replace(/=/g, '=')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private encodeBase64Url(value: any): string {
    const base64 = Buffer.from(JSON.stringify(value)).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  private decodeBase64Url<T>(value: string): T {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json) as T;
  }


}


export { JwtError, JwtService }
