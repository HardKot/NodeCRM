import * as http2 from 'node:http2';
import { ExecCommand } from '../application';
import type { ContentType, Routing } from './types';
import { HttpSecurity } from './httpSecurity';
declare class HandleRequest {
    private routing;
    private runCommand;
    readonly contentType: ContentType[];
    readonly bodyLimit: number;
    readonly security: HttpSecurity;
    private readonly primaryContentTyp;
    constructor(routing: Routing, runCommand: ExecCommand, contentType: ContentType[], bodyLimit: number, security: HttpSecurity);
    onRequest(request: http2.Http2ServerRequest, response: http2.Http2ServerResponse): unknown;
    onError(response: http2.Http2ServerResponse, error: Error | null): any;
    private getContent;
    private sendBufferContent;
    private sendStreamContent;
    private sendDataContent;
    private getPath;
    private getContentType;
    private extractRequestParams;
    private isSupportedContentType;
    private isBinaryType;
    private validateRequestParams;
}
export { HandleRequest };
