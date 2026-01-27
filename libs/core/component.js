const { ObjectUtils, Parser, Types } = require('../utils/types/objectUtils');
const { Metadata } = require('./metadata.js');

const SUPPORT_SCOPES = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

const componentParser = new Parser({
  parseObject: function (source, options) {
    let scope = ObjectUtils.firstNotNullValue('scope', source, options);
    if (Types.isString(scope)) scope = SUPPORT_SCOPES[scope.toUpperCase()];

    return new Component(
      ObjectUtils.firstNotNullValue('name', source, options),
      source.factory ?? (() => source),
      ObjectUtils.firstNotNullValue('inject', source, options),
      ObjectUtils.firstNotNullValue('type', source, options),
      scope,
      ObjectUtils.firstNotNullValue('eager', source, options),
      source.binding,
      Metadata.extractFrom(source)
    );
  },
  parseFunction: function (source, options) {
    let scope = ObjectUtils.firstNotNullValue('scope', source, options);
    if (Types.isString(scope)) scope = SUPPORT_SCOPES[scope.toUpperCase()];

    return new Component(
      ObjectUtils.firstNotNullValue('name', source, options),
      deps => source.bind({ ...deps, module: source.module }),
      ObjectUtils.firstNotNullValue('inject', source, options),
      ObjectUtils.firstNotNullValue('type', source, options),
      scope,
      ObjectUtils.firstNotNullValue('eager', source, options),
      source.binding,
      Metadata.extractFrom(source)
    );
  },
  parseClass: function (source, options) {
    let scope = ObjectUtils.firstNotNullValue('scope', source, options);
    if (Types.isString(scope)) scope = SUPPORT_SCOPES[scope.toUpperCase()];

    return new Component(
      ObjectUtils.firstNotNullValue('name', source, options),
      deps => new source(...Object.values(deps), source.module),
      ObjectUtils.firstNotNullValue('inject', source, options),
      ObjectUtils.firstNotNullValue('type', source, options),
      scope,
      ObjectUtils.firstNotNullValue('eager', source, options),
      source.binding,
      Metadata.extractFrom(source)
    );
  },
});

class Component {
  constructor(name, factory, inject, type, scope, eager, binding, meta) {
    this.name = name;
    this.factory = factory;
    this.inject = inject ?? [];
    this.type = type ?? 'component';
    this.scope = scope ?? SUPPORT_SCOPES.SINGLETON;
    this.eager = eager ?? false;
    this.binding = binding ?? this.name;
    this.meta = meta ?? {};
    if (!Array.isArray(this.binding)) this.binding = [this.binding];
    if (!this.binding.includes(this.name)) this.binding.push(this.name);

    Object.freeze(this);
  }

  static parse(source, options = {}) {
    return componentParser.parse(source, options);
  }
}

module.exports = { Component, SUPPORT_SCOPES, componentParser };
