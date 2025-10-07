import path from 'path';

import * as config from './config.js';
import * as cache from './cache.js';

import { QModels } from './QModels.js';

const ROUTES_DIR = config.get('routing.dir', 'app/routes');
const CACHE_TTL = config.get('routing.cachedTtl', 60) * 1000; // in milliseconds

const ROUTE_TREE = {
  dynamic: [],
};

class RouteHandler {
  constructor(module) {
    this.module = module;

    this.parts = path.split(path.sep).filter(Boolean);
    this.params = this.parts.filter(it => it.startsWith(':')).map(it => it.slice(1));
    this.path = '/' + this.parts.map(it => (it.startsWith(':') ? `[\d\w]+` : it)).join('/');
    this.isDynamic = this.path.includes('[\d\w]+');

    Object.freeze(this);
  }

  match(uri) {
    const regex = new RegExp(`^${this.path}$`);
    return regex.test(uri);
  }

  extractParams(uri) {
    const uriParts = uri.split('/').filter(Boolean);
    const params = {};

    this.parts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = uriParts[index];
      }
    });

    return params;
  }
}

const modules = await QModels.readDir(ROUTES_DIR);

modules.forEach(module => {
  const routeHandler = new RouteHandler(module);

  if (routeHandler.isDynamic) {
    ROUTE_TREE.dynamic.push(module);
    return;
  }
  ROUTE_TREE[routeHandler.path] = module;
});

export function route(uri) {
  const cacheKey = `route:${uri}`;

  let routeHandler = ROUTE_TREE[uri];

  if (routeHandler) return routeHandler;
  routeHandler = cache.get(cacheKey);
  if (routeHandler) return routeHandler;

  for (const dynamicModule of ROUTE_TREE.dynamic) {
    if (dynamicModule.match(uri)) {
      cache.set(cacheKey, dynamicModule, { timeout: CACHE_TTL });
      return dynamicModule;
    }
  }

  return null;
}
