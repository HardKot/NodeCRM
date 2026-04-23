const { Types } = require('./types');
class TreeNode extends Set {
    value;
    parent;
    constructor(value = null, parent = null, children) {
        super(children);
        this.value = value;
        this.parent = parent;
        if (parent instanceof TreeNode) {
            parent.add(this);
        }
    }
    get isRoot() {
        return this.parent === null;
    }
    get isLeaf() {
        return this.size === 0;
    }
    get depth() {
        let depth = 0;
        let current = this;
        while (current.parent) {
            depth += 1;
            current = current.parent;
        }
        return depth;
    }
    get allNodes() {
        const nodes = new Set();
        for (const child of this.values()) {
            nodes.add(child);
            for (const grandChild of child.allNodes) {
                nodes.add(grandChild);
            }
        }
        return nodes.values();
    }
    get allValues() {
        return Array.from(this.allNodes).map(node => node.value);
    }
    get children() {
        return this.values();
    }
    add(node) {
        if (!(node instanceof TreeNode))
            node = new TreeNode(node);
        node.parent = this;
        super.add(node);
        return this;
    }
    delete(node) {
        if (node instanceof TreeNode) {
            if (!this.has(node)) {
                return false;
            }
            node.parent = null;
            return super.delete(node);
        }
        for (const child of this.values()) {
            if (child.value === node) {
                child.parent = null;
                return super.delete(child);
            }
        }
        return false;
    }
    find(value) {
        if (Types.isFunction(value))
            return this.findFn(value);
        return this.findNode(value);
    }
    findNode(value) {
        if (this.value === value) {
            return this;
        }
        for (const child of this.children) {
            const result = child.find(value);
            if (result) {
                return result;
            }
        }
        return null;
    }
    findFn(fn) {
        if (fn(this.value))
            return this;
        for (const child of this.children) {
            const result = child.findFn(fn);
            if (result)
                return result;
        }
        return null;
    }
    hasCircle() {
        const visited = new Set();
        let current = this;
        while (current) {
            if (visited.has(current)) {
                return true;
            }
            visited.add(current);
            current = current.parent;
        }
        return false;
    }
}

exports.TreeNode = TreeNode;