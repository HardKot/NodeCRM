class HttpServerError extends Error {
    code;
    constructor(message, code = 500) {
        super(message);
        this.code = code;
    }
}

exports.HttpServerError = HttpServerError;