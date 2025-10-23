import { CrmModule, CrmModuleError } from './crmModule';

class CrmDynamicModule extends CrmModule {
  constructor(module, options = {}) {
    super(module, options);
  }

  async load() {
    if (!this.isExists()) throw new CrmModuleError(`File ${this.path} doesn't exist`);
    this.exports = await import(this.path);

    return this;
  }
}

export { CrmDynamicModule };
