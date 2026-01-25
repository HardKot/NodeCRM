import http2 from 'node:http2';
import stream from 'node:stream';

class Response extends http2.Http2ServerResponse {
  get isSend() {
    return this.headersSent;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  contentType(value) {
    this.setHeader('Content-Type', value);
    this.contentType = value;
    return this;
  }

  text(text) {
    this.contentType('text/plain; charset=utf-8');
    this.value = text;
    return this;
  }

  json(data) {
    this.contentType('application/json; charset=utf-8');
    this.value = JSON.stringify(data);
    return this;
  }

  data(data, contentType) {
    const type = contentType?.split(';')[0];
    if (type === 'application/json') {
      return this.json(data);
    }

    if (type === 'text/plain') {
      return this.text(data);
    }

    this.value = data;
    return this;
  }

  send() {
    if (this.value instanceof stream.Stream) {
      this.value.pipe(this);
    } else {
      this.end(this.value);
    }
    return this;
  }

  /**
   * @param {http2.ServerHttp2Stream} stream
   * @return {Response}
   */
  static wrap(stream) {
    Object.setPrototypeOf(stream, Response.prototype);
    Object.freeze(stream);
    return stream;
  }
}

export { Response };
