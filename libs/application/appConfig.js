import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { Code } from '../slice/code.js';

class AppConfig {
  constructor(app) {
    this.configFile = [...Code.supportExtension, '.json']
      .map(it => path.join(app.path, `app.config${it}`))
      .find(it => fs.existsSync(it));
    this.config = {};
  }

  get(name, defaultValue) {
    const fieldsPath = name.split('.');

    let value = this.config;
    for (const field of fieldsPath) {
      value = this.config?.[field];
    }

    return value ?? defaultValue;
  }

  set(name, value) {
    const fieldsPath = name.split('.');
    let config = this.config;
    for (let i = 0; i < fieldsPath.length; i++) {
      const field = fieldsPath[i];
      if (i === fieldsPath.length - 1) {
        config[field] = value;
      } else {
        config[field] = config[field] || {};
        config = config[field];
      }
    }
  }

  async bootstrap() {
    const config = await this.readConfigFile(this.configFile);
    if (!config) return null;

    if (typeof config === 'function') {
      this.config = await config();
    } else if (typeof config.default === 'function') {
      this.config = await config.default();
    } else if (config.default) {
      this.config = config.default;
    } else {
      this.config = config;
    }
    Object.freeze(this.config);
  }

  async readConfigFile(pathSource) {
    const source = await fsp.readFile(pathSource, 'utf8');
    if (pathSource.endsWith('.json')) {
      return JSON.parse(source);
    }

    const config = new Code(source, {
      name: pathSource,
      dirname: path.dirname(pathSource),
      relative: path.relative(this.app.path, path.dirname(pathSource)),
    });
    await config.autoLoad();

    return config.exports;
  }
}

export { AppConfig };
