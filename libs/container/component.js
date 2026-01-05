class Component {
  constructor(cfg) {
    this.name = cfg.name;
    this.factory = cfg.factory;
    this.dependencies = cfg.dependencies;
    this.tags = cfg.tags;
    this.scope = cfg.scope;
  }
}

export { Component };
