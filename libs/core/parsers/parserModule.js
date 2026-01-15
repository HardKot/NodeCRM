import { ParserAbstract } from '../../utils';

class ParserModule extends ParserAbstract {
  parseObject(source) {
    return {
      name: source.name,
      providers: this.#extractProviders(source),
      controllers: this.#extractControllers(source),
      imports: source.imports ?? {},
      factory: source.factory ?? (() => source),
    };
  }

  parseFunction(source) {
    return {
      ...this.parseObject(source),
      factory: app => source(app),
    };
  }

  parseClass(source) {
    return {
      ...this.parseObject(source),
      factory: app => new source(app),
    };
  }

  #extractProviders(source) {
    const providers = source.providers ?? [];
    return providers.map(it => {
      it.type = 'provider';
      return it;
    });
  }

  #extractControllers(source) {
    const controllers = source.controllers ?? [];
    return controllers.map(it => {
      it.type = 'controller';
      return it;
    });
  }
}

export { ParserModule };
