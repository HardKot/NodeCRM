const http2 = require('node:http2');
const queryString = require('node:querystring');

class Request extends http2.Http2ServerRequest {
  get path() {
    let [path] = this.url.split('?');
    if (path.endsWith('/')) path += 'index';

    return path;
  }

  get contentType() {
    return this.headers['content-type'] ?? 'application/json';
  }

  text() {
    return new Promise((resolve, reject) => {
      let data = '';
      this.on('data', chunk => {
        data += chunk;
      });
      this.on('end', () => {
        resolve(data.toString());
      });
      this.on('error', err => {
        reject(err);
      });
    });
  }

  async json() {
    if (this.contentType === 'application/json') {
      const text = await this.text();
      const data = JSON.parse(text);
      return Object.freeze(data);
    }
    throw new Error('Request.json() is not supported');
  }

  async data() {
    if (this.contentType === 'application/json') {
      return await this.json();
    }

    throw new Error(`Request.data() does not support content type: ${this.contentType}`);
  }

  get queryParams() {
    const [, queryParamsStr] = this.url.split('?');
    let data = {};
    if (queryParamsStr) data = queryString.parse(queryParamsStr);
    return Object.freeze(data);
  }

  get cookies() {
    const cookieHeader = this.headers['cookie'];
    const cookies = {};
    if (cookieHeader) {
      const cookiePairs = cookieHeader.split('; ');
      for (const pair of cookiePairs) {
        const [name, value] = pair.split('=');
        cookies[name] = value;
      }
    }
    return Object.freeze(cookies);
  }

  /**
   * @param {http2.ServerHttp2Stream} stream
   * @return {Request}
   */
  static wrap(stream) {
    Object.setPrototypeOf(stream, Request.prototype);
    Object.freeze(stream);
    return stream;
  }
}

module.exports = { Request };
