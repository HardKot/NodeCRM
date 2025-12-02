import http2 from 'node:http2';

class Session extends http2.Http2Session {
  /**
   * @param {http2.Session} session
   * @return {Session}
   */
  static wrap(session) {
    Object.setPrototypeOf(session, Session.prototype);
    return session;
  }
}

export { Session };
