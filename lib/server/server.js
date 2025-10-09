import http2, { createSecureServer } from 'node:http2';

import * as config from '../common/config.js';

import fs from 'fs';
import path from 'node:path';
import { logger } from '../common/logger.js';

const SERVER_TYPE = config.get('server.type', 'http2');
const HOST = config.get('server.host', '0.0.0.0');
const PORT = config.get('server.port', 3000);
const CERT_PATH = config.get(
  'server.cert',
  path.join(process.cwd(), 'app', 'cert', 'default', 'cert.pem')
);
const KEY_PATH = config.get(
  'server.key',
  path.join(process.cwd(), 'app', 'cert', 'default', 'key.pem')
);

const serverOptions = {};

const isTLS = fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);

if (isTLS) {
  serverOptions.cert = fs.readFileSync(CERT_PATH);
  serverOptions.key = fs.readFileSync(KEY_PATH);
} else {
  logger.warn('SSL certificate or key file not found. Starting server in HTTP mode.');
}

const server = createSecureServer(serverOptions);

server.on('error', err => {
  logger.error('SERVER ERROR:', err);
});

server.on('request', (req, res) => {});
