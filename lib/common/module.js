import path from 'node:path';
import fs from 'fs';

export const MODULE_TYPES = Object.freeze({
  SCRIPT: Symbol(),
  TEMPLATE: Symbol(),
  BINARY: Symbol(),
  UNKNOWN: Symbol(),
  CERTIFICATE: Symbol(),
});

function extToType(ext) {
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.ts':
    case '.json':
      return MODULE_TYPES.SCRIPT;
    case '.html':
    case '.htm':
      return MODULE_TYPES.TEMPLATE;
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.bmp':
    case '.webp':
    case '.svg':
    case '.ico':
    case '.pdf':
    case '.zip':
    case '.tar':
    case '.gz':
      return MODULE_TYPES.BINARY;
    case '.pem':
    case '.crt':
    case '.key':
      return MODULE_TYPES.CERTIFICATE;
    default:
      return MODULE_TYPES.UNKNOWN;
  }
}

export class Module {
  constructor(module, options = {}) {
    this.name = path.basename(module);
    this.dirname = options.dirname || process.cwd();
    this.type = extToType(path.extname(module).toLowerCase());
    this.path = path.join(this.dirname, module);

    Object.freeze(this);
  }

  isExists() {
    return fs.existsSync(this.path);
  }

  async content() {
    return fs.promises.readFile(this.path, 'utf-8');
  }

  async stream() {
    return fs.createReadStream(this.path);
  }

  async import() {
    if (this.type !== MODULE_TYPES.SCRIPT) {
      throw new Error('Cannot import non-script module');
    }
    return await import(this.path);
  }

  async build() {
    if (this.type === MODULE_TYPES.SCRIPT) {
      return await this.import();
    }
    if (this.type === MODULE_TYPES.TEMPLATE) {
      const content = await this.content();
      return { default: content };
    }
    if (this.type === MODULE_TYPES.BINARY) {
      const stream = await this.stream();
      return { default: stream };
    }
    throw new Error('Unknown module type, cannot build');
  }

  isScript() {
    return this.type === MODULE_TYPES.SCRIPT;
  }

  isCertificate() {
    return this.type === MODULE_TYPES.CERTIFICATE;
  }
}
