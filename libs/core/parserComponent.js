import { ParserAbstract } from '#lib/utils';

const SUPPORT_SCOPES = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

class ParserComponent extends ParserAbstract {
  parseObject(source) {
    return {
      name: source.name,
      factory: source.factory,
      dependencies: source.inject ?? source.dependencies ?? [],
      type: source.type,
      scope: SUPPORT_SCOPES[source.scope?.toUpperCase()] ?? SUPPORT_SCOPES.SINGLETON,
      eager: source.eager ?? true,
    };
  }

  parseFunction(source) {
    return {
      ...this.parseObject(source),
      factory: deps => source.bind({ ...deps, config: source.config }),
    };
  }

  parseClass(source) {
    return {
      ...this.parseObject(source),
      factory: deps => new source(...Object.values(deps), source.config),
      name: source.name ?? source.prototype.constructor.name,
    };
  }
}

export { ParserComponent, SUPPORT_SCOPES };
