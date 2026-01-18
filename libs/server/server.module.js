import http2 from 'node:http2';

class ServerModule {
  constructor(options) {
    this.options = options;
    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: options.tls.key,
      cert: options.tls.cert,
    });
  }

  onModuleInit() {}
  onApplicationBootstrap() {}
  onModuleDestroy() {}
  onApplicationShutdown() {}
}
