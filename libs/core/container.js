class Container {
    #singletons;
    #scoped;
    #transients;
    app;

    constructor(app) {
        this.#singletons = new WeakMap();
        this.#scoped = new Map();
        this.#transients = new Set();
        this.app = app;
        Object.freeze(this);
    }

    async resolve(alias, { scopeId } = {}) {
        const bean = this.app.beanRegistry.getDef(alias);
        if (!bean) throw new Error(`No bean found for alias: ${alias}`);
        if (bean.isSingleton()) return await this.#initSingleton(bean);
        if (bean.isTransient()) return await this.#initTransientComponent(bean);
        if (bean.isScoped()) return await this.#initScopedComponent(bean, scopeId);

        // инициализация scoped компонента
        return await this.#initComponent(bean);
    }

    async destroyAll() {
        for (const scopeId of this.#scoped.keys()) await this.destroyScoped(scopeId);
        for (const bean of this.#singletons.keys()) await this.#destroySingletons(bean);
        for (const instance of this.#transients) await this.#destroyTransients(instance);
    }

    async destroyScoped(scopeId) {
        const scoped = this.#scoped.get(scopeId);
        if (!scoped) return;

        const preDestroys = scoped.entries().flatMap(([bean, instance]) => bean.preDestroy.map(it => ([instance, it ])));
        for (const [instance, preDestroy] of preDestroys) await preDestroy.call(instance);
        
        this.#scoped.delete(scopeId);
    }

    async #initSingleton(bean) {
        if (this.#singletons.has(bean)) {
            const instance = this.#initComponent(bean);
            this.#singletons.set(bean, instance);
            return instance;
        }
        return this.#singletons.get(bean);
    }
    async #initScopedComponent(bean, scopeId) {
        if (!scopeId) throw new Error(`Scope ID is required for scoped bean: ${bean.name}`);
        if (!this.#scoped.has(scopeId)) this.#scoped.set(scopeId, new WeakMap());
        const scopedMap = this.#scoped.get(scopeId);

        const instance = this.#initComponent(bean);
        scopedMap.set(bean, instance);
        return instance;
    }
    async #initTransientComponent(bean) {
        const transient = await this.#initComponent(bean);
        this.#transients.add(transient);
        return transient;
    }
    async #initComponent(bean) {
        const deps = await Promise.all(bean.deps.map(dep => this.resolve(dep)));
        const instance = bean.factory(...deps);
        for (const postConstruct in bean.postConstruct) await postConstruct.call(instance);
        
        return instance;
    }
    async #destroySingletons(alias) {
        const bean = this.app.beanRegistry.getDef(alias);
        const instance = this.#singletons.get(bean);
        for (const preDestroy of bean.preDestroy) await preDestroy.call(instance);
    }
    async #destroyTransients(instance) {
        if (!this.#transients.has(instance)) return;
        for (const preDestroy of instance.constructor.preDestroy) await preDestroy.call(instance);
        this.#transients.delete(instance);
    }
}

export { Container }