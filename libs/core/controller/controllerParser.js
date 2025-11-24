'use strict';

import { StringCase } from '#lib/utils';
import { Types } from '#lib/utils';

class ControllerParserError extends Error {}

class ControllerParser {
  parse(source) {
    const srcType = typeof source;

    const parserName = StringCase.factoryCamelCase('parse', srcType);

    const parser = this[parserName];

    if (!parser) throw new ControllerParserError('No parser found for source type: ' + srcType);

    return parser?.call(this, source);
  }

  parseFunction(source, options = {}) {
    const {
      mapping,
      dependencies,
      validate,
      guard,
    } = options;

    return {
      method: source,
      mapping,
      validate,
      dependencies,
      guard
    };
  }

  parseObject(source) {
    const methods = this.#extractMethods(source);
    const subControllers = this.#extractSubController(source);

    const {
      mapping,
      body,
      params,
      dependencies,
      header,
      guard,
    } = source;


    let handlers = [];

    for (const it in methods) {
      const handler = mapping[it]?.bind(null);
      handlers.push(this.parseFunction(handler, {
        mapping: {
          path: mapping,
          method: it,
          header: header,
        },
        dependencies,
        validate: {
          body: body,
          params: params,
        },
        guard,
      }));
    }

    for (const subController of subControllers) {
      subController.mapping = `${mapping}/${subController.mapping ?? '/'}`.replace(/\/+/g, '/');
      handlers.concat([this.parse(subController)].flat());
    }

    return handlers;
  }

  #extractSubController(source) {
    let extensions = source.extensions || source.use ?? [];
    if (!Array.isArray(extensions)) extensions = [extensions];

    return extensions;
  }

  #extractMethods(source) {
    const methods = { all: source.method } ?? source.methods;

    if (source.get) methods.get = source.get;
    if (source.post) methods.post = source.post;
    if (source.put) methods.put = source.put;
    if (source.delete) methods.delete = source.delete;
    if (source.patch) methods.patch = source.patch;

    return methods;
  }
}

export { ControllerParser, ControllerParserError };
