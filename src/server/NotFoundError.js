export class NotFoundError extends Error {
  constructor({ method, pathname }) {
    super(`Cannot ${method} ${pathname}`);
  }
}
