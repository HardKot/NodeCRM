import { ParserAbstract } from '../utils/parserAbstract.js';
import { Component } from './component.js';

class ParserModule extends ParserAbstract {
  parserObject(source) {
    return new Component({
      name: source.name,
      factory: source.factory,
      dependencies: source.dependencies,
      tags: source.tags,
      scope: source.scope,
    });
  }

  parserFunction(source) {
    return new Component({
      name: source.name,
      factory: deps => source.bind(deps),
      dependencies: source.dependencies,
      tags: source.tags,
      scope: source.scope,
    });
  }

  parserClass(source) {
    return new Component({
      name: source.name,
      factory: deps => new source(...Object.values(deps)),
      dependencies: source.dependencies,
      tags: source.tags,
      scope: source.scope,
    });
  }
}

export { ParserModule };
