import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as module from 'node:module';
import * as events from 'node:events';

import { Code } from './code';
import { ISpace } from './ISpace';
import { defaultModuleExtractor, ModuleExtractor } from './moduleExtractor';
import { Module, RootModule } from '../core';

interface VirtualSpaceConfig {
  path?: string;
  context?: Record<string, any>;
  watchTimeout?: number;
  rootModuleName?: string;
  rootExtractor?: ModuleExtractor;
  preprocessor?: (code: string) => string;
}

class VirtualSpace extends events.EventEmitter implements ISpace {
  static async factory(config: VirtualSpaceConfig = {}) {
    const space = new VirtualSpace(
      config.path,
      config.context,
      config.watchTimeout,
      config.rootModuleName,
      config.rootExtractor,
      config.preprocessor
    );

    await space.load();
    space.watch();

    return space;
  }

  private codes = new Map();
  private modules = new Map();
  public current: Module = RootModule.Instance;

  constructor(
    readonly path: string = process.cwd(),
    readonly codeContext = {},
    readonly watchTimeout = 500,
    readonly rootName = 'app.module',
    readonly extractor: ModuleExtractor = defaultModuleExtractor,
    readonly preprocessor?: (code: string) => string
  ) {
    super();
    Object.freeze(this);
  }

  async load() {
    this.modules.clear();
    const files = await this.loadFiles();

    for (const file of files) {
      const moduleName = this.getModuleName(file);
      if (!moduleName.endsWith('.module')) continue;

      const module = this.loadCode(file);
      this.modules.set(moduleName, await module.exports);
    }
  }

  watch() {
    let timeoutId: NodeJS.Timeout | null = null;

    fs.watch(
      this.path,
      {
        recursive: true,
        encoding: 'utf-8',
        persistent: false,
      },
      () => {
        if (timeoutId !== null) clearTimeout(timeoutId);

        timeoutId = setTimeout(this.load.bind(this), this.watchTimeout);
      }
    );
  }

  onUpdate(listener: (module: Module) => void) {
    const EVENT_NAME = 'update';
    this.on(EVENT_NAME, listener);
    return () => this.off(EVENT_NAME, listener);
  }

  [Symbol.asyncIterator]() {
    let resolver: { (value: Module): void };

    this.onUpdate(module => resolver?.(module));

    return {
      next() {
        return new Promise(resolve => {
          resolver = resolve;
        });
      },
    };
  }

  private async loadFiles() {
    const results = [];
    const dirs = [this.path];

    for (const dir of dirs) {
      const contents = await fsp.readdir(dir, { withFileTypes: true });

      for (const content of contents) {
        if (content.name.startsWith('.') || content.name.startsWith('_')) continue;
        const children = path.join(dir, content.name);
        if (content.isDirectory()) {
          dirs.push(children);
        } else if (content.isFile() && Code.supportExtension.some(it => children.endsWith(it))) {
          results.push(children);
        }
      }
    }

    Object.freeze(results);

    return results;
  }

  private loadCode(absolutePath: string) {
    const moduleName = this.getModuleName(absolutePath);

    if (this.codes.has(moduleName)) return this.codes.get(moduleName)!;
    if (!fs.existsSync(absolutePath)) return null;

    let source = fs.readFileSync(absolutePath, 'utf-8');
    if (this.preprocessor) source = this.preprocessor(source);
    let name = path.basename(absolutePath);

    if (name === 'index') name = path.dirname(absolutePath);

    const code = new Code(source, {
      name: name,
      dirname: path.dirname(absolutePath),
      createRequire: this.createRequire.bind(this),
      context: this.codeContext,
    });
    code.load();
    this.codes.set(moduleName, code);
    return code;
  }

  private createRequire(relativePath: string) {
    const originRequire = module.createRequire(relativePath);
    const self = this;

    function require(modulePath: string) {
      if (path.isAbsolute(modulePath)) {
        if (path.relative(self.path, modulePath).startsWith('..')) {
          return originRequire(modulePath);
        }

        if (Code.supportExtension.includes(path.extname(modulePath)))
          return self.loadCode(modulePath)?.exports;

        for (const ext of Code.supportExtension) {
          const module = self.loadCode(`${modulePath}${ext}`)?.exports;
          if (module) return module;
        }

        return null;
      }

      return originRequire(modulePath);
    }

    return require;
  }

  private getModuleName(absolutePath: string) {
    let moduleName = path.relative(this.path, absolutePath);
    moduleName = moduleName.replace(path.parse(moduleName).ext, '');
    return moduleName;
  }
}

export { VirtualSpace };
