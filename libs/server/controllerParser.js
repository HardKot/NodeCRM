'use strict';

import { StringCase } from '../utils';
import { Handler } from './handler.js';

class ControllerParserError extends Error {}

class ControllerParser {
  #schemaParser = null;

  constructor(schemaParser) {
    if (schemaParser) this.#schemaParser = schemaParser;
  }
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
    const { body = {}, params = {} } = source.type ?? {};
    const bodySchema = this.#schemaParser.factorySchema(body);
    const urlParams = this.parseMappingParams(source.mapping);
    const paramsSchema = this.#schemaParser.factorySchema({ ...params, ...urlParams });

    const imports = source.imports ?? [];

    return [
      new Handler(source.handler, {
        mapping: source.mapping,
        dependencies: source.dependencies,
        method: source.method,
        guard: source.guard,
        bodySchema: bodySchema,
        paramsSchema: paramsSchema,
        defaultStatus: source.defaultStatus,
      }),
    ]
      .concat(imports.map(it => this.parse({ ...it, mapping: `${source.mapping}/${it.mapping}` })))
      .flat();
  }

  parserGroupObject(source) {
    const handlers = [];

    for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
      const callback = source[method];
      if (!callback) continue;

      handlers.push(
        this.parserMethodObject({
          handler: callback,
          mapping: source.mapping,
          dependencies: source.dependencies,
          method: source.method,
          guard: source.guard,
          imports: source.imports,
          types: {
            body: source.types?.body,
            params: source.types?.params,
          },
        })
      );
    }
    return handlers.flat().filter(handler => !!handler);
  }

  parseMappingParams(source) {
    const parts = source.split('/').filter(it => !!it);
    const mappingParams = {};

    for (let i = 0; i < parts.length; i++) {
      const match = parts[i].match(/<([\w\d]+)(:\w+)?>/);
      if (!match) continue;
      mappingParams[i] = {
        name: match[1],
        type: match[2]?.slice(1) ?? 'string',
      };

      parts[i] = `<${mappingParams[i].type}>`;
    }

    return mappingParams;
  }
}

export { ControllerParser, ControllerParserError };
