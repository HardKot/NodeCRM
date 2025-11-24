class UrlResourceError extends Error {}

class UrlResource {
  #parts = [];
  #params = [];
  #isDynamic = false;

  constructor(url) {
    this.url = url;

    this.#parts = url.split('/').filter(it => !!it);
    this.#params = new Array(this.#parts.length);

    const urlPattern = '';

    for (let i = 0; i < this.#parts.length; i++) {
      const part = this.#parts[i];

      if (!/<\w+>/g.test(part)) continue;
      this.#params[i] = part.slice(1, -1);
    }

    this.regex = new RegExp(`^${url}/`, 'i');
  }

  parseParams(requestUrl) {
    const params = {};

    for (const part of this.#parts) {
    }
  }

  get isDynamic() {
    return this.#isDynamic;
  }

  get parts() {
    return this.#parts;
  }
}

export { UrlResource, UrlResourceError };
