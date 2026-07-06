import { BeanError, Scoped } from '#constant';

export { Bean };

class Bean<T> implements IBean<T> {
  readonly name: string;
  readonly factory: (...deps: any[]) => T;
  readonly scope: IScopeValue;
  readonly deps: string[];
  readonly aliases: string[];
  readonly eager: boolean;
  readonly async: boolean;
  readonly postConstructor: IBeanCallback<T>;
  readonly preDestroy: IBeanCallback<T>;

  constructor({ name, factory, scope, deps, aliases, eager, postConstruct, preDestroy, async }: BeanProps<T>) {
    this.name = name;
    this.factory = factory;
    this.deps = deps ?? [];
    this.aliases = aliases ?? [];
    this.eager = eager ?? false;
    this.async = async ?? false;
    this.postConstructor = postConstruct ?? (() => Promise.resolve());
    this.preDestroy = preDestroy ?? (() => Promise.resolve());
    this.scope = scope ?? Scoped.SCOPED;

    if (!this.name) throw new BeanError('Bean must have a name');
    if (!this.factory) throw new BeanError('Bean must have a factory');

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

