import * as Utils from './utils.js';

class RequestHandlerError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}

class RequestHandler {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.mapping = options.mapping ?? '/';
    this.dependencies = options.dependencies ?? [];
    this.method = options.method?.toUpperCase() ?? 'GET';

    this.guard = options.guard ?? RequestHandler.fullAccess;

    this.bodySchema = options.bodySchema;
    this.paramSchemas = options.paramSchemas;

    if (options.defaultStatus) {
      this.defaultStatus = options.defaultStatus;
    } else {
      this.defaultStatus = this.method === 'POST' ? 201 : 200;
    }

    this.matchingUrl = new RegExp(this.mapping.replaceAll(/<\w+>/, '\\w+'));
  }

  async run(request, response) {
    if (!this.isMethodImplemented(request)) throw new RequestHandlerError('Method not implemented');

    const hasAccess = await this.guard(request);
    if (!hasAccess) throw new RequestHandlerError('Forbidden', 403);

    const body = await this.getBody(request);
    const params = this.getParams(request);

    const result = await this.callback({
      body,
      params,
    });

    response.status(this.defaultStatus).contentType(request.contentType).send();
  }

  async getBody(request) {
    if (!this.bodySchema) return null;

    const data = await request.data();
    return this.bodySchema.from(data);
  }

  getParams(request) {
    if (!this.paramSchemas) return null;

    const urlParams = Utils.urlParamsParser(this.mapping, request.url);
    const queryParams = request.queryParams();

    return this.paramSchemas.from({ ...queryParams, ...urlParams });
  }

  isMethodImplemented(request) {
    return this.matchingUrl.test(request.url) && this.method === request.method.toUpperCase();
  }

  static fullAccess() {
    return true;
  }
}

export { RequestHandler };
