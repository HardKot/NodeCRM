import { TreeNode, Types } from '#utils';

export { RouteNode };

class RouteNode extends TreeNode {
  mapping: string;
  param: string | undefined;

  #regex: RegExp;

  constructor(mapping: string, parent: RouteNode | null = null, children: RouteNode[] = []) {
    super(parent, children);
    this.mapping = mapping;

    const match = mapping.match(/<(\w+):?(\w+)?>/);
    let paramType: string | undefined;
    if (match) {
      this.param = match[1];
      paramType = match[2] ?? 'string';
    }

    switch (paramType) {
      case 'string':
        this.#regex = /^[\w\d_\-.&]+$/;
        break;
      case 'int':
        this.#regex = /^[\d]+$/;
        break;
      case 'uuid':
        this.#regex = /^[\w\d-]+$/;
        break;
      default:
        this.#regex = new RegExp(`^${this.mapping}$`);
    }
  }

  create(template: string): RouteNode {
    const [firstSegment, ...restSegments] = template.split('/').filter(Boolean);
    const rest = restSegments.join('/');
    let child = this.children.filter((it) => Types.isInstanceOf(it, RouteNode)).find((c) => c.mapping === firstSegment);
    if (!child) child = new RouteNode(firstSegment, this);
    if (rest) return child.create(rest);
    return child;
  }

  find(path: string): RouteNode | null {
    const [firstSegment, ...restSegments] = path.split('/').filter(Boolean);
    const rest = restSegments.join('/');
    if (!this.#regex.test(firstSegment)) return null;

    const children = this.children.filter((c) => Types.isInstanceOf(c, RouteNode));
    for (const child of children) {
      const match = child.find(rest);
      if (match) return match;
    }
    return null;
  }
}
