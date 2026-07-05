export { SpaceRequest };

class SpaceRequest {
  constructor(options) {
    this.id = options.id;
    this.body = options.body;
    this.query = options.query;
    this.headers = options.headers;
    this.params = options.params;
    this.ip = options.ip;
    this.url = options.url;
    this.method = options.method;
    this.protocol = options.protocol;

    Object.freeze(this);
  }
}
