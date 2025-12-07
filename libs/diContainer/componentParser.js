import { StringCase } from '#lib/utils';
import { Component } from './component.js';
import { DiScope } from './diScope.js';

class ComponentParserError extends Error {}

class ComponentParser {
  parse(source) {
    const srcType = typeof source;

    const parserName = StringCase.factoryCamelCase('parser', srcType);
    const parser = this[parserName];

    if (!parser) throw new ComponentParserError(`No parser found for source type: ${srcType}`);

    return parser?.call(this, source);
  }

  parserFunction(source) {
    const constructor = source;
    const dependencies = source.dependencies ?? source.inject;
    const postConstructor = source.postConstructor;
    const scope = source.scope;

    return this.parserObject({
      constructor,
      dependencies,
      postConstructor,
      scope,
    });
  }

  parserObject(source) {
    const scopeName = source.scope?.toUpperCase();

    return new Component(source.constructor, {
      dependencies: source.dependencies ?? source.inject,
      postConstructor: source.postConstructor,
      scope: DiScope[scopeName],
    });
  }
}

export { ComponentParser, ComponentParserError };
