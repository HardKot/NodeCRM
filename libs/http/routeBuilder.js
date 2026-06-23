import { Types } from '#utils';
import { HTTP_METHOD } from './enums.js';

export { RouteBuilder };

class RouteBuilder {
  #registration;
  #baseMapping;

  constructor({ registration, baseMapping = '/' }) {
    this.#registration = registration;
    this.#baseMapping = baseMapping;
  }

  route(mapping, callback) {
    if (Types.isFunction(mapping) || Types.isObject(mapping) || Types.isClass(mapping)) {
      callback = mapping;
      mapping = '/';
    }

    const builder = new RouteBuilder({
      registration: this.#registration,
      baseMapping: `${this.#baseMapping}/${mapping}`,
    });

    callback({
      route: builder.route.bind(builder),
      get: builder.get.bind(builder),
      head: builder.head.bind(builder),
      post: builder.post.bind(builder),
      put: builder.put.bind(builder),
      delete: builder.delete.bind(builder),
      options: builder.options.bind(builder),
      patch: builder.patch.bind(builder),
    });
  }

  get(mapping, callback) {
    return this.#method(HTTP_METHOD.GET, mapping, callback);
  }
  head(mapping, callback) {
    return this.#method(HTTP_METHOD.HEAD, mapping, callback);
  }
  post(mapping, callback) {
    return this.#method(HTTP_METHOD.POST, mapping, callback);
  }

  put(mapping, callback) {
    return this.#method(HTTP_METHOD.PUT, mapping, callback);
  }

  delete(mapping, callback) {
    return this.#method(HTTP_METHOD.DELETE, mapping, callback);
  }
  options(mapping, callback) {
    return this.#method(HTTP_METHOD.OPTIONS, mapping, callback);
  }
  patch(mapping, callback) {
    return this.#method(HTTP_METHOD.PATCH, mapping, callback);
  }

  #method(method, mapping, callback) {
    if (Types.isFunction(mapping) || Types.isObject(mapping) || Types.isClass(mapping)) {
      callback = mapping;
      mapping = '/';
    }

    const options = this.#BaseOptions();
    options.method = method;
    if (Types.isString(options.method)) options.method = HTTP_METHOD[method.toUpperCase()];
    options.mapping = mapping;
    options.handler = callback;
    this.#registration(options);
  }

  #BaseOptions() {
    return {
      mapping: this.#baseMapping,
      method: HTTP_METHOD.GET,
      handler: void (() => { }),
    };
  }
}
