const { ValueSymbol } = require('./symbols')

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
        this.#name = "";
        this.#factory = () => { throw new Error('No factory provided for bean'); };
        this.#scope = 'singleton';
        this.#deps = [];
        this.#aliases = [];
        this.#eager = false;
        this.#async = false;
        this.#postConstruct = [];
        this.#preDestroy = [];
    }

    name(value) { this.#name = value; return this; }
    eager() { this.#eager = true; return this; }
    async() { this.#async = true; return this; }

    singleton() { this.#scope = Scoped.SINGLETON; return this; }
    transient() { this.#scope = Scoped.TRANSIENT; return this; }
    scoped() { this.#scope = Scoped.SCOPED; return this; }

    dependsOn(...deps) { this.#deps.push(...deps); return this; }
    alias(...aliases) { this.#aliases.push(...aliases); return this; }

    class(Class) { this.#factory = (deps) => new Class(...deps); return this;}
    factory(factory) { this.#factory = factory; return this;}

    postConstruct(...methods) { this.#postConstruct.push(...methods); return this; }
    preDestroy(...methods) { this.#preDestroy.push(...methods); return this; }

    [ValueSymbol]() {
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

exports.BeanBuilder = BeanBuilder;