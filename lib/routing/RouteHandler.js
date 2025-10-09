import { HTTP_METHODS } from './httpMethods.js';

export class RouteHandler {
  constructor(fun) {
    this.fun = fun.bind(this);

    this.mapping = fun.mapping;
    this.parts = fun.mapping.split('/').filter(Boolean);

    if (typeof fun.method === 'string') {
      const httpKey = fun.method.toUpperCase();
      this.method = HTTP_METHODS[httpKey];
    } else if (typeof fun.method === 'symbol') {
      this.method = fun.method;
    } else {
      this.method = HTTP_METHODS.GET;
    }

    this.access = fun.access;
    this.params = this.parts.filter(it => it.startsWith(':')).map(it => it.slice(1));
    this.isDynamic = fun.mapping.includes(':');

    Object.freeze(this);
  }

  match(uri) {
    const path = this.parts
      .map(it => {
        if (it.startsWith(':')) {
          return '[\\d\\w]+';
        } else {
          return it;
        }
      })
      .join('/');
    const regex = new RegExp(`^/${path}$`);
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

  hasAccess(user) {
    if (!this.access) return true; // Public access

    if (!user) return false; // No user, no access

    // Simple permission check (exact match)
    if (typeof this.access === 'string') {
      return user.permissions.includes(this.access);
    }

    // Complex permission check (e.g., "has(perm1, perm2)")
    const hasMatch = this.access.match(/^has\(([^)]+)\)$/);
    if (hasMatch) {
      const requiredPerms = hasMatch[1].split(',').map(p => p.trim());
      return requiredPerms.some(perm => user.permissions.includes(perm));
    }

    return false; // Default deny
  }
}
