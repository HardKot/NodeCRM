import { RouterNode } from "./RouterNode.js";

class Router {
    #root;

    constructor() {
        this.#root = new RouterNode('/');
        this.notFoundHandler = null;
    }

    add(mapping, method, handler) {
        const normalizedMapping = this.normalizedMapping(mapping);
        const node = this.#root.findOrCreateChild(normalizedMapping);
        node.addHandler(method, handler);
    }

    build() {
        this.#root.build();
        Object.freeze(this);
    }

    route(mapping, method) {
        method = method.toUpperCase();
        const splitMapping = this.splitMapping(
            this.normalizedMapping(mapping)
        );

        const node = this.#root.route(splitMapping);
        const handler = node?.getHandler(method);
        
        return handler;
    }

    splitMapping(mapping) {
        return mapping.split('/').filter(it => !!it);
    }

    normalizedMapping(mapping) {
        mapping = mapping.replace(/\/+/g, "/");
        if (!mapping.startsWith("/")) mapping = "/" + mapping;
        if (mapping.endsWith('/')) mapping += "index";
        return mapping;
    }
}

export { Router };