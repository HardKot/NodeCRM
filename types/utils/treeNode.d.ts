export declare class TreeNode<T = any> extends Set<TreeNode<T>> {
    value: T | null;
    parent: TreeNode<T> | null;
    constructor(value?: T | null, parent?: TreeNode<T> | null, children?: Iterable<TreeNode<T>>);
    get isRoot(): boolean;
    get isLeaf(): boolean;
    get depth(): number;
    get allNodes(): IterableIterator<TreeNode<T>>;
    get allValues(): (T | null)[];
    get children(): IterableIterator<TreeNode<T>>;
    add(node: TreeNode<T> | T): this;
    delete(node: TreeNode<T> | T): boolean;
    find(value: T | {
        (value: T): boolean;
    }): TreeNode<T> | null;
    private findNode;
    private findFn;
    hasCircle(): boolean;
}
