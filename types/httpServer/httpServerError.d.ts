declare class HttpServerError extends Error {
    readonly code: number;
    constructor(message: string, code?: number);
}
export { HttpServerError };
