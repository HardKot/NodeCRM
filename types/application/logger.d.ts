import * as console from 'node:console';
declare class Logger extends console.Console {
    readonly prefix: string;
    private readonly stdout;
    private readonly stderr?;
    constructor(prefix: string, stdout: NodeJS.WritableStream, stderr?: NodeJS.WritableStream);
    log(...data: any[]): void;
    info(...data: any[]): void;
    warn(...data: any[]): void;
    error(...data: any[]): void;
    extend(prefix: string): Logger;
}
export { Logger };
