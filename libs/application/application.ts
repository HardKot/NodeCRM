import * as cluster from 'node:cluster';
import { Instance, InstanceModule } from './instance';
import { dirname } from 'node:path';
import { Plugin } from './plugin';
import { Logger } from './logger';
import { Types } from '../utils';

type InjectModule = InstanceModule | Promise<InstanceModule> | (() => InstanceModule | Promise<InstanceModule>);

interface ApplicationConfig {
  clusterCount?: number;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  plugins?: Plugin[];
  module: InjectModule;
}

class ApplicationError extends Error {}

class Application {
  static async run(config: ApplicationConfig) {
    const application = new Application(
      await config.module,
      config.clusterCount ?? 0,
      config.plugins ?? [],
      config.stdout ?? process.stdout,
      config.stderr ?? process.stderr
    );
    return application.run();
  }

  public readonly prefix: string;
  public readonly logger: Logger;

  constructor(
    public readonly module: InjectModule,
    public readonly clusterCount: number,
    public readonly plugins: Plugin[],

    public readonly stdout: NodeJS.WritableStream,
    public readonly stderr: NodeJS.WritableStream
  ) {
    this.prefix = `Instance@${dirname(process.cwd())}`;
    if (cluster.isWorker) this.prefix = `Worker#${cluster.worker?.id}`;

    this.logger = new Logger(this.prefix, this.stdout, this.stderr);
  }

  async run() {
    if (this.clusterCount && cluster.isPrimary) return this.master();
    return this.worker();
  }

  async master() {
    if (!cluster.isPrimary) throw new ApplicationError('Not a master process');
    if (!this.clusterCount) throw new ApplicationError('Not a cluster count');
    const workers = new Array(this.clusterCount);

    for (let i = 0; i < this.clusterCount; i += 1) {
      workers[i] = cluster.fork();
    }
  }

  async worker() {
    let module: InstanceModule;
    if (Types.isFunction(this.module)) {
      module = await this.module();
    } else {
      module = await this.module;
    }

    await Instance.create(module, this.logger, this.plugins);
  }
}

export { Application, ApplicationError, ApplicationConfig };
