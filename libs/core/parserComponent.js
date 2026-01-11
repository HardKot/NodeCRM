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
      eager: source.eager ?? false,
    };
  }

  parseFunction(source) {
    return this.parseObject({
      ...source,
      name: source.name,
      factory: deps => source.bind(deps),
    });
  }

  parseClass(source) {
    return this.parseObject({
      ...source,
      name: source.name,
      factory: deps => new source(...Object.values(deps)),
    });
  }
}

export { ParserComponent, SUPPORT_SCOPES };
