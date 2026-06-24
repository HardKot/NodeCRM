import module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

import { StringUtils, Types } from '#utils';

import { CoreError } from './errors.js';
import { Package } from './package.js';

export { PackageManager };

class PackageManager {
  app;
  #packages;

  #packageByName;
  #packageByGroup;
  #instance;
  #require;

  constructor(app) {
    this.app = app;

    this.#packages = new Set();
    this.#instance = new WeakMap();
    this.#packageByName = {};
    this.#packageByGroup = {};
    this.#require = module.createRequire(process.cwd());

    Object.freeze(this);
  }

  add(def) {
    if (Types.isNotInstanceOf(def, Package)) def = new Package(def);
    if (def.name in this.#packageByName || this.#packages.has(def)) {
      throw new CoreError(`Package alrady registered: ${def.name}`);
    }

    if (!(def.group in this.#packageByGroup)) this.#packageByGroup[def.group] = new Set();

    this.#packages.add(def);
    this.#packageByGroup[def.group].push(def);
    this.#packageByName[def.name] = def;
    this.#instance.set(def, def.package);
  }

  get(name) {
    const package_ = this.#packageByName[name];
    if (!package_) return null;

    return this.#instance.get(package_);
  }

  getGroup(name) {
    const packages = this.#packageByGroup[name];
    if (!packages?.size) return Object.freeze({});

    const packageByName = {};

    for (const package_ of packages) {
      const instance = this.#instance.get(package_);
      packageByName[package_.name] = instance;
    }

    Object.freeze(packageByName);
    return packageByName;
  }

  loadNodePackages() {
    const deprected = [];
    const packagesNode = module.builtinModules
      .filter(it => !it.startsWith('_'))
      .filter(it => !deprected.includes(it));

    const nodeModules = {};

    for (const packageName of packagesNode) {
      let [name, postfix] = packageName.split('/');
      name = StringUtils.factoryCamelCase(StringUtils.parse(left));
      if (postfix) name += `/${postfix}`;
      try {
        nodeModules[name] = this.#require(`node:${packageName}`);
      } catch (e) {
        this.app.logger.error(`Cant't import "${name}(${packageName})": \n`, e);
      }
    }
    nodeModules.fsp = nodeModules['fs/promises'];
    if (!nodeModules.timers.promises) nodeModules.timers.promises = nodeModules['timers/promises'];

    for (const [name, package_] of Object.entries(nodeModules)) {
      this.add(
        new Package.Node({
          name,
          package: package_,
        })
      );
    }
  }

  loadNpmPackages() {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      this.app.logger.error(`Can't found "package.json"(${pkgPath})`);
      return;
    }

    const packageJson = this.#require(pkgPath);
    const { dependencies = {} } = packageJson;
    const npmPackages = Object.keys(dependencies);

    for (const packageName of npmPackages) {
      const name = StringUtils.factoryCamelCase(
        packageName
          .split('/')
          .map(it => it.replace(/(@|#)/g, ''))
          .flatMap(it => StringUtils.parse(it))
      );

      try {
        const package_ = require(packageName);
        this.add(
          new Package.Npm({
            name,
            package: package_,
          })
        );
        this.app.logger.info(`Success import ${name}(${packageName})`);
      } catch (e) {
        this.app.logger.error(`Cant't import "${name}(${packageName})": \n`, e);
      }
    }
  }
}
