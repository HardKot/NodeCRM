import { Types } from '../utils/index';

import { CoreError } from '../core/errors';

import { BuildSymbol } from './symbols';
import { IScoped, Scoped } from './enums';

import type { IBean, ICallback, ScopeValue } from './interfaces';

export { Bean, BeanBuilder };

interface BeanProps<T> {
  name: string;
  factory: (...deps: any[]) => T;
  scope?: IScoped;
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

  constructor({ name, factory, scope, deps, aliases, eager, postConstruct, preDestroy, async }: BeanProps<T>) {
    this.name = name;
    this.factory = factory;
    this.deps = deps ?? [];
    this.aliases = aliases ?? [];
    this.eager = eager ?? false;
    this.async = async ?? false;
    this.postConstructor = postConstruct ?? (() => {});
    this.preDestroy = preDestroy ?? (() => {});
    this.scope = Scoped.SINGLETON;

    if (!this.name) throw new CoreError('Bean must have a name');
    if (!this.factory) throw new CoreError('Bean must have a factory');

    if (Types.isNumber(scope)) this.scope = scope;
    if (Types.isString(scope)) this.scope = Scoped[scope];
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

class BeanBuilder<T> {
  #name: string;
  #factory: (...args: string[]) => T;
  #scope: ScopeValue;
  #deps: string[];
  #aliases: string[];
  #eager: boolean;
  #postConstruct: ICallback<T>;
  #preDestroy: ICallback<T>;
  #async: boolean;

  constructor() {
    this.#name = '';
    this.#factory = () => {
      throw new CoreError('No factory provided for bean');
    };
    this.#scope = Scoped.SINGLETON;
    this.#deps = [];
    this.#aliases = [];
    this.#eager = false;
    this.#async = false;
    this.#postConstruct = this.#defaultPostConstruct;
    this.#preDestroy = this.#defaultPreDestroy;
  }

  async #defaultPostConstruct() {}
  async #defaultPreDestroy() {}

  name(value: string) {
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

  dependsOn(...deps: string[]) {
    this.#deps.push(...deps);
    return this;
  }
  alias(...aliases: string[]) {
    this.#aliases.push(...aliases);
    return this;
  }

  class(Class: { new (...args: any[]): T }) {
    this.#factory = (deps) => new Class(...deps);
    return this;
  }
  factory(factory: () => T) {
    this.#factory = factory;
    return this;
  }

  postConstruct(method: ICallback<T>) {
    this.#postConstruct = method;
    return this;
  }
  preDestroy(method: ICallback<T>) {
    this.#preDestroy = method;
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
