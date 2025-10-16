export class ErrorHandler {
  constructor(handler, options = {}) {
    this.action = typeof handler === 'function' ? handler : handler.action;

    this.mapping = firstNonNull(options.mapping, handler.mappings, '/');
    this.errors = firstNonNull(options.errors, handler.errors, []);
    this.status = firstNonNull(options.status, handler.status, 500);

    this.parts = this.mapping.split('/').filter(Boolean);
    this.regex = new RegExp(
      `^/${this.parts.map(it => (it.startsWith(':') ? '[\\d\\w]+' : it)).join('/')}`
    );
    this.isApi = this.mapping.startsWith('/api/');

    Object.freeze(this);
  }

  matchByPathname(pathname) {
    return pathname.match(this.regex)?.[0].length ?? 0;
  }

  matchByError(error) {
    if (!this.errors.length) return true;
    return this.errors.some(err => error instanceof err);
  }

  async run({ req, res, error }) {
    const result = await this.action({ error });
    if (this.isApi) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(this.status);
      res.end(JSON.stringify(result));
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(this.status);
    res.end(result);
  }
}

export const DefaultErrorHandler = new ErrorHandler(
  function ({ error }) {
    const message = error?.message || 'Internal Server Error';
    return { message };
  },
  { mapping: '/', errors: [Error] }
);
