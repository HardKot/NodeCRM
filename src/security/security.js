import { Flow } from '../../libs/flow.js';
import { CorsFilter, FilterHandler, JWTFilter, RateLimit } from './FilterHandler.js';
import * as jwt from './jwt.js';

export class Security {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;

    this.jwtConfig = app.config.get('security.jwt');
    this.corsConfig = app.config.get('security.corsConfig');
    this.rateLimitConfig = app.config.get('security.rateLimit');

    this.filters = [];
  }

  async load() {
    this.filters = await Flow.of(this.app.modules)
      .filter(it => it.isScript() && it.path.startsWith('/app/filters/'))
      .map(async it => await it.import())
      .map(it => it.filter || it.default)
      .filter(it => typeof it === 'function')
      .map(it => new FilterHandler(it))
      .concat([
        CorsFilter(this.corsConfig),
        RateLimit(this.rateLimitConfig),
        JWTFilter(this.jwtConfig),
      ])
      .sort((a, b) => a.index - b.index)
      .get();
    Object.freeze(this.filters);
  }

  async applyFilters({ req, res }) {
    async function dispatch(i = 0) {
      const filter = this.filters[i];

      if (!filter) return true;

      await filter.apply({
        req,
        res,
        next: async () => await dispatch(i + 1),
      });
    }

    return await dispatch(0);
  }

  async indentificate({ headers, cookies }) {
    let user;
    if (cookies.JSSESSID) {
      const session = await this.storage.session(cookies.JSSESSID);
      if (session) user = await this.storage.user(session.userID);
      if (user) return user;
    }

    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = jwt.parse(token);
      if (payload) user = await this.storage.user(payload.userID);
      if (user) return user;
    }

    return null;
  }
}
