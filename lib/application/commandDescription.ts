export { CommandDescription };

interface CommandProps {
  logger: ILogger;
  packageManager: IPackageManager;
  config: IConfig;
  container: IContainer;
}

class CommandDescription implements ICommandDescription {
  #scopeId: string;
  #packageManager: IPackageManager;
  #config: IConfig;
  #container: IContainer;

  print: ApplicationPrint;

  constructor({ logger, packageManager, config, container }: CommandProps) {
    this.#scopeId = '';
    this.#packageManager = packageManager;
    this.#config = config;
    this.#container = container;

    this.print = {
      log: logger.log.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    };
  }

  getScope() {
    return this.#scopeId;
  }

  setScope(id: string) {
    this.#scopeId = id;
  }

  npm<T>(name: string): T | null {
    return this.#packageManager.get<T>(name);
  }

  node<T>(name: string): T | null {
    return this.npm<T>(name);
  }

  lib<T>(name: string): T | null {
    return this.npm<T>(name);
  }

  bean<T>(alias: string): Promise<T> {
    return this.#container.resolve<T>(alias);
  }

  config<T>(key: string, defaultValue?: T): T {
    return this.#config.getValue(key, defaultValue);
  }
}
