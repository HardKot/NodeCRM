import { Plugin } from '../application';
import * as http2 from 'node:http2';
import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
import { Handle } from './handle';
import { IUserRepository, Session, User } from '../security';

export type RESTMethod = 'get' | 'post' | 'put' | 'delete';

export type ContentType =
  | 'application/json'
  | 'application/octet-stream'
  | 'text/html'
  | 'text/plain';

export interface TLSOptions {
  key: Buffer;
  cert: Buffer;
}

export interface HttpServerOptions {
  port?: number;
  host?: string;
  tls: TLSOptions;
  timeout?: number;
  maxSessions?: number;
  bodyLimit?: number;
  contentType?: ContentType | ContentType[];

  accessTokenConfig: TokenConfig;
  refreshTokenConfig: TokenConfig;
}

export type OctetStream =
  | typeof Buffer
  | typeof Blob
  | typeof stream.Writable
  | typeof streamWeb.WritableStream
  | typeof stream.Readable
  | typeof streamWeb.ReadableStream;

export type RequestParams = {
  contentType?: string;
  acceptType?: string[];
  path: string;
  handler: Handle | null;
};

export interface DynamicNode {
  index: number;
  regex: RegExp | null;
  method: RESTMethod;
}
export type Routing = (path: string, method: RESTMethod) => Handle | null;

export interface JWTRefreshTokenPayload {
  jti?: string;
  username?: string;
  exp?: number;
  iat?: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenConfig {
  secret: string;
  alg?: string;
  expiresIn?: number;
}

export interface JWTAccessTokenPayload {
  jti?: string;
  exp?: number;
  refreshId?: string;
  iat?: number;

  sessionId?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
}

export interface SecurityRepositoryDeps {
  [key: symbol]: IUserRepository | ITokenRepository;
}

export type TokenBlockedStatus = -1 | 0 | 1; // -1: expired, 0: not blocked, 1: blocked

export interface ITokenRepository {
  blockToken: (params: { refreshId?: string }, options?: { life?: number }) => Promise<boolean>;
  isBlocked: (params: { refreshId?: string }) => Promise<TokenBlockedStatus>;
}

export interface ISecurityGetaway {
  isTokenBlocked: (params: { refreshId?: string }) => Promise<TokenBlockedStatus>;
  blockToken: (params: { refreshId?: string }, options?: { life?: number }) => Promise<boolean>;
  findUserByUsername: (id: string) => Promise<User | null>;
}

export interface IHttpTokenService {
  generateToken(session: Session): Tokens;
  refreshToken(refreshToken: string): Promise<Tokens>;
}
