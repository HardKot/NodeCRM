import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

import { Code } from './code';
import { ISpace } from './ISpace';
import { defaultModuleExtractor, ModuleExtractor } from './moduleExtractor';
import { ComponentTypeValue, Module, RootModule } from '../core';
import { SourceMetadataParser } from './sourceMetadataParser';
import { SourceComponentParser } from './sourceComponentParser';
import { SourceModuleParser } from './sourceModuleParser';
import { StringUtils } from '../utils';

interface ComponentAssociated {
  [key: string]: ComponentTypeValue;
  service: 'PROVIDER';
  controller: 'CONSUMER';
}

interface VirtualSpaceConfig {
  path?: string;
  rootModule?: string;
  moduleExtractor?: ModuleExtractor;
  watchTimeout?: number;
  associated?: ComponentAssociated;
}
interface ModuleGroup {
  files: string[];
  modules: string[];
}

const ROOT_MODULE_KEY = 'root_module';

const DEFAULT_ASSOCIATED: ComponentAssociated = {
  service: 'PROVIDER',
  controller: 'CONSUMER',
};

class Space implements ISpace {
  static async factory(config: VirtualSpaceConfig = {}) {
    const space = new Space(
      config.path,
      config.rootModule,
      config.moduleExtractor,
      config.associated
    );

    await space.load();

    return space;
  }

  public current: Module = RootModule.Instance;
  private modules: Map<string | symbol, Module> = new Map();
  private moduleGraph: Map<string, ModuleGroup> = new Map();

  private metadataParser = new SourceMetadataParser();
  private componentParser = new SourceComponentParser(this.metadataParser);
  private moduleParser = new SourceModuleParser(this.componentParser);

  constructor(
    readonly path: string = process.cwd(),
    readonly rootName = ROOT_MODULE_KEY,
    readonly extractor: ModuleExtractor = defaultModuleExtractor,
    readonly associated: ComponentAssociated = DEFAULT_ASSOCIATED
  ) {}

  async load() {
    const spaceFiles = await this.loadSpaceFiles();

    this.moduleGraph = this.groupFilesByModule(spaceFiles);

    for (const modulePath of this.moduleGraph.keys()) {
      await this.linkModuleFromPath(modulePath);
    }

    this.moduleGraph.clear();
    this.current = this.modules.get(this.rootName) ?? RootModule.Instance;
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

  private async moduleFromPath(modulePath: string) {
    let module: Module = RootModule.Instance;
    if (modulePath === ROOT_MODULE_KEY) return module;

    const code = await this.loadCode(modulePath);
    const moduleSource = this.extractor(code, modulePath);
    return this.moduleParser.parse(moduleSource);
  }

  private groupFilesByModule(files: string[]): Map<string, ModuleGroup> {
    const groups = new Map<string, ModuleGroup>();
    groups.set(ROOT_MODULE_KEY, { files: [], modules: [] });
    let currentModule: string | null = null;
    let currentModuleDir: string | null = null;

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

    for (const file of sortedFiles) {
      if (file.parsed.name.endsWith('.module')) {
        if (currentModule && currentModuleDir && file.dir.startsWith(currentModuleDir + path.sep)) {
          groups.get(currentModule)!.modules.push(file.path);
        }

        currentModule = file.path;
        currentModuleDir = file.dir;

        if (!groups.has(file.path)) {
          groups.set(file.path, { files: [], modules: [] });
        }
      } else {
        if (currentModule && currentModuleDir && file.dir.startsWith(currentModuleDir)) {
          groups.get(currentModule)!.files.push(file.path);
        } else {
          groups.get(ROOT_MODULE_KEY)!.files.push(file.path);
        }
      }
    }

    return groups;
  }

  private async linkModuleFromPath(modulePath: string) {
    const moduleName = this.getModuleNameByPath(modulePath);
    if (this.modules.has(moduleName)) return this.modules.get(moduleName)!;
    const group = this.moduleGraph.get(modulePath);
    if (!group) throw new Error('Module group not found for path: ' + modulePath);

    const module = await this.moduleFromPath(modulePath);

    for (const file of group.files) {
      const code = await this.loadCode(file);
      const componentSource = this.extractor(code, file);
      const componentType = this.getComponentTypeByPath(file);

      const metadata = this.metadataParser.parse(componentSource);
      if (componentType) metadata.set('type', componentType);
      metadata.set('sourcePath', file);
      metadata.set('modulePath', modulePath);
      metadata.set('relativePath', path.relative(this.path, file));

      this.componentParser.parse(componentSource, {
        metadata: metadata,
        module: module,
      });
    }

    for (const subModulePath of group.modules) {
      let subModule: Module = await this.linkModuleFromPath(subModulePath);
      module.linkModule(subModule);
    }

    this.modules.set(moduleName, module);
    return module;
  }

  private getComponentTypeByPath(filePath: string): ComponentTypeValue | null {
    const parsed = path.parse(filePath);
    const extType = parsed.name.split('.').at(-1) ?? '';
    return this.associated[extType] ?? null;
  }

  private getModuleNameByPath(modulePath: string): string {
    if (modulePath === ROOT_MODULE_KEY) return ROOT_MODULE_KEY;
    const relativePath = path.relative(this.path, modulePath);
    const parsed = path.parse(relativePath);
    const name = StringUtils.factoryPascalCase.apply(StringUtils, parsed.name.split('.'));
    if (!parsed.dir) return name;
    return `${parsed.dir}/${name}`;
  }
}

export { Space, DEFAULT_ASSOCIATED };
