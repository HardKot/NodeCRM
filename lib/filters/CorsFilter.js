import * as config from '../common/config.js';

const CORS_CONFIGURATION = config.get('security.cors', {
  enabled: true,
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  patterns: [/^(?!\/api(?:\/|$)).*/],
});

export function CorsFilter({ res, next }) {
  if (!CORS_CONFIGURATION.enabled) {
    return next();
  }
  res.setHeader('Access-Control-Allow-Origin', CORS_CONFIGURATION.origin);
  res.setHeader('Access-Control-Allow-Methods', CORS_CONFIGURATION.methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return next();
}
CorsFilter.pattens = CORS_CONFIGURATION.pattens;
CorsFilter.index = 1;
