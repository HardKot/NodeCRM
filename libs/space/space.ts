import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

import { Code } from './code';
import { ISpace } from './ISpace';
import { defaultModuleExtractor, ModuleExtractor } from './moduleExtractor';
import { Module, RootModule } from '../core';
import { SourceMetadataParser } from './sourceMetadataParser';
import { SourceComponentParser } from './sourceComponentParser';
import { SourceModuleParser } from './sourceModuleParser';

interface VirtualSpaceConfig {
  path?: string;
  rootModuleName?: string;
  moduleExtractor?: ModuleExtractor;
  watchTimeout?: number;
}

class Space implements ISpace {
  static async factory(config: VirtualSpaceConfig = {}) {
    const space = new Space(config.path, config.rootModuleName, config.moduleExtractor);

    await space.load();

    return space;
  }

  public current: Module = RootModule.Instance;
  private modules: Map<string | symbol, Module> = new Map();
  private metadataParser = new SourceMetadataParser();
  private componentParser = new SourceComponentParser(this.metadataParser);
  private moduleParser = new SourceModuleParser(this.componentParser);

  constructor(
    readonly path: string = process.cwd(),
    readonly rootName = 'AppModule',
    readonly extractor: ModuleExtractor = defaultModuleExtractor
  ) {}

  async load() {
    const spaceFiles = await this.loadSpaceFiles();

    const modulesCodes = await Promise.all(spaceFiles.map(it => this.loadCode(it)));
    const modulesEntries = modulesCodes
      .map(it => this.getModuleFromCode(it))
      .map(it => [it.name, it] as [string, Module]);

    this.modules = new Map<string, Module>(modulesEntries);

    this.current = RootModule.Instance;

    if (this.modules.has(this.rootName)) {
      this.current = this.modules.get(this.rootName)!;
    }
  }

  private async loadSpaceFiles() {
    const results = [];
    const dirs = [this.path];

    for (const dir of dirs) {
      const contents = await fsp.readdir(dir, { withFileTypes: true });

      for (const content of contents) {
        if (content.name.startsWith('.') || content.name.startsWith('_')) continue;
        const children = path.join(dir, content.name);
        if (content.isDirectory()) {
          dirs.push(children);
        } else if (!content.isFile()) {
          continue;
        }
        const { ext } = path.parse(children);
        if (!Code.supportExtension.includes(ext)) continue;

        results.push(children);
      }
    }

    Object.freeze(results);

    return results;
  }

  private async loadCode<T = unknown>(absolutePath: string) {
    return (await import(absolutePath)) as T;
  }

  private getModuleFromCode(code: unknown) {
    const moduleSource = this.extractor(code);

    return this.moduleParser.parse(moduleSource);
  }

  private groupFilesByModule(files: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    const sortedFiles = files
      .map(it => ({
        path: it,
        parsed: path.parse(it),
        depth: it.split(path.sep).length,
        dir: path.dirname(it),
      }))
      .toSorted((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        const aIsModule = a.parsed.name.endsWith('.module');
        const bIsModule = b.parsed.name.endsWith('.module');
        if (aIsModule && !bIsModule) return -1;
        if (!aIsModule && bIsModule) return 1;
        return a.path.localeCompare(b.path);
      });

    return groups;
  }
}

export { Space };
