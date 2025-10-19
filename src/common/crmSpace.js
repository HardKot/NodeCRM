import path from 'node:path';
import fs from 'fs';
import fsp from 'node:fs/promises';

export class CrmSpace {
  constructor(space, app) {
    this.name = space;
    this.app = app;

    this.path = path.join(this.app.path, this.name);
    this.module = [];
  }

  async load() {
    if (!fs.existsSync(this.path)) throw new Error(`Space path ${this.path} does not exist`);

    const stats = await fsp.stat(this.path);
    if (!stats.isDirectory()) throw new Error(`Space path ${this.path} is not a directory`);

    const files = await this.#recursiveReadDir(this.path);
    this.files = files.map(filePath => path.relative(this.path, filePath));

    return this.files;
  }

  async #recursiveReadDir(targetPath) {
    const isExists = fs.existsSync(targetPath);
    if (!isExists) return [];

    const stats = fs.statSync(targetPath);
    if (stats.isFile()) return [targetPath];
    const allFiles = [];

    if (!stats.isDirectory()) return allFiles;

    const files = await fsp.readdir(targetPath, { withFileTypes: true });

    for (const file of files) {
      if (file.name.startsWith('.')) continue;
      const fullPath = path.join(targetPath, file.name);
      if (file.isFile()) allFiles.push(fullPath);

      if (file.isDirectory()) {
        const subFiles = await this.#recursiveReadDir(fullPath);
        allFiles.push(...subFiles);
      }
    }

    return allFiles;
  }

  isScriptFile(file) {
    const ext = path.extname(file).toLowerCase();
    return ['.js', '.cjs', '.mjs', '.ts'].includes(ext);
  }
}
