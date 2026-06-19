import { parserAccess } from '../security/index.js';
import { Types } from '../utils/index.js';

const ValueSymbol = Symbol('value');

const RouteArgs = {
    "1": (routeBuilder, args) => routeBuilder.path(args[0]),
    "2": (routeBuilder, args) => routeBuilder.path(args[0]).get(args[1]),
    "3": (routeBuilder, args) => {
        routeBuilder.path(args[0]);
        const method = args[1].toLowerCase();
        if (!['get', 'post', 'put', 'delete'].includes(method)) throw new Error(`Unsupported HTTP method: ${args[1]}`);
        routeBuilder[method](args[2]);
    }
}


function routingDSL(def, app) {
    const rootBuilder = new RouteBuilder('/index');
    
    def(rootBuilder);

    app.router.set(rootBuilder[ValueSymbol]());
    
}


class RouteBuilder {
    #children;
    #path;
    #handlers;
    #accessChecker;
    
    constructor(pathName = '/', accessChecker = null) {
        this.#path = pathName;
        this.#handlers = {};
        this.#children = new Set();
        this.#accessChecker = accessChecker ?? parserAccess('public');
    }

    route(pathName, def) {
        const builder = new RouteBuilder(pathName, this);
        def(builder);
        this.#children.add(builder);
        return builder;
    }

    get() { return this.#handler('GET', arguments); }
    post() { return this.#handler('POST', arguments); }
    put() { return this.#handler('PUT', arguments); }
    delete() { return this.#handler('DELETE', arguments); }

    #handler(method, args) {
        if (args.length === 1) {
            this.#handlers[method] = args[0];
            return this;
        }
        
        this.#handlers[method.toUpperCase()] = fn;
        return new RouteBuilder(this.#path, this.#accessChecker);
    }
    
    #setAccessChecker(accessChecker) {
        this.#accessChecker = accessChecker;
        return this;
    }
    
    authorize(role) { return this.#setAccessChecker(parserAccess(`role: ${role}`)); }
    permitAll() { return this.#setAccessChecker(parserAccess('private')); }
    denyAll() { return this.#setAccessChecker(parserAccess('public')); }
    authenticated() { return this.#setAccessChecker(parserAccess('authenticated')); }
    anonymous() { return this.#setAccessChecker(parserAccess('anonymous')); }
    hasRole(...roles) { return this.#setAccessChecker(parserAccess(`role: ${roles.join(', ')}`)); }
    hasPermissions(...permissions) { return this.#setAccessChecker(parserAccess(`permission: ${permissions.join(', ')}`)); }
    

    [ValueSymbol]() {
        let handlers = new Set();

        const addHandler = (method, fn) => handlers.add({ 
            httpMethod: method, 
            handler: fn, mapping: 
            this.#path 
        });

        if (this.#handlers.get) addHandler('GET', this.#handlers.get);
        if (this.#handlers.post) addHandler('POST', this.#handlers.post);
        if (this.#handlers.put) addHandler('PUT', this.#handlers.put);
        if (this.#handlers.delete) addHandler('DELETE', this.#handlers.delete);

        const subMapping = this.#path.replace("/index", "/");
        for (const child of this.#children) {
            const childHandlers = child[ValueSymbol]();
            for (const handler of childHandlers) handlers.add({...handler, mapping: `${subMapping}/${handler.mapping}` });
        }

        return handlers.values().toArray();
    }
}

export { routingDSL };

