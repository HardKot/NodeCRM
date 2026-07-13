import { RouteNode } from './routeNode.ts';

export { Routes };

interface RouteHandler {
  mapping: string;
  httpMethod: IHttpMethodValue;
  handler: Function;
}

class Routes {
  #handlers: Record<string, Record<string, Function>>;
  #rootNode: RouteNode;

  constructor() {
    this.#handlers = {};
    this.#rootNode = new RouteNode('');
  }

  add(...handlers: RouteHandler[]) {
    for (const handler of handlers) {
      this.#addHandlerNode(handler);
      if (/<[\w\d_\-]+>/g.test(handler.mapping)) {
        this.#rootNode.create(handler.mapping);
      }
    }
  }

  #addHandlerNode(routerHandler: RouteHandler) {
    const { mapping, httpMethod, handler } = routerHandler;
    if (!this.#handlers[mapping]) this.#handlers[`${mapping}`] = {};
    this.#handlers[mapping][httpMethod] = handler;
  }
}
