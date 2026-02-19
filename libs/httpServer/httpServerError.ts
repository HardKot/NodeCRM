class HttpServerError extends Error {
  constructor(message: string, public readonly code: number = 500) {
    super(message);
  }
}

export { HttpServerError };
