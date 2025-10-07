import path from 'node:path';
import fs from 'fs';
import fsp from 'node:fs/promises';

export const MODULE_TYPES = {
  SCRIPT: Symbol(),
  TEMPLATE: Symbol(),
  BINARY: Symbol(),
  UNKNOWN: Symbol(),
};

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
    default:
      return MODULE_TYPES.UNKNOWN;
  }
}

export class QModels {
  constructor(module, options = {}) {
    this.name = path.basename(module);
    this.path = module;
    this.dirname = options.dirname || process.cwd();
    this.relative = options.relative || '.';
    this.type = extToType(path.extname(module).toLowerCase());
    Object.freeze(this);
  }

  isExists() {
    return fs.existsSync(this.relative);
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

  // Additional methods can be added here as needed

  /**
   *
   * @param dirPath {string} - path to directory or file
   * @param options {object} - options object
   * @param options.relative {string} - base path to calculate relative paths
   * @param options.dirname {string} - directory name to set for each module
   * @returns {Promise<QModels[]>}
   */
  static async readDir(dirPath, options = {}) {
    const relativeTo = options.relative || process.cwd();

    const isExists = fs.existsSync(dirPath);
    if (!isExists) throw new Error(`Path ${dirPath} does not exist`);

    const stats = await fsp.stat(dirPath);

    if (stats.isFile()) return [new QModels(dirPath, options)];

    if (stats.isDirectory()) {
      const files = await fsp.readdir(dirPath, { withFileTypes: true });
      const modules = [];

      for (const file of files) {
        if (file.isFile()) {
          const fullPath = path.join(dirPath, file.name);
          modules.push(
            new QModels(fullPath, {
              dirname: dirPath,
              relative: path.relative(relativeTo, fullPath),
            })
          );
        }

        if (file.isDirectory()) {
          const subDirPath = path.join(dirPath, file.name);
          const subModules = await QModels.readDir(subDirPath);
          modules.push(...subModules);
        }
      }

      return modules;
    }

    return [];
  }
}
