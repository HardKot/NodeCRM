import * as process from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs';

import type { RESTMethod, TLSOptions } from './types';


class HttpUtils {
  private constructor() {}

  static readTLS(dir?: string): TLSOptions {
    if (!dir) dir = path.join(process.cwd(), 'certs');

    const keyPath = path.join(dir, 'server.key');
    const certPath = path.join(dir, 'server.crt');

    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  public static isRestMethod(method: string): method is RESTMethod {
    return ['get', 'post', 'put', 'delete'].includes(method);
  }
}

export { HttpUtils };
