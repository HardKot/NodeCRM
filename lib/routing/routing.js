import * as config from '../common/config.js';
import * as cache from '../common/cache.js';

import { Module, MODULE_TYPES } from '../common/Module.js';
import { Flow } from '../flow.js';
import { HTTP_METHODS } from './httpMethods.js';
import { RouteHandler } from './RouteHandler.js';

const ROUTES_DIR = config.get('routing.dir', 'app/routes');
const CACHE_TTL = config.get('routing.cachedTtl', 60) * 1000; // in milliseconds

const ROUTE_TREE = await Flow.of(Module.readDir(ROUTES_DIR))
  .filter(it => it.type === MODULE_TYPES.SCRIPT)
  .map(it => it.import())
  .map(it => Object.values(it))
  .flat()
  .filter(it => typeof it === 'function' && it.mapping)
  .map(it => new RouteHandler(it))
  .reduce((routeTree, routeHandler) => {
    if (routeHandler.isDynamic) {
      return {
        ...routeTree,
        dynamic: [routeHandler].concat(routeTree.dynamic ?? []),
      };
    }
    return {
      ...routeTree,
      [routeHandler.mapping]: {
        ...(routeTree[routeHandler.mapping] ?? {}),
        [routeHandler.method]: routeHandler,
      },
    };
  }, {});

Object.freeze(ROUTE_TREE);

export function route(uri, method) {
  if (typeof method === 'string') {
    method = HTTP_METHODS[method.toUpperCase()];
  }

  const cacheKey = `route:${method.description},${uri}`;

  if (ROUTE_TREE[uri]) return ROUTE_TREE[uri][method] ?? null;

  let routeHandler = cache.get(cacheKey);
  if (routeHandler) return routeHandler;

  if (!ROUTE_TREE.dynamic) return null;

  for (const requestHandler of ROUTE_TREE.dynamic) {
    if (requestHandler.match(uri) && requestHandler.method === method) {
      cache.set(cacheKey, requestHandler, { timeout: CACHE_TTL });
      return requestHandler;
    }
  }

  return null;
}
