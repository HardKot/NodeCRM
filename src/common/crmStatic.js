import path from 'node:path';
import fs from 'fs';

export class CrmStatic {
  constructor(module, options = {}) {
    this.name = path.basename(module);
    this.dirname = options.dirname || process.cwd();
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
}
