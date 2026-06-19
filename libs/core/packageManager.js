import module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

import { StringUtils, Types } from '#utils';

import { CoreError } from './coreError.js';
import { Package } from './package.js';

class PackageManager {
  app;
  #packages;

  #packageByName;
  #packageByGroup;
  #instance;
  #require;

  constructor(app, packages = []) {
    this.app = app;

    this.#packages = new Set(packages.filter(it => Types.isNotInstanceOf(it, Package)));
    this.#instance = new WeakMap();
    this.#packageByName = {};
    this.#packageByGroup = {};
    this.#require = module.createRequire(process.cwd());

    for (const package of packages) this.add(package);
    for (const package of this.#packages) this.#initInstance(package);

    Object.freeze(this);
  }

  async init() {
    await this.nodePackages();
    await this.npmPackages();
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
    const package = this.#packageByName[name];
    if (!package) return null;

    return this.#instance.get(package);
  }

  getGroup(name) {
    const packages = this.#packageByGroup[name];
    if (!packages?.size) return Object.freeze({});

    const packageByName = {};

    for (const package of packages) {
      const instance = this.#instance.get(package);
      packageByName[package.name] = instance;
    }

    Object.freeze(packageByName);
    return packageByName;
  }

  async nodePackages() {
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

    for (const [name, package] of Object.entries(nodeModules)) {
      this.add(
        new Package.Node({
          name,
          package,
        })
      );
    }
  }

  async npmPackages() {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      this.app.logger.error(`Can't found "package.json"(${pkgPath})`);
      return [];
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
        const package = require(packageName);
        this.app(
          new Package.Npm({
            name,
            package,
          })
        );
        this.app.logger.info(`Success import ${name}(${packageName})`);
      } catch (e) {
        this.app.logger.error(`Cant't import "${name}(${packageName})": \n`, e);
      }
    }
  }

  async #initInstance(def) {
    if (Types.isNotInstanceOf(def, Package)) throw new CoreError('Invalid package defination');
    const packagePromise = await (def.factory?.() ?? import(def.name));
    this.#instance.set(def, packagePromise);
  }
}

export { PackageManager };
