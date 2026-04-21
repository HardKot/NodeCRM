import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
import { Result, Types } from '../utils';
import { HttpServerError } from './httpServerError';
import { ParserContent } from './parserContent';
import { HttpUtils } from './httpUtils';
const ApplicationOctetStream = 'application/octet-stream';
class HandleRequest {
    routing;
    runCommand;
    contentType;
    bodyLimit;
    security;
    primaryContentTyp;
    constructor(routing, runCommand, contentType, bodyLimit, security) {
        this.routing = routing;
        this.runCommand = runCommand;
        this.contentType = contentType;
        this.bodyLimit = bodyLimit;
        this.security = security;
        this.primaryContentTyp = contentType[0] ?? 'application/json';
    }
    async onRequest(request, response) {
        try {
            const requestParams = this.extractRequestParams(request);
            const paramsValidation = this.validateRequestParams(requestParams);
            if (paramsValidation.isFailure) {
                return this.onError(response, paramsValidation.errorOrNull());
            }
            const handler = requestParams.handler;
            const body = await this.getContent(request);
            const params = handler.getParams(request);
            const session = await this.security.authenticate(request);
            const result = await this.runCommand(handler.name, body, session, params);
            if (result.isFailure) {
                const error = result.errorOrNull() ?? new HttpServerError('Internal Server Error', 500);
                return this.onError(response, error);
            }
            const data = result.getOrNull();
            if (Types.isBinary(data))
                return this.sendBufferContent(response, data);
            if (Types.isWritableStream(data))
                return this.sendStreamContent(response, data);
            let acceptType = this.primaryContentTyp;
            if (!!requestParams.acceptType && this.isSupportedContentType(requestParams.acceptType)) {
                for (const type of requestParams.acceptType) {
                    if (this.contentType.includes(type)) {
                        acceptType = type;
                        break;
                    }
                }
            }
            await this.sendDataContent(response, data, acceptType);
        }
        catch (e) {
            let error;
            if (Error.isError(e)) {
                error = e;
            }
            else {
                error = new HttpServerError(`${e}`, 500);
            }
            await this.onError(response, error);
        }
    }
    async onError(response, error) {
        response.statusCode = 500;
        if (error instanceof HttpServerError)
            response.statusCode = error.code;
        await this.sendDataContent(response, { error: error?.message ?? 'Internal Server Error' }, this.primaryContentTyp);
    }
    async getContent(req) {
        return new Promise((res, rej) => {
            const body = [];
            req.on('data', chunk => {
                if (typeof chunk === 'string')
                    body.push(Buffer.from(chunk));
                else
                    body.push(chunk);
            });
            req.on('end', async () => {
                const contentType = req.headers['content-type'] ?? 'application/json';
                const contentBuffer = Buffer.concat(body);
                if (contentBuffer.length > this.bodyLimit)
                    return rej(new HttpServerError('Payload Too Large', 413));
                if (contentType === 'application/octet-stream')
                    return res(Buffer.concat(body));
                const parser = ParserContent.selectFromParser(contentType);
                if (!parser)
                    return rej(new HttpServerError(`Unsupported content type: ${contentType}`, 415));
                try {
                    if (contentBuffer.length === 0)
                        return res(undefined);
                    res(await parser(contentBuffer.toString()));
                }
                catch (e) {
                    rej(new HttpServerError('Invalid content format', 400));
                }
            });
            req.on('error', err => rej(err));
        });
    }
    async sendBufferContent(response, buffer) {
        response.setHeader('Content-Type', 'application/octet-stream');
        if (buffer instanceof Blob)
            buffer = Buffer.from(await buffer.arrayBuffer());
        response.end(buffer);
    }
    async sendStreamContent(response, _stream) {
        response.setHeader('Content-Type', 'application/octet-stream');
        if (_stream instanceof streamWeb.WritableStream)
            _stream = stream.Writable.fromWeb(_stream);
        _stream.pipe(response);
    }
    async sendDataContent(response, content, contentType) {
        const parser = ParserContent.selectToParser(contentType);
        if (!parser) {
            response.statusCode = 415;
            response.end(`Unsupported content type: ${contentType}`);
            return;
        }
        response.setHeader('Content-Type', contentType);
        const parsedContent = await parser(content);
        response.end(parsedContent);
    }
    getPath(request) {
        return request.url?.split('?')[0] || '/';
    }
    getContentType(data) {
        if (!data)
            return undefined;
        return data.split(';')[0].trim();
    }
    extractRequestParams(request) {
        const contentType = this.getContentType(request.headers['content-type']) ?? this.primaryContentTyp;
        const acceptType = this.getContentType(request.headers['accept'])
            ?.split(',')
            .map(it => it.trim());
        const path = this.getPath(request);
        let method = 'get';
        if (HttpUtils.isRestMethod(request.method))
            method = request.method.toLowerCase();
        const handler = this.routing(path, method);
        return {
            contentType,
            acceptType,
            path,
            handler,
        };
    }
    isSupportedContentType(contentType) {
        if (contentType === 'application/octet-stream')
            return true;
        if (contentType === this.primaryContentTyp)
            return true;
        return this.contentType.includes(contentType);
    }
    isBinaryType(types) {
        if (types === Buffer || types === Blob)
            return true;
        if (types === stream.Readable || types === stream.Writable)
            return true;
        return types === streamWeb.ReadableStream || types === streamWeb.WritableStream;
    }
    validateRequestParams(params) {
        if (!params.handler || !this.runCommand) {
            return Result.failure(new HttpServerError('Not Found', 404));
        }
        if (!params.contentType || !this.isSupportedContentType(params.contentType)) {
            return Result.failure(new HttpServerError('Unsupported Media Type', 415));
        }
        if (this.isBinaryType(params.handler.bodySchema) &&
            params.contentType !== ApplicationOctetStream) {
            return Result.failure(new HttpServerError('Unsupported Media Type for binary content', 415));
        }
        return Result.success(true);
    }
}
export { HandleRequest };
