import { ParserAbstract } from '#lib/utils';

class ParserModule extends ParserAbstract {
  parseObject(source) {
    return {
      name: source.name,
      component: [].concat(
        source.component,
        this.#extractProviders(source),
        this.#extractControllers(source),
        this.#extractRepositories(source)
      ),
      config: () => source.config,
    };
  }

  parseFunction(source) {
    return {
      ...this.parseObject(source),
      config: app => source(app),
    };
  }

  parseClass(source) {
    return {
      ...this.parseObject(source),
      config: app => new source(app),
    };
  }

  #extractProviders(source) {
    const providers = source.services ?? source.providers ?? [];
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

  #extractRepositories(source) {
    const repositories = source.repositories ?? [];
    return repositories.map(it => {
      it.type = 'repository';
      return it;
    });
  }
}

export { ParserModule };
