import * as Utils from './utils.js';
import { Scope } from './scope.js';

class RequestHandlerError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}

class Handler {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.mapping = options.mapping ?? '/';
    this.dependencies = options.dependencies ?? [];
    this.method = options.method?.toUpperCase() ?? 'GET';

    this.guard = options.guard ?? Handler.fullAccess;

    this.bodySchema = options.bodySchema;
    this.paramSchemas = options.paramSchemas;

    if (options.defaultStatus) {
      this.defaultStatus = options.defaultStatus;
    } else {
      this.defaultStatus = this.method === 'POST' ? 201 : 200;
    }
  }

  /**
   * @param {Request} request
   * @param {Response} response
   * @return {Promise<void>}
   */
  async run(request, response) {
    const user = Scope.current.user;
    const hasAccess = await this.guard(user);
    if (!hasAccess) throw new RequestHandlerError('Forbidden', 403);

    const body = await this.getBody(request);
    const params = this.getParams(request);

    const result = await this.callback({
      body,
      params,
      user,
    });
    response.data(result, request.contentType).status(this.defaultStatus).send();
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

  static fullAccess() {
    return true;
  }
}

export { Handler };
