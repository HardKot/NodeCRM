import { QModels } from './QModels.js';

const SUPPORTED_CONFIG_FILES = ['app.config.js'];

const defaultConfig = {
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
  routing: {
    dir: 'app/routes',
    cachedTtl: 60,
  },
};

const userConfig = await SUPPORTED_CONFIG_FILES.map(file => new QModels(file))
  .filter(file => file.isExists())
  .at(0)
  ?.import();

const config = defaultConfig;

if (typeof userConfig.default === 'function') {
  const userConfigResult = await userConfig.default();
  Object.assign(config, userConfigResult);
} else if (typeof userConfig.default === 'object') {
  Object.assign(config, userConfig.default);
}

export function get(path, defaultValue = undefined) {
  const keys = path.split('.');

  let value = config;

  for (const key of keys) {
    value = value?.[key];
  }

  return value ?? defaultValue;
}
