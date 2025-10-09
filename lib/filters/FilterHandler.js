export class FilterHandler {
  constructor(filter, config = {}) {
    this.filter = filter;

    this.name = config.name || filter.name || 'anonymous';
    this.paterns = config.patterns || filter.patterns || ['*'];

    this.index = config.index || filter.index || Number.MAX_SAFE_INTEGER;

    Object.freeze(this);
  }

  match(req) {
    if (this.paterns.length === 0) return true;

    return this.paterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(req.url);
      } else if (typeof pattern === 'string') {
        return req.url.includes(pattern);
      }
      return false;
    });
  }

  async apply(req, res, next) {
    if (!this.match(req)) return next(req, res);

    return this.filter.apply(this, req, res, next);
  }
}
