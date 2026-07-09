import { ApplicationEvent, BuildSymbol } from '#constant';
import { Types } from '#utils';

import type { BaseSchema } from '#schema';
import { BeanBuilder } from '../container/beanBuilder.ts';
import { PackageBuilder } from '#packageManager';

export { ApplicationDescription };

interface ApplicationDescriptionProps {
  app: IApplication<BaseSchema>;
  logger: ILogger;
  eventEmitter: NodeJS.EventEmitter;
}

type PluginArgument =
  | { new(app: IApplication<BaseSchema>): ISpaceModule }
  | { (app: IApplication<BaseSchema>): ISpaceModule }
  | ISpaceModule;

class ApplicationDescription implements IApplicationDescription {
  readonly print: ApplicationPrint;
  readonly on: ApplicationSubscription;
  readonly bean: <T>(callback: (builder: IBeanBuilder<T>) => void) => void;
  readonly package: <T extends object>(callback: (builder: IPackageBuilder<T>) => void) => void;
  readonly loadNodePackages: () => void;
  readonly loadNpmPackages: () => void;
  readonly loadLibPackages: () => void;
  readonly plugin: (arg: PluginArgument) => void;
  readonly getConfig: <T>(path: string, defaultValue?: T) => T;

  constructor({ logger, eventEmitter, app }: ApplicationDescriptionProps) {
    this.print = {
      log: logger.log.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    };
    this.on = {
      prepare: (callback) => eventEmitter.on(ApplicationEvent.PREPARE, callback),
      run: (callback) => eventEmitter.on(ApplicationEvent.RUN, callback),
      error: (callback) => eventEmitter.on(ApplicationEvent.ERROR, callback),
      stop: (callback) => eventEmitter.on(ApplicationEvent.STOP, callback),
      build: (callback) => eventEmitter.on(ApplicationEvent.BUILD, callback),
    };

    this.bean = (callback) => {
      const beanBuilder = new BeanBuilder();
      callback(beanBuilder);
      const bean = beanBuilder[BuildSymbol]();
      app.container.add(bean);
    };

    this.package = (callback) => {
      const packageBuilder = new PackageBuilder();
      callback(packageBuilder);
      const packageDescription = packageBuilder[BuildSymbol]();
      app.packages.def(packageDescription);
    };
    this.loadNodePackages = app.packages.loadNodePackages.bind(app.packages);
    this.loadNpmPackages = app.packages.loadNpmPackages.bind(app.packages);
    this.loadLibPackages = app.packages.loadLibPackages.bind(app.packages);
    this.getConfig = app.config.getValue.bind(app.config);

    this.plugin = (arg: PluginArgument) => {
      if (Types.isClass(arg)) return app.injectPlugin(new arg(app));
      if (Types.isFunction(arg)) return app.injectPlugin(arg(app));
      if (Types.isObject(arg)) return app.injectPlugin(arg);
      throw new Error('Invalid plugin argument');
    };
  }

  isInDescription(key: string): key is keyof ApplicationDescription {
    return key in this;
  }

  lazyLoad(key: string): (...args: any[]) => void {
    return (...args) => {
      if (this.isInDescription(key) && Types.isFunction(this[key])) {
        return (this as any)[key](...args);
      }
      throw new Error(`Description "${key}" is not defined or is not a function`);
    };
  }
}
