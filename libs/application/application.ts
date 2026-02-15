import * as cluster from 'node:cluster';
import { Instance, InstanceModule } from './instance';
import { dirname } from 'node:path';
import { Plugin } from './plugin';
import { Logger } from './logger';

interface ApplicationConfig {
  clusterCount?: number;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  plugins?: Plugin[];
  module: InstanceModule | Promise<InstanceModule>;
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
    public readonly module: InstanceModule,
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
    const instance = new Instance(this.module, this.logger, this.plugins);
    await instance.build();
  }
}

export { Application, ApplicationError, ApplicationConfig };
