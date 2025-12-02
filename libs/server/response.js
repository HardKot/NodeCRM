import http2 from 'node:http2';

class Response extends http2.Http2ServerResponse {
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
    this.end(this.value);
  }

  sessionID(value) {
    this.setHeader('Set-Cookie', `JSSESSIONID=${value}; HttpOnly; Path=/; SameSite=Strict`);
    return this;
  }

  static wrap(stream) {
    Object.setPrototypeOf(stream, Response.prototype);
    return stream;
  }
}

export { Response };
