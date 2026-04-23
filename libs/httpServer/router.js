function normalizePath(path) {
    if (!path.startsWith('/'))
        path = '/' + path;
    if (path.endsWith('/'))
        path += 'index';
    return path;
}

function generateRegexFromMapping(mapping) {
    let parts = mapping.split('/').filter(Boolean);
    let partsStr = `\/`;
    const paramMap = {
        number: '\\d\+',
        string: '\.\+',
    };
    for (const part of parts) {
        if (part.startsWith('<') && part.endsWith('>')) {
            const param = part.slice(1, -1).split(':');
            const paramType = param[1] ?? 'string';
            const regex = paramMap[paramType] ?? '\[\^\/\]\+';
            partsStr += `${regex}\/`;
        }
        else {
            partsStr += `${part}\/`;
        }
    }
    return new RegExp(`^${partsStr.slice(0, -1)}$`);
}

class RouterNode {
    constructor(mapping, httpMethod, handler) {
        this.mapping = normalizePath(mapping);
        this.httpMethod = httpMethod;
        this.handler = handler;
        this.isDynamic = this.mapping.includes('<') && this.mapping.includes('>');
        this.regex = this.isDynamic ? generateRegexFromMapping(this.mapping) : null;
        
        Object.freeze(this);
    }

    is(mapping) {
        if (this.mapping === mapping) return true;
        if (this.regex?.test(mapping)) return true;
        return false;
    }

    extractParams(mapping) {
        if (!this.isDynamic || !this.regex) return Object.freeze({});
        const params = this.regex.exec(mapping);
        if (!params) return Object.freeze({});
        const paramNames = this.mapping
            .split('/')
            .filter(part => part.startsWith('<') && part.endsWith('>'))
            .map(part => part.slice(1, -1).split(':')[0]);
        const result = {};
        for (let i = 1; i < params.length; i++) {
            result[paramNames[i - 1]] = params[i];
        }
        return Object.freeze(result);
    }
}

class Router {
    #dynamicTree;
    #staticTree;
    #systemTree;
    constructor() {
        this.#dynamicTree = new Set();
        this.#staticTree = new Map();
        this.#systemTree = {};

        Object.freeze(this);
    }

    set(handlers) {
        if (!Array.isArray(handlers)) return this.set([handlers]);

        for (const handler of handlers) {
            const routerNode = new RouterNode(handler.mapping, handler.httpMethod, handler);
        
            if (routerNode.isDynamic) {
                this.#dynamicTree.add(routerNode);
            }
            else {
                const key = `${handler.httpMethod}:${handler.mapping}`;
                this.#staticTree.set(key, handler);
            }
        }
    }

    setError(handler) {
        this.#systemTree.error = handler;
    }

    setNotFound(handler) {
        this.#systemTree.notFound = handler;
    }

    clear() {
        this.dynamicTree.clear();
        this.staticTree.clear();
    }

    route(mapping, method) {
        mapping = normalizePath(mapping);

        const staticKey = `${method}:${mapping}`;
        if (this.#staticTree.has(staticKey)) return this.#staticTree.get(staticKey);
        
        for (const node of this.#dynamicTree) {
            if (node.httpMethod === method && node.is(mapping)) return node.handler;
        }

        return null;
    }

    error(args) {
        if (this.#systemTree.error) return this.#systemTree.error(args);
        const { response } = args;

        response.setStatusCode(500);
        response.json({ error: 'Internal Server Error' });
    }

    notFound(args) {
        if (this.#systemTree.notFound) return this.#systemTree.notFound(args);
        const { response } = args;
        
        response.setStatusCode(404);
        response.json({ error: 'Not Found' });
    }
}

exports.Router = Router;