import { CoreError } from './coreError.js';
import { Scoped } from './enums.js';
import { Types } from '../utils/index.js';

class Bean {
    constructor ({
        name,
        factory,
        scope,
        deps,
        aliases,
        eager,
        postConstruct,
        preDestroy,
        async,
    }) {
        this.name = name;
        this.factory = factory;
        this.scope = scope;
        this.deps = deps ?? [];
        this.aliases = aliases ?? [];
        this.eager = eager ?? false;
        this.async = async ?? false;
        this.postConstruct = postConstruct ?? [];
        this.preDestroy = preDestroy ?? [];

        if (!this.name) throw new CoreError('Bean must have a name');
        if (!this.factory) throw new CoreError('Bean must have a factory');

        if (Types.isString(this.scope)) this.scope = Scoped[this.scope.toUpperCase()] ?? Scoped.SINGLETON;
        if (Types.isUndefined(this.scope)) this.scope = Scoped.SINGLETON;
    
        if (!this.aliases.includes(this.name)) this.aliases.push(this.name);
        if (!!this.postConstruct && !Array.isArray(this.postConstruct)) this.postConstruct = [this.postConstruct];
        if (!!this.preDestroy && !Array.isArray(this.preDestroy)) this.preDestroy = [this.preDestroy];

        Object.freeze(this);
    }

    isSingleton() { return this.scope === Scoped.SINGLETON; }
    isTransient() { return this.scope === Scoped.TRANSIENT; }
    isScoped() { return this.scope === Scoped.SCOPED; }
}


export { Bean };