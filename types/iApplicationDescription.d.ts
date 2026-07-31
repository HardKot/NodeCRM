declare interface ApplicationPrint {
  readonly log: ILogger['log'];
  readonly info: ILogger['info'];
  readonly warn: ILogger['warn'];
  readonly error: ILogger['error'];
}

declare interface ApplicationSubscription {
  prepare(callback: (app: IApplication) => void): void;
  run(callback: (app: IApplication) => void): void;
  stop(callback: (app: IApplication) => void): void;
  build(callback: (app: IApplication) => void): void;
  error(callback: (error: Error, app: IApplication) => void): void;
}

declare interface IApplicationDescription {
  bean: (callback: <T>(builder: IBeanBuilder<T>) => void) => void;
  package: (callback: <T>(builder: IPackageBuilder<T>) => void) => void;

  loadNodePackages: () => void;
  loadNpmPackages: () => void;
  loadLibPackages: () => void;

  plugin: (Class: new (app: IApplication) => ISpaceModule) => void;
  plugin: (factory: (app: IApplication) => ISpaceModule) => void;
  plugin: (obj: ISpaceModule) => void;

  getConfig: IConfig['getValue'];
  print: ApplicationPrint;
  on: ApplicationSubscription;
}
