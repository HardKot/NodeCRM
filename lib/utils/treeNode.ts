import { Types } from './types.ts';

export { TreeNode };
class TreeNode {
  #children: Set<TreeNode>;
  #parent: TreeNode | null;

  constructor(parent: TreeNode | null = null, children: TreeNode[] = []) {
    this.#parent = parent;
    this.#children = new Set(children);
    if (Types.notNull(parent)) parent.add(this);
  }
  get isRoot() {
    return this.#parent === null;
  }
  get isLeaf() {
    return this.#children.size === 0;
  }
  get depth() {
    let depth = 0;
    let current: TreeNode = this;
    while (current.#parent) {
      depth += 1;
      current = current.#parent;
    }
    return depth;
  }
  get allNodes() {
    const nodes = new Set<TreeNode>();
    for (const child of this.#children.values()) {
      nodes.add(child);
      for (const grandChild of child.allNodes) {
        nodes.add(grandChild);
      }
    }
    return nodes.values().toArray();
  }
  get children() {
    return this.#children.values();
  }
  add(node: TreeNode) {
    node.#parent = this;
    this.#children.add(node);
    return this;
  }
  delete(node: TreeNode) {
    if (!this.#children.has(node)) return false;
    node.#parent = null;
    return this.#children.delete(node);
  }
}
