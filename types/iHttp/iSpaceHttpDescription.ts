interface IAuthenticate {
  (type: 'jwt' | 'public' | 'private' | string, callback: () => void): void;
  (callback: () => void): void;
}

interface IJwtProps {
  secret?: string;
  privateKey?: string;

  issuer?: string;
  audience?: string | string[];
  expiresIn?: string | number;
  notBefore?: string | number;
  claims?: Record<string, any>;
}

declare interface iSpaceHttpDescription {
  http1(): void;
  http2(): void;
  host(host: string, port?: number): void;
  host(host: { host: string; port?: number }): void;
  port(port: number): void;
  tls(key: string, cert: string): void;
  tls(key: { key: string; cert: string }): void;
  bodySizeLimit(size: number | string): void;
  maxRequestCount(count: number): void;
  requestTimeout(timeout: number | string): void;
  onError(callback: (error: Error, command: IHttpHandlerDescription) => OptionalPromise): void;
  onNotFound(callback: (command: IHttpHandlerDescription) => OptionalPromise): void;
  routing(callback: IHttpRoutingDescription & IAuthenticate): void;
  jwt(props: IJwtProps): void;
}
