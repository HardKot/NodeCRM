export class Config {
  constructor(app) {
    this.app = app;
    this.data = JSON.parse(JSON.stringify(Config.Default));
  }

  async load() {
    const userConfig = await Flow.of(['../app.config.js'])
      .map(file => new CrmStatic(file))
      .filter(file => file.isExists())
      .first()
      .map(async file => await file.import())
      .map(it => it.default || {})
      .get();

    this.data = Objects.mergeDeep(this.data, userConfig);
    Objects.deepFreeze(this.data);
  }

  get(path, defaultValue = undefined) {
    const keys = path.split('.');

    let value = this.data;

    for (const key of keys) {
      value = value?.[key];
    }

    return value ?? defaultValue;
  }

  static Default = Object.freeze({
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    database: {},
    logger: {
      dir: 'logs',
      enabled: true,
      severity: 'info',
      transport: 'console',
      showTimestamp: true,
      showLevel: true,
      timestampFormat: 'YYYY-MM-DD HH:mm:ss',
    },
    cache: {
      enabled: true,
      ttl: 600,
    },
    security: {
      corsConfig: {
        enabled: true,
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // limit each IP to 100 requests per windowMs
      },
      jwt: {},
    },
  });
}
