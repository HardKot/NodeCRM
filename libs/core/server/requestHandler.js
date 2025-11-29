class RequestHandler {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.mapping = options.mapping ?? '/';
    this.dependencies = options.dependencies ?? [];
    this.method = options.method?.toUpperCase() ?? 'GET';

    this.guard = options.guard ?? RequestHandler.fullAccess;

    this.bodySchema = options.bodySchema;
    this.paramSchemas = options.paramSchemas;
    this.returnSchema = options.returnSchema;

    if (options.defaultStatus) {
      this.defaultStatus = options.defaultStatus;
    } else {
      this.defaultStatus = this.method === 'POST' ? 201 : 200;
    }
  }

  static fullAccess() {
    return true;
  }
}

export { RequestHandler };
