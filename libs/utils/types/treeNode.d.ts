export class TreeNode<T> extends Set<T | TreeNode<T>> {
  constructor(value?: T, parent?: TreeNode<T>, children?: TreeNode<T>[]);

  value: T | null;
  parent: TreeNode<T> | null;

  readonly isRoot: boolean;
  readonly isLeaf: boolean;
  readonly depth: number;
  readonly allNodes: SetIterator<TreeNode<T>>;
  readonly allValues: SetIterator<T>;
  readonly children: SetIterator<T>;

  add(node: T | TreeNode<T>): void;
  delete(node: T | TreeNode<T>): void;
  find(value: T): TreeNode<T> | null;
  hasCircle(): boolean;
}
