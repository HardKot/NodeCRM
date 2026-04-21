import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { Code } from './code';
import { defaultModuleExtractor } from './moduleExtractor';
import { RootModule } from '../core';
import { SourceMetadataParser } from './sourceMetadataParser';
import { SourceComponentParser } from './sourceComponentParser';
import { SourceModuleParser } from './sourceModuleParser';
import { StringUtils } from '../utils';
const ROOT_MODULE_KEY = 'root_module';
const SpaceMetadataKey = Object.freeze({
    SOURCE_PATH: 'sourcePath',
    MODULE_PATH: 'modulePath',
    RELATIVE_PATH: 'relativePath',
    TYPE: 'type',
});
const DEFAULT_ASSOCIATED = {
    service: 'PROVIDER',
    controller: 'CONSUMER',
};
class Space {
    path;
    rootName;
    extractor;
    associated;
    static factory(config = {}) {
        const space = new Space(config.path, config.rootModule, config.moduleExtractor, config.associated);
        return async () => {
            await space.load();
            return space.current;
        };
    }
    static async create(config = {}) {
        const space = new Space(config.path, config.rootModule, config.moduleExtractor, config.associated);
        await space.load();
        return space.current;
    }
    current = RootModule.Instance;
    modules = new Map();
    moduleGraph = new Map();
    metadataParser = new SourceMetadataParser();
    componentParser = new SourceComponentParser(this.metadataParser);
    moduleParser = new SourceModuleParser(this.componentParser);
    constructor(path = process.cwd(), rootName = ROOT_MODULE_KEY, extractor = defaultModuleExtractor, associated = DEFAULT_ASSOCIATED) {
        this.path = path;
        this.rootName = rootName;
        this.extractor = extractor;
        this.associated = associated;
    }
    async load() {
        const spaceFiles = await this.loadSpaceFiles();
        this.moduleGraph = this.groupFilesByModule(spaceFiles);
        for (const modulePath of this.moduleGraph.keys()) {
            await this.linkModuleFromPath(modulePath);
        }
        this.moduleGraph.clear();
        this.current = this.modules.get(this.rootName) ?? RootModule.Instance;
    }
    async loadSpaceFiles() {
        const results = [];
        const dirs = [this.path];
        for (const dir of dirs) {
            const contents = await fsp.readdir(dir, { withFileTypes: true });
            for (const content of contents) {
                if (content.name.startsWith('.') || content.name.startsWith('_'))
                    continue;
                const children = path.join(dir, content.name);
                if (content.isDirectory()) {
                    dirs.push(children);
                }
                else if (!content.isFile()) {
                    continue;
                }
                const { ext } = path.parse(children);
                if (!Code.supportExtension.includes(ext))
                    continue;
                results.push(children);
            }
        }
        Object.freeze(results);
        return results;
    }
    async loadCode(absolutePath) {
        return (await import(absolutePath));
    }
    async moduleFromPath(modulePath) {
        let module = RootModule.Instance;
        if (modulePath === ROOT_MODULE_KEY)
            return module;
        const code = await this.loadCode(modulePath);
        const moduleSource = this.extractor(code, this.getModuleVariantNames(path.parse(modulePath).name));
        return this.moduleParser.parse(moduleSource);
    }
    groupFilesByModule(files) {
        const groups = new Map();
        groups.set(ROOT_MODULE_KEY, { files: [], modules: [] });
        let currentModule = null;
        let currentModuleDir = null;
        const sortedFiles = files
            .map(it => ({
            path: it,
            parsed: path.parse(it),
            depth: it.split(path.sep).length,
            dir: path.dirname(it),
        }))
            .toSorted((a, b) => {
            if (a.depth !== b.depth)
                return a.depth - b.depth;
            const aIsModule = a.parsed.name.endsWith('.module');
            const bIsModule = b.parsed.name.endsWith('.module');
            if (aIsModule && !bIsModule)
                return -1;
            if (!aIsModule && bIsModule)
                return 1;
            return a.path.localeCompare(b.path);
        });
        for (const file of sortedFiles) {
            if (file.parsed.name.endsWith('.module')) {
                if (currentModule && currentModuleDir && file.dir.startsWith(currentModuleDir + path.sep)) {
                    groups.get(currentModule).modules.push(file.path);
                }
                currentModule = file.path;
                currentModuleDir = file.dir;
                if (!groups.has(file.path)) {
                    groups.set(file.path, { files: [], modules: [] });
                }
            }
            else {
                if (currentModule && currentModuleDir && file.dir.startsWith(currentModuleDir)) {
                    groups.get(currentModule).files.push(file.path);
                }
                else {
                    groups.get(ROOT_MODULE_KEY).files.push(file.path);
                }
            }
        }
        return groups;
    }
    async linkModuleFromPath(modulePath) {
        const moduleName = this.getModuleNameByPath(modulePath);
        if (this.modules.has(moduleName))
            return this.modules.get(moduleName);
        const group = this.moduleGraph.get(modulePath);
        if (!group)
            throw new Error('Module group not found for path: ' + modulePath);
        const module = await this.moduleFromPath(modulePath);
        for (const file of group.files) {
            const code = await this.loadCode(file);
            const componentSource = this.extractor(code, this.getModuleVariantNames(path.parse(file).name));
            const componentType = this.getComponentTypeByPath(file);
            const metadata = this.metadataParser.parse(componentSource);
            if (componentType)
                metadata.set(SpaceMetadataKey.TYPE, componentType);
            metadata.set(SpaceMetadataKey.SOURCE_PATH, file);
            metadata.set(SpaceMetadataKey.MODULE_PATH, modulePath);
            metadata.set(SpaceMetadataKey.RELATIVE_PATH, path.relative(this.path, file));
            this.componentParser.parse(componentSource, {
                metadata: metadata,
                module: module,
            });
        }
        for (const subModulePath of group.modules) {
            let subModule = await this.linkModuleFromPath(subModulePath);
            module.linkModule(subModule);
        }
        this.modules.set(moduleName, module);
        return module;
    }
    getComponentTypeByPath(filePath) {
        const parsed = path.parse(filePath);
        const extType = parsed.name.split('.').at(-1) ?? '';
        return this.associated[extType] ?? null;
    }
    getModuleNameByPath(modulePath) {
        if (modulePath === ROOT_MODULE_KEY)
            return ROOT_MODULE_KEY;
        const relativePath = path.relative(this.path, modulePath);
        const parsed = path.parse(relativePath);
        const name = StringUtils.factoryPascalCase.apply(StringUtils, parsed.name.split('.'));
        if (!parsed.dir)
            return name;
        return `${parsed.dir}/${name}`;
    }
    getModuleVariantNames(name) {
        return [
            name,
            StringUtils.factoryPascalCase(...name.split('.')),
            StringUtils.factoryCamelCase(...name.split('.')),
        ];
    }
}
export { Space, DEFAULT_ASSOCIATED, SpaceMetadataKey };
