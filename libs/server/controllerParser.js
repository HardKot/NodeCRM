'use strict';

import { StringCase } from '#lib/utils';
import { Handler } from './handler.js';

class ControllerParserError extends Error {}

class ControllerParser {
  parse(source) {
    const srcType = typeof source;

    const parserName = StringCase.factoryCamelCase('parse', srcType);

    const parser = this[parserName];

    if (!parser) throw new ControllerParserError('No parser found for source type: ' + srcType);

    return parser?.call(this, source);
  }

  parseObject(source) {
    const result = this.parserMethodObject(source);
    if (result.length > 0) return result;
    return this.parserGroupObject(source);
  }

  parserMethodObject(source) {
    if (!source.handler) return [];

    return [
      new Handler(source.handler, {
        mapping: source.mapping,
        dependencies: source.dependencies,
        method: source.method,
        guard: source.guard,
        bodySchema: source.types?.body,
        paramsSchema: source.types?.params,
        return: source.types?.return,
        defaultStatus: source.defaultStatus,
      }),
    ];
  }

  parserGroupObject(source) {
    const handlers = [];

    for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
      const callback = source[method];
      if (!callback) continue;

      handlers.push(
        new Handler(callback, {
          mapping: source.mapping,
          dependencies: source.dependencies,
          method: source.method,
          guard: source.guard,
          bodySchema: source.types?.body,
          paramsSchema: source.types?.params,
          return: source.types?.return,
        })
      );
    }

    return handlers;
  }

  parseMappingParams(source) {
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
