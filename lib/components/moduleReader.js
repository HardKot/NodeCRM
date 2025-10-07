import fs from 'fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../common/logger.js';

/**
 *
 * @param modulePath {string} - путь к файлу или директории с модулями
 * @returns {Promise<{name: string, type: 'text' | 'script' | 'binary',  build: function(): Promise<any>}[]>} - массив объектов модулей
 */
export async function moduleReader(modulePath) {
  const isExists = fs.existsSync(modulePath);
  if (!isExists) {
    throw new Error(`Путь ${modulePath} не существует`);
  }

  const stats = await fsp.stat(modulePath);
  if (stats.isFile()) {
    const module = await createModuleObject(modulePath);
    return [module];
  }

  if (stats.isDirectory()) {
    const files = await recursiveRead(modulePath);
    const modules = await Promise.all(files.map(createModuleObject));
    return modules.filter(Boolean);
  }
}

async function recursiveRead(dir, { skipHidden = true } = {}) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const modules = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subModules = await recursiveRead(fullPath);
      modules.push(...subModules);
    } else if (entry.isFile()) {
      if (entry.name.startsWith('.') || skipHidden) continue; // Пропускаем скрытые файлы
      modules.push(path.join(fullPath, entry.name));
    }
  }

  return modules;
}

async function createModuleObject(filePath) {
  if (!filePath) return null;

  const name = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath).toLowerCase();

  const isScript = ['.js', '.mjs', '.cjs', '.ts'].includes(ext);
  const isJSON = ext === '.json';
  const isHTML = ext === '.html';
  const isText = ['.txt', '.md'].includes(ext);

  if (!isScript && !isJSON && !isHTML && !isText) {
    logger.warn('Unsupported file type:', { filePath });
  }

  const module = {
    name,
    path: filePath,
  };

  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.ts':
    case '.json':
      module.type = 'script';
      module.build = async () => import(filePath);
      break;
    case '.html':
    case '.txt':
    case '.md':
      module.type = 'text';
      module.build = async () => {
        const content = await fsp.readFile(filePath, 'utf-8');
        return { default: content };
      };
      break;
    default:
      module.type = 'binary';
      module.build = async () => {
        const content = await fs.createReadStream(filePath);
        return { default: content };
      };
  }

  return module;
}
