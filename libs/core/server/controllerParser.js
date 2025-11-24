'use strict';

import { StringCase } from '#lib/utils';

class ControllerParserError extends Error {}

class ControllerParser {
  parse(source) {
    const srcType = typeof source;

    const parserName = StringCase.factoryCamelCase('parse', srcType);

    const parser = this[parserName];

    if (!parser) throw new ControllerParserError('No parser found for source type: ' + srcType);

    return parser?.call(this, source);
  }

  defaultGuard() {
    return true;
  }

  parseObject(source) {
    const methods = this.#extractMethods(source);
    const subControllers = this.#extractSubController(source);

    const { mapping, body, params, dependencies, guard } = source;

    let handlers = [];

    for (const it in methods) {
      if (!methods[it]) continue;
      const handler = this.#createHandler(methods[it], {
        mapping,
        method: it,
        dependencies,
        body,
        params,
        guard,
      });
      handlers.push(handler);
    }

    for (const subController of subControllers) {
      handlers = handlers.concat(
        [
          this.parse({ ...subController, mapping: `${mapping}/${subController.mapping ?? '/'}` }),
        ].flat()
      );
    }

    return handlers;
  }

  #createHandler(source, options = {}) {
    let mapping = {
      path: options.mapping || '/',
      method: options.method ?? 'get',
    };

    let params = options.params ?? {};

    const mappingParams = this.#parseMappingParams(mapping.path);
    mapping.path = mappingParams.mapping;
    params = { ...params, path: mappingParams.params, body: options.body };

    return {
      method: source,
      params: params,
      mapping: mapping,
      dependencies: options.dependencies ?? [],
      guard: options.guard ?? this.defaultGuard,
      return: options.return,
    };
  }

  #extractSubController(source) {
    let extensions = source.extensions ?? source.use ?? [];
    if (!Array.isArray(extensions)) extensions = [extensions];

    return extensions;
  }

  #extractMethods(source) {
    if (source.method) {
      const httpMethod = source.httpMethod || 'get';
      return { [httpMethod]: source.method };
    }
    const methods = {};

    if (source.get) methods.get = source.get;
    if (source.post) methods.post = source.post;
    if (source.put) methods.put = source.put;
    if (source.delete) methods.delete = source.delete;
    if (source.patch) methods.patch = source.patch;

    return methods;
  }

  #parseMappingParams(source) {
    const parts = source.split('/').filter(it => !!it);
    const mappingParams = {};

    for (let i = 0; i < parts.length; i++) {
      const match = parts[i].match(/<([\w\d]+)(:\w+)?>/);
      if (!match) continue;
      mappingParams[i] = {
        name: match[1],
        type: match[2] ? match[2].slice(1) : 'string',
      };

      parts[i] = `<${mappingParams[i].type}>`;
    }

    return { mapping: '/' + parts.join('/'), params: mappingParams };
  }
}

export { ControllerParser, ControllerParserError };
