export class ActionHandler {
  constructor(handler, options = {}) {
    this.action = typeof handler === 'function' ? handler : handler.action;

    this.mapping = firstNonNull(options.mapping, handler.mappings);
    this.method = firstNonNull(options.method, handler.method, 'GET').toUpperCase();
    this.access = firstNonNull(options.access, handler.access);
    this.params = firstNonNull(options.params, handler.params, []);

    this.parts = options.mapping.split('/').filter(Boolean);
    this.isDynamic = options.mapping.includes(':');
    this.regex = new RegExp(
      `^/${this.parts.map(it => (it.startsWith(':') ? '[\\d\\w]+' : it)).join('/')}$`
    );

    Object.freeze(this);
  }

  matchByPathname(uri) {
    return this.regex.test(uri);
  }

  matchByMethod(method) {
    return this.method === method.toUpperCase();
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

  async run({ req, res }) {}
}
