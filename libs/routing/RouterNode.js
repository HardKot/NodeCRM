export class RouterNode {
    #hasParam;
    #regex;
    #children;
    #parent;


    constructor(mapping, parent) {
        this.mapping = mapping;
        this.#hasParam = mapping.includes('<') && mapping.includes('>');
        this.#regex = null;
        this.#children = new Map();
        this.#parent = parent ?? null;
    }

    isMatch(path) {
        return this.#regex.test(path);
    }

    addHandler(arg1, arg2) {
        let method = arg1, handler = arg2;
        if (!arg2) {
            handler = arg1;
            method = 'ANY';
        }

        if (this[method]) throw new Error(`Handler for method ${method} already exists on mapping ${this.mapping}`);
        this[method] = handler;
        return this;
    }

    getHandler(method) {
        if (!this[method]) {
            return this["ANY"] ?? null;
        }
        return this[method];
    }

    findOrCreateChild(mapping) {
        const [mappingPart, ...rest] = mapping.split('/').filter(Boolean);
        if (!mappingPart) return this;

        let node = this.#children.get(mappingPart);

        if (!node) {
            node = new RouterNode(mappingPart, this);
            this.#children.set(mappingPart, node);
        }

        return node.findOrCreateChild(rest.join('/'));
    }

    build() {
        if (Object.isFrozen(this)) return;
        this.generateMatchRegex();
        this.addHandler = () => { };

        for (const child of this.#children.values()) child.build();

        Object.freeze(this);
        Object.freeze(this.#children);
    }

    route(mapping) {
        if (!mapping.length) return this;

        const [current, ...rest] = mapping;
        if (current === 'index') return this;

        for (const child of this.#children.values()) {
            if (child.isMatch(current)) return child.route(rest);
        }

        return null;
    }

    generateMatchRegex() {
        const paramMap = {
            number: '\\d\+',
            string: '\.\+',
        };

        if (!this.#hasParam) {
            this.paramName = null;
            if (this.mapping === '*') {
                this.#regex = /^.+$/;
            } else {
                this.#regex = new RegExp(`^${this.mapping}$`);
            }
            return this;
        }

        if (this.mapping.startsWith('<') && this.mapping.endsWith('>')) {
            const param = this.mapping.slice(1, -1).split(':');
            this.paramName = param[0];
            const paramType = param[1] ?? 'string';
            const regex = paramMap[paramType] ?? '\[\^\/\]\+';
            this.#regex = new RegExp(`^${regex}$`);
            return this;
        }

        return new RegExp(`^${partsStr.slice(0, -1)}$`);
    }

    extractParams(mapping) {
        const current = mapping.at(-1);
        const rest = mapping.slice(0, -1);

        let value = [];
        if (this.#hasParam) value.push([this.paramName, current]);
        if (this.#parent) value = value.concat(this.extractParams(rest));

        return value;
    }
}
