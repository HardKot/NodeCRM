import path from 'node:path';
import fs from 'node:fs';

import { BaseSchema } from '#schema';
import { ObjectUtils, Types } from '#utils';
import { HttpServerBase } from './httpServerBase.ts';

export { SpaceHttp };

interface SpaceHttpConfig {
  supportHttp1: boolean;
  supportHttp2: boolean;

  tls: { key: string; cert: string } | null;
  bodySizeLimit: number;
  maxRequestCount: number;
  cors: string | string[] | boolean;
  port: number;
  host: string;
}
const defaultSpaceHttpConfig: SpaceHttpConfig = {
  supportHttp1: false,
  supportHttp2: false,
  tls: null,
  bodySizeLimit: 1024 * 1024 * 10, // 10MB
  maxRequestCount: 1000,
  cors: false,
  port: 80,
  host: '127.0.0.1',
};

interface ISpaceHttpDescription {
  http1(): void;
  http2(): void;
  host(host: string, port?: number): void;
  host(props: { host: string; port?: number }): void;
  port(port: number): void;
  tls(key: string, cert: string): void;
  tls(props: { key: string; cert: string }): void;
  bodySizeLimit(size: number | string): void;
  maxRequestCount(count: number): void;
  cors(...cors: string[]): void;
}

class SpaceHttp implements ISpaceModule {
  #server: HttpServerBase | null;
  #config: SpaceHttpConfig;

  constructor(app: IApplication<BaseSchema>) {
    this.#server = null;
    this.#config = { ...defaultSpaceHttpConfig };
    app.injectDescription('http', this.serverDescription);
  }

  get name(): string {
    return 'SpaceHttp';
  }

  get description(): string {
    return 'HTTP module for Space framework';
  }

  get version(): string {
    return '1.0.0';
  }

  prepare?: (() => void) | undefined;

  get serverDescription(): ISpaceHttpDescription {
    return {
      http1: () => {
        this.#config.supportHttp1 = true;
      },
      http2: () => {
        this.#config.supportHttp2 = true;
      },
      host: (host: string | { host: string; port?: number }, port?: number) => {
        if (Types.isObject(host)) {
          port = host.port;
          host = host.host;
        }

        this.#config.host = host;
        if (/^[^:]*:\d+&/g.test(host) && !port) port = parseInt(host.split(':').pop() || '80');
        if (port) this.#config.port = port;
      },
      port: (port: number) => {
        if (port < 1 || port > 65535) throw new Error('Port must be between 1 and 65535');
        this.#config.port = port;
      },
      tls: (key: string | { key: string; cert: string }, cert: string = '') => {
        if (Types.isObject(key)) {
          cert = key.cert;
          key = key.key;
        }
        this.#validateTlsParams(key, cert);

        if (key.includes('/')) key = this.#loadFromFile(key, 'TLS key');
        if (cert.includes('/')) cert = this.#loadFromFile(cert, 'TLS cert');
        if (!key.includes('-----BEGIN')) throw new Error('TLS key must be a valid PEM string');
        if (!cert.includes('-----BEGIN')) throw new Error('TLS cert must be a valid PEM string');

        this.#config.tls = { key, cert };
      },
      bodySizeLimit: (size: number | string) => {
        if (Types.isString(size)) {
          const regex = /^(\d+)\s?([KMGT]?[B|b])?$/;
          const unitMultipliers: Record<string, number> = {
            b: 1,
            Kb: 1024,
            Mb: 1024 ** 2,
            Gb: 1024 ** 3,
            Tb: 1024 ** 4,
            B: 1 / 8,
            KB: 1024 / 8,
            MB: 1024 ** 2 / 8,
            GB: 1024 ** 3 / 8,
            TB: 1024 ** 4 / 8,
          };
          const match = size.match(regex);
          if (!match) throw new Error('Invalid body size limit format');

          const value = parseInt(match[1], 10);
          const unit = match[2]?.toUpperCase() ?? 'b';
          size = Math.floor(value * (unitMultipliers[unit] ?? 1));
        }

        if (size < 1) throw new Error('Body size limit must be greater than 0');
        if (Number.isNaN(size)) throw new Error('Body size limit must be a number');
        if (!Number.isInteger(size)) throw new Error('Body size limit must be an integer');
        this.#config.bodySizeLimit = size;
      },
      maxRequestCount: (count: number) => {
        if (count < 1) throw new Error('Max request count must be greater than 0');
        if (!Number.isInteger(count)) throw new Error('Max request count must be an integer');
        this.#config.maxRequestCount = count;
      },
      cors: (...cors: string[]) => {
        switch (true) {
          case cors.length === 0:
          case ['true', '1', 'yes', '*', true].includes(cors[0].toLowerCase()):
            this.#config.cors = true;
            return;
          case ['false', '0', 'no'].includes(cors[0].toLowerCase()):
            this.#config.cors = false;
            return;
          default:
            this.#config.cors = cors;
            return;
        }
      },
    };
  }

  #validateTlsParams(key: string, cert: string) {
    if (!key || !cert) throw new Error('TLS key and cert must be provided');
    if (!Types.isString(key) || !Types.isString(cert) || key.trim() === '' || cert.trim() === '')
      throw new Error('TLS key and cert must be strings');
  }

  #loadFromFile(file: string, type: string) {
    if (!path.isAbsolute(file)) throw new Error(`${type} path must be absolute`);
    if (!fs.existsSync(file)) throw new Error(`${type} file does not exist`);

    const data = fs.readFileSync(file, 'utf-8');
    return data.trim();
  }
}
