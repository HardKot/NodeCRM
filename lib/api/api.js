import { Flow } from '../common/flow.js';
import { ActionHandler } from './actionHandler.js';
import { DefaultErrorHandler, ErrorHandler } from './errorHandler.js';

export class Api {
  #actionRouteTree;
  #errorRouteTree;

  constructor(app) {
    this.app = app;

    this.#actionRouteTree = {};
    this.#errorRouteTree = [];
  }

  findActionHandler(pathname, method) {
    const handler = this.#actionRouteTree[pathname]?.[method];
    if (handler) return handler;

    const dynamicHandlers = this.#actionRouteTree.dynamic ?? [];
    for (const requestHandler of dynamicHandlers) {
      if (requestHandler.matchByPathname(pathname) && requestHandler.matchByMethod(method)) {
        return requestHandler;
      }
    }
    return null;
  }

  findErrorHandler(pathname, error) {
    return (
      this.#errorRouteTree
        .filter(it => it.matchByError(error))
        .sort((a, b) => b.matchByPathname(pathname) - a.matchByPathname(pathname))
        .at(0) ?? DefaultErrorHandler
    );
  }

  async load() {
    const apiModulesList = await Flow.of(this.app.modules)
      .filter(it => it.isScript() && it.path.startsWith('/app/api/'))
      .map(async it => ({ mapping: it.path.replace('/app/api', ''), module: await it.import() }))
      .map(it =>
        Object.entries(it.module).map(([method, action]) => ({
          mapping: it.mapping,
          action,
          method: method.toUpperCase(),
        }))
      )
      .flat();

    this.#actionRouteTree = await apiModulesList
      .copy()
      .filter(it =>
        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(it.method)
      )
      .map(it => new ActionHandler(it))
      .reduce((buildRouteTree, handler) => {
        if (hander.isDynamic) {
          return Object.assign(buildRouteTree, {
            dynamic: [handler].concat(handler.dynamic),
          });
        }
        return Object.assign(buildRouteTree, {
          [handler.mapping]: Object.assign(
            {
              [handler.method]: handler,
            },
            buildRouteTree[handler.mapping]
          ),
        });
      }, {})
      .get();

    this.#errorRouteTree = await apiModulesList
      .copy()
      .filter(it => 'ERROR' === it.method)
      .map(it => new ErrorHandler(it))
      .get();
  }
}
