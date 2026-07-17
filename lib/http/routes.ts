import { CoreError, HttpMethod } from '#constant';
import { RouteNode } from './routeNode.ts';

export { Routes };

type RouteHandler = {
  (command: IHttpHandlerDescription): Promise<void>;
  mapping: string;
  httpMethod: IHttpMethodValue;
};

class Routes {
  #handlerMap: Record<string, RouteHandler>;
  #rootNode: RouteNode;

  constructor() {
    this.#handlerMap = {};
    this.#rootNode = new RouteNode('');
  }

  find(mapping: string, httpMethod: IHttpMethodKey): RouteHandler | null {
    let key = this.#mapKey(mapping, httpMethod);
    if (this.#handlerMap[key]) return this.#handlerMap[key];
    const templateMapping = this.#rootNode.find(mapping)?.mapping ?? '';
    key = this.#mapKey(templateMapping, httpMethod);
    return this.#handlerMap[key] ?? null;
  }

  add(...handlers: RouteHandler[]) {
    for (const handler of handlers) {
      this.#addHandlerNode(handler);
      if (/<[\w\d_\-]+>/g.test(handler.mapping)) this.#rootNode.create(handler.mapping);
    }
  }

  #addHandlerNode(routerHandler: RouteHandler) {
    const mapping = HttpMethod(routerHandler.httpMethod);
    if (!mapping) throw new CoreError(`Invalid HTTP method: ${routerHandler.httpMethod}`);
    const key = this.#mapKey(routerHandler.mapping, mapping);
    if (this.#handlerMap[key])
      throw new CoreError(
        `Handler already exists for mapping: ${routerHandler.mapping} and method: ${routerHandler.httpMethod}`
      );
    this.#handlerMap[key] = routerHandler;
  }

  #mapKey(mapping: string, httpMethod: string) {
    return `${httpMethod}:${mapping}`;
  }
}
