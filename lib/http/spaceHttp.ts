import { BaseSchema } from '#schema';
import { HttpServerBase } from './httpServerBase.ts';
import { HttpServer } from './httpServer.ts';
import { SpaceHttpDescription } from './spaceHttpDescription.ts';

export { SpaceHttp };

const defaultSpaceHttpConfig: Omit<CreateHttpProps, 'logger'> = {
  http1: false,
  http2: false,
  tls: null,
  maxBodySize: 1024 * 1024 * 10, // 10MB
  requestPoolSize: 1000,
  port: 80,
  host: '127.0.0.1',
  requestTimeout: 60_000, // 60 seconds
};

class SpaceHttp implements ISpaceModule {
  #server: HttpServerBase | null;
  #config: CreateHttpProps;

  constructor(app: IApplication<BaseSchema>) {
    this.#server = null;
    this.#config = { ...defaultSpaceHttpConfig, logger: app.logger.extend('SpaceHttp') };
    app.injectDescription('http', new SpaceHttpDescription(this.#config));
  }

  get name(): string {
    return 'SpaceHttp';
  }

  get description(): string {
    return 'HTTP module for Space framework';
  }

  prepare() {
    if (!this.#config.http1 && !this.#config.http2) {
      throw new Error('At least one of HTTP1 or HTTP2 must be supported');
    }

    if (this.#config.http1 && !this.#config.http2) {
      this.#server = new HttpServer(this.#config);
    }
  }
}
