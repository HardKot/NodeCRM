import { Types } from './types';

export class TreeNode<T = any> extends Set<TreeNode<T>> {
  public value: T | null;
  public parent: TreeNode<T> | null;

  constructor(
    value: T | null = null,
    parent: TreeNode<T> | null = null,
    children?: Iterable<TreeNode<T>>
  ) {
    super(children);
    this.value = value;
    this.parent = parent;
    if (parent instanceof TreeNode) {
      parent.add(this);
    }
  }

  get isRoot(): boolean {
    return this.parent === null;
  }

  get isLeaf(): boolean {
    return this.size === 0;
  }

  get depth(): number {
    let depth = 0;
    let current: TreeNode<T> | null = this;
    while (current.parent) {
      depth += 1;
      current = current.parent;
    }
    return depth;
  }

  get allNodes(): IterableIterator<TreeNode<T>> {
    const nodes = new Set<TreeNode<T>>();
    for (const child of this.values()) {
      nodes.add(child);
      for (const grandChild of child.allNodes) {
        nodes.add(grandChild);
      }
    }
    return nodes.values();
  }

  get allValues(): (T | null)[] {
    return Array.from(this.allNodes).map(node => node.value);
  }

  get children(): IterableIterator<TreeNode<T>> {
    return this.values();
  }

  add(node: TreeNode<T> | T): this {
    if (!(node instanceof TreeNode)) node = new TreeNode(node);
    node.parent = this;
    super.add(node);
    return this;
  }

  delete(node: TreeNode<T> | T): boolean {
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

  find(value: T | {(value: T): boolean }): TreeNode<T> | null {
   if (Types.isFunction(value)) return this.findFn(value);
   return this.findNode(value);
  }

  private findNode(value: T): TreeNode<T> | null {
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

  private findFn(fn: {(value: T): boolean }): TreeNode<T> | null {
    if (fn(this.value as T)) return this;
    for (const child of this.children) {
      const result = child.findFn(fn);
      if (result) return result;
    }
    return null;
  }

  hasCircle(): boolean {
    const visited = new Set<TreeNode<T>>();
    let current: TreeNode<T> | null = this;
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
