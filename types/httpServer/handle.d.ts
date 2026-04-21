import * as http2 from 'node:http2';
import { CommandBody, CommandInfo, CommandReturns } from '../application';
import type { RESTMethod } from './types';
declare class Handle {
    readonly name: string;
    readonly mapping: string;
    readonly httpMethod: RESTMethod;
    readonly status: number;
    readonly bodySchema: CommandBody;
    readonly paramSchema: Record<string, any> | null;
    readonly returnsSchema: CommandReturns;
    static fromCommand(cmd: CommandInfo): Handle | null;
    private static isRestMethod;
    private static getMappingFromRelativePath;
    constructor(name: string, mapping: string, httpMethod: RESTMethod, status: number, bodySchema: CommandBody, paramSchema: Record<string, any> | null, returnsSchema: CommandReturns);
    getParams(req: http2.Http2ServerRequest): any;
    private getSearchStr;
    private getSearchParams;
    private getPathParams;
}
export { Handle };
