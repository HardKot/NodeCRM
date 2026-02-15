import { HandleRequest } from './handleRequest';
import { Types } from '../utils';
import { RESTMethod } from './httpUtils';

interface DynamicNode {
  index: number;
  regex: RegExp | null;
  method: RESTMethod;
}
export type Routing = (path: string, method: RESTMethod) => HandleRequest | null;


class Routes {
  static initialize(): Routing {
    return () => null;
  }

  static byHandlers(handlers: HandleRequest[]): Routing {
    const routes = new Routes(handlers);
    return routes.route.bind(routes);
  }

  private mapping: Record<string, number> = {};
  private dynamicTree: DynamicNode[] = [];

  constructor(public readonly handlers: HandleRequest[]) {
    const staticEntries: [string, number][] = new Array(handlers.length);

    for (let index = 0; index < handlers.length; index++) {
      const { mapping, httpMethod } = handlers[index];
      const key = `${httpMethod}:${mapping}`;

      if (mapping.includes('<') && mapping.includes('>')) {
        this.dynamicTree.push(this.getDynamicNode(mapping, httpMethod, index));
      } else {
        staticEntries[index] = [key, index];
      }
    }

    this.mapping = Object.fromEntries(staticEntries.filter(it => it));
    Object.freeze(this.dynamicTree);
  }

  route(key: string, method: RESTMethod): HandleRequest | null {
    if (!key.startsWith('/')) key = '/' + key;
    if (key.endsWith('/')) key += 'index';
    const staticKey = `${method}:${key}`;
    const staticIndex = this.mapping[staticKey];
    if (!Types.isUndefined(staticIndex)) return this.handlers[staticIndex];

    return this.findDynamicNode(key, method);
  }

  private findDynamicNode(path: string, method: RESTMethod): HandleRequest | null {
    for (const node of this.dynamicTree) {
      if (node.method === method && node.regex?.test(path)) {
        return this.handlers[node.index];
      }
    }
    return null;
  }

  private getDynamicNode(mapping: string, method: RESTMethod, index: number): DynamicNode {
    let parts = mapping.split('/').filter(Boolean);
    let partsStr = `\/`;

    const paramMap: Record<string, string> = {
      number: '\\d\+',
      string: '\[\\w\\d\]\+',
    };

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];

      if (parts[i].startsWith('<') && parts[i].endsWith('>')) {
        const param = part.slice(1, -1).split(':');
        const paramType = param[1] ?? param[0] ?? 'string';
        const regex = paramMap[paramType] ?? '\[\^\/\]\+';
        partsStr += `${regex}\/`;
      } else {
        partsStr += `${part}\/`;
      }
    }

    return {
      regex: new RegExp(`^${partsStr.slice(0, -1)}$`),
      method,
      index,
    };
  }
}

export { Routes };
