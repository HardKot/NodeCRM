const http2 = require('node:http2');

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

module.exports = { ServerModule };
