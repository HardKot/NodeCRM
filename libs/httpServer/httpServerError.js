class HttpServerError extends Error {
    code;
    constructor(message, code = 500) {
        super(message);
        this.code = code;
    }
}

export { HttpServerError };