import { SchemaRegistry } from '../schema';
class Module {
    name;
    _components;
    hooks;
    imports;
    schemaRegistry;
    constructor(name, _components = [], hooks = {}, imports = [], schemaRegistry = new SchemaRegistry()) {
        this.name = name;
        this._components = _components;
        this.hooks = hooks;
        this.imports = imports;
        this.schemaRegistry = schemaRegistry;
        Object.freeze(this);
    }
    get components() {
        return this._components.concat(this.imports.map(it => it.components).flat());
    }
    linkComponent(component) {
        if (this._components.includes(component))
            return;
        this._components.push(component);
        component.module = this;
    }
    linkModule(module) {
        if (module === this)
            return;
        if (this.imports.includes(module))
            return;
        this.imports.push(module);
    }
    includeModule(module) {
        if (module === this)
            return true;
        if (module instanceof RootModule)
            return true;
        if (this.imports.includes(module))
            return true;
        return this.imports.some(it => it.includeModule(module));
    }
}
class RootModule extends Module {
    constructor() {
        super(RootModule.name, []);
    }
    includeModule() {
        return true;
    }
    clear() {
        this._components.length = 0;
    }
    static Instance = new RootModule();
}
export { Module, RootModule };
