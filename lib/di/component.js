export class Component {
  constructor(name, factory, options = {}) {
    this.name = name;
    this.factory = factory;
    this.singleton = options.singleton ?? true;
    this.dependencies = options.dependencies ?? [];

    Object.freeze(this);
  }
}
