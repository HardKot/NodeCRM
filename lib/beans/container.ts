import { Types } from "#utils";

export { Container };

class Container implements IContainer {
  #singletons: WeakMap<IBean, any>;
  #scoped: Map<string, WeakMap<IBean, any>>;
  #transients: WeakMap<IBean, Set<any>>;
  #app: IApplication;

  constructor(app: IApplication) {
    this.#singletons = new WeakMap();
    this.#scoped = new Map();
    this.#transients = new WeakMap();
    this.#app = app;
    Object.freeze(this);
  }

  async build() {
    const validate = this.#app.beanRegistry.validate();
    if (Types.isError(validate.value)) throw validate.value;

    const eagerDefs = this.#app.beanRegistry.getAllDefs().filter((it) => it.eager);

    for (const def of eagerDefs) await this.resolve(def.name);
  }

  async resolve(alias: string, { scopeId }: ResolveOptions = {}) {
    const bean = this.#app.beanRegistry.getDef(alias);
    if (!bean) throw new Error(`No bean found for alias: ${alias}`);
    if (bean.isSingleton()) return await this.#initSingleton(bean);
    if (bean.isTransient()) return await this.#initTransientComponent(bean);
    if (bean.isScoped() && scopeId) return await this.#initScopedComponent(bean, scopeId);

    return await this.#initComponent(bean);
  }

  async destroyAll() {
    const destroyScoped = [...this.#scoped
      .keys()]
      .map((it) => this.destroyScoped(it))
    const destroySingletons = this.#destroySingletons();
    const destroyTransients = this.#destroyTransients();

    await Promise.all([...destroyScoped, ...destroySingletons, ...destroyTransients]);
  }

  #destroySingletons() {
    return this.#app.beanRegistry
      .getAllDefs()
      .filter((it) => it.isSingleton())
      .map((it) => ({ bean: it, item: this.#singletons.get(it) }))
      .map((it) => it.bean.preDestroy(it.item));
  }

  #destroyTransients() {
    return this.#app.beanRegistry
      .getAllDefs()
      .filter((it) => it.isTransient())
      .flatMap(
        (bean) =>
          [...this.#transients
            .get(bean)
            ?.values() ?? []]
            .map((item) => ({ bean, item }))
      )
      .map((it) => it.bean.preDestroy(it.item));
  }

  async destroyScoped(scopeId: string) {
    const scoped = this.#scoped.get(scopeId);
    if (!scoped) return;

    await Promise.all(
      this.#app.beanRegistry
        .getAllDefs()
        .filter((it) => it.isTransient())
        .map((it) => ({ bean: it, item: scoped.get(it) }))
        .filter((it) => it.item)
        .map((it) => it.bean.preDestroy(it.item))
    );

    this.#scoped.delete(scopeId);
  }

  async #initSingleton<T>(bean: IBean<T>) {
    if (this.#singletons.has(bean)) {
      const instance = this.#initComponent(bean);
      this.#singletons.set(bean, instance);
      return instance;
    }
    return this.#singletons.get(bean);
  }
  async #initScopedComponent(bean: IBean, scopeId: string) {
    if (!this.#scoped.has(scopeId)) this.#scoped.set(scopeId, new WeakMap());
    const scopedMap = this.#scoped.get(scopeId)!;

    const instance = this.#initComponent(bean);
    scopedMap.set(bean, instance);
    return instance;
  }
  async #initTransientComponent(bean: IBean) {
    const transient = await this.#initComponent(bean);
    if (!this.#transients.has(bean)) this.#transients.set(bean, new Set());
    this.#transients.get(bean)!.add(transient);
    return transient;
  }
  async #initComponent(bean: IBean) {
    const deps = await Promise.all(bean.deps.map((dep) => this.resolve(dep)));
    const instance = bean.factory(...deps);
    await bean.postConstructor.call(instance, instance);

    return instance;
  }
}
