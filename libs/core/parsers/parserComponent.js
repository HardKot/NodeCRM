import { ParserAbstract } from '../../utils';

const SUPPORT_SCOPES = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

class ParserComponent extends ParserAbstract {
  parseObject(source) {
    return {
      name: source.name,
      factory: source.factory ?? (() => source),
      dependencies: source.inject ?? source.dependencies ?? [],
      type: source.type,
      scope: SUPPORT_SCOPES[source.scope?.toUpperCase()] ?? SUPPORT_SCOPES.SINGLETON,
      eager: source.eager ?? true,
    };
  }

  parseFunction(source) {
    return {
      ...this.parseObject(source),
      factory: deps => source.bind({ ...deps, module: source.module }),
    };
  }

  parseClass(source) {
    return {
      ...this.parseObject(source),
      factory: deps => new source(...Object.values(deps), source.module),
      name: source.name ?? source.prototype.constructor.name,
    };
  }
}

export { ParserComponent, SUPPORT_SCOPES };
