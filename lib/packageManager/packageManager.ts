import module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { Package } from './package.ts';
import { BuildSymbol, CoreError, PackageGroups } from '#constant';
import { StringUtils, Types } from '#utils';
import { PackageBuilder } from './packageBuilder.ts';

export { PackageManager };

interface PackageManagerProps {
  logger: ILogger;
  exclude?: string[];
}

interface IPackageJSON {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
}

interface ImportPackageProps {
  name: string;
  packagePath: string;
  type: IPackageGroupsValue;
}

class PackageManager implements IPackageManager {
  #logger: ILogger;

  #packages: Set<any>;

  #packageByName: Record<string, IPackage<any>>;
  #packageByGroup: { [key in IPackageGroupsKey]: Set<IPackage<any>> };
  #instance: WeakMap<IPackage<any>, any>;
  #require: NodeJS.Require;

  exclude: Readonly<string[]>;

  constructor({ logger, exclude }: PackageManagerProps) {
    logger.warn('PackageManager is development version, please use it with caution');
    this.#logger = logger.extend('PackageManager');
    this.#packages = new Set();
    this.#instance = new WeakMap();
    this.#packageByName = {};
    this.#packageByGroup = {
      NODE: new Set<IPackage<any>>(),
      NPM: new Set<IPackage<any>>(),
      LIB: new Set<IPackage<any>>(),
    };
    this.#require = module.createRequire(process.cwd());
    this.exclude = [...(exclude ?? [])];
    Object.freeze(this.exclude);

    Object.freeze(this);
  }

  binder(callback: { <T>(builder: IPackageBuilder<T>): void }): void {
    const builder = new PackageBuilder();

    callback(builder);

    this.def(builder[BuildSymbol]());
  }

  def<T>(def: IPackage<T>) {
    if (def.name in this.#packageByName || this.#packages.has(def)) {
      throw new CoreError(`Package alrady registered: ${def.name}`);
    }

    this.#packages.add(def);
    this.#packageByGroup[PackageGroups(def.group) ?? 'LIB'].add(def);
    this.#packageByName[def.name] = def;
    this.#instance.set(def, def.package);
  }

  get<T>(name: string): null | T {
    const package_ = this.#packageByName[name];
    if (!package_) return null;

    return this.#instance.get(package_) as T;
  }

  getGroup<T extends object>(group: IPackageGroupsValue): Readonly<T | {}> {
    const name = PackageGroups(group);
    if (!name) return Object.freeze({});

    const packages = this.#packageByGroup[name];
    const entries = [];

    for (const package_ of packages) {
      if (!package_.name) continue;
      entries.push([package_.name, this.#instance.get(package_)]);
    }

    const packageByName = Object.fromEntries(entries) as Record<string, T>;
    Object.freeze(packageByName);
    return packageByName;
  }

  async loadNodePackages() {
    const packagesNode = module.builtinModules.filter((it) => !it.startsWith('_'));

    await Promise.all(
      packagesNode.map((packageName) =>
        this.#importPackage({
          name: packageName,
          packagePath: packageName,
          type: PackageGroups.NODE,
        })
      )
    );

    await Promise.all([
      this.#importPackage({
        name: 'fsp',
        packagePath: 'fs/promises',
        type: PackageGroups.NODE,
      }),
      this.#importPackage({
        name: 'pathPosix',
        packagePath: 'path/posix',
        type: PackageGroups.NODE,
      }),
      this.#importPackage({
        name: 'pathWin32',
        packagePath: 'path/win32',
        type: PackageGroups.NODE,
      }),
      this.#importPackage({
        name: 'timersPromises',
        packagePath: 'timers/promises',
        type: PackageGroups.NODE,
      }),
    ]);
  }

  async loadNpmPackages() {
    const packageJson = await this.#readPackageJson(process.cwd());
    if (!packageJson) {
      this.#logger.warn(`Can't found "package.json in "(${process.cwd()}), skip load lib package`);
      return;
    }
    const { dependencies = {} } = packageJson;
    const npmPackages = Object.keys(dependencies);

    await Promise.all(
      npmPackages.map((packageName) =>
        this.#importPackage({
          name: packageName,
          packagePath: packageName,
          type: PackageGroups.NPM,
        })
      )
    );
  }

  async loadLibPackages() {
    const libsPath = path.join(process.cwd(), 'libs');

    if (!fs.existsSync(libsPath)) {
      this.#logger.warn(`Can't found directory "libs"(${libsPath}), skip load lib packages`);
      return;
    }

    const contents = await fsp.readdir(libsPath, { withFileTypes: true });
    const directories = contents.filter((it) => it.isDirectory());

    await Promise.all(
      directories.map((content) =>
        this.#importPackage({
          name: content.name,
          packagePath: path.join(libsPath, content.name),
          type: PackageGroups.LIB,
        })
      )
    );
  }

  async #readPackageJson(packagePath: string): Promise<IPackageJSON | null> {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;

    const content = await fsp.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    if (!this.#isPacakgeJson(packageJson)) return null;

    return packageJson;
  }

  async #importPackage({ name, packagePath, type }: ImportPackageProps) {
    if (this.exclude.includes(name)) {
      this.#logger.warn(`Skip import "${name}" because it is in the exclude list`);
      return;
    }
    try {
      const packageName = this.#createPackageName(name);
      const value = await this.#require(packagePath);
      this.def(
        new Package({
          name: packageName,
          group: type,
          package: value,
        })
      );
      this.#logger.info(`Success import ${name}(${packageName})`);
    } catch (e) {
      const error = Types.normolizeError(e, CoreError);
      this.#logger.error(`Cant't import "${name}": \n`, error);
    }
  }

  #isPacakgeJson(packageJson: unknown): packageJson is IPackageJSON {
    if (typeof packageJson !== 'object' || packageJson === null) return false;
    if (!('name' in packageJson) || !('version' in packageJson)) return false;
    if (typeof packageJson.name !== 'string' || typeof packageJson.version !== 'string') return false;

    return true;
  }

  #createPackageName(name: string) {
    return StringUtils.factoryCamelCase(
      name
        .split('/')
        .map((it) => it.replace(/(@|#)/g, ''))
        .flatMap((it) => StringUtils.parse(it))
    );
  }
}
