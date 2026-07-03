import { CoreError } from '../errors.js';
import { Scoped } from '../enums.js';
import { BuildSymbol } from './symbols.js';

import type { IBean, ICallback, ScopeValue } from './interfaces.ts';
import { Types } from '#utils';

export { Bean, BeanBuilder };

interface BeanProps<T> {
  name: string;
  factory: (...deps: any[]) => T;
  scope?: ScopeValue | keyof typeof Scoped;
  deps?: string[];
  aliases?: string[];
  eager?: boolean;
  async?: boolean;

  postConstruct?: ICallback<T>;
  preDestroy?: ICallback<T>;
}

class Bean<T> implements IBean<T> {
  readonly name: string;
  readonly factory: (...deps: any[]) => T;
  readonly scope: ScopeValue;
  readonly deps: string[];
  readonly aliases: string[];
  readonly eager: boolean;
  readonly async: boolean;
  readonly postConstructor: ICallback<T>;
  readonly preDestroy: ICallback<T>;

  constructor({
    name,
    factory,
    scope,
    deps,
    aliases,
    eager,
    postConstruct,
    preDestroy,
    async,
  }: BeanProps<T>) {
    this.name = name;
    this.factory = factory;
    this.deps = deps ?? [];
    this.aliases = aliases ?? [];
    this.eager = eager ?? false;
    this.async = async ?? false;
    this.postConstructor = postConstruct ?? (() => { });
    this.preDestroy = preDestroy ?? (() => { });

    if (!this.name) throw new CoreError('Bean must have a name');
    if (!this.factory) throw new CoreError('Bean must have a factory');

    if (Types.isNumber(scope)) this.scope = scope;
    if (Types.isString(scope)) this.scope = Scoped[scope] ?? Scoped.SINGLETON;
    if (Types.isUndefined(scope)) this.scope = Scoped.SINGLETON;

    if (!this.aliases.includes(this.name)) this.aliases.push(this.name);
    if (!this.aliases.includes(this.name)) this.aliases.push(this.name);
    Object.freeze(this);
  }

  isSingleton() {
    return this.scope === Scoped.SINGLETON;
  }
  isTransient() {
    return this.scope === Scoped.TRANSIENT;
  }
  isScoped() {
    return this.scope === Scoped.SCOPED;
  }
}

class BeanBuilder {
  #name;
  #factory;
  #scope;
  #deps;
  #aliases;
  #eager;
  #postConstruct;
  #preDestroy;
  #async;

  constructor() {
    this.#name = '';
    this.#factory = () => {
      throw new CoreError('No factory provided for bean');
    };
    this.#scope = 'singleton';
    this.#deps = [];
    this.#aliases = [];
    this.#eager = false;
    this.#async = false;
    this.#postConstruct = [];
    this.#preDestroy = [];
  }

  name(value) {
    this.#name = value;
    return this;
  }
  eager() {
    this.#eager = true;
    return this;
  }
  async() {
    this.#async = true;
    return this;
  }

  singleton() {
    this.#scope = Scoped.SINGLETON;
    return this;
  }
  transient() {
    this.#scope = Scoped.TRANSIENT;
    return this;
  }
  scoped() {
    this.#scope = Scoped.SCOPED;
    return this;
  }

  dependsOn(...deps) {
    this.#deps.push(...deps);
    return this;
  }
  alias(...aliases) {
    this.#aliases.push(...aliases);
    return this;
  }

  class(Class) {
    this.#factory = deps => new Class(...deps);
    return this;
  }
  factory(factory) {
    this.#factory = factory;
    return this;
  }

  postConstruct(...methods) {
    this.#postConstruct.push(...methods);
    return this;
  }
  preDestroy(...methods) {
    this.#preDestroy.push(...methods);
    return this;
  }

  [BuildSymbol]() {
    return new Bean({
      name: this.#name,
      factory: this.#factory,
      scope: this.#scope,
      deps: this.#deps,
      aliases: this.#aliases,
      eager: this.#eager,
      postConstruct: this.#postConstruct,
      preDestroy: this.#preDestroy,
      async: this.#async,
    });
  }
}
