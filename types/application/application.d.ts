import { InstanceModule } from './instance';
import { Plugin } from './plugin';
import { Logger } from '../core/logger';
type InjectModule = InstanceModule | Promise<InstanceModule> | (() => InstanceModule | Promise<InstanceModule>);
interface ApplicationConfig {
    clusterCount?: number;
    stdout?: NodeJS.WriteStream;
    stderr?: NodeJS.WriteStream;
    plugins?: Plugin[];
    module: InjectModule;
}
declare class ApplicationError extends Error {
}
declare class Application {
    readonly module: InjectModule;
    readonly clusterCount: number;
    readonly plugins: Plugin[];
    readonly stdout: NodeJS.WritableStream;
    readonly stderr: NodeJS.WritableStream;
    static run(config: ApplicationConfig): unknown;
    readonly prefix: string;
    readonly logger: Logger;
    constructor(module: InjectModule, clusterCount: number, plugins: Plugin[], stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream);
    run(): unknown;
    master(): any;
    worker(): any;
}
export { Application, ApplicationError, ApplicationConfig };
