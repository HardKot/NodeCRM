import * as config from '../common/config.js';
import { MODULE_TYPES, Module } from '../common/Module.js';
import { Flow } from '../flow.js';
import { FilterHandler } from './FilterHandler.js';
import { CorsFilter } from './CorsFilter.js';
import { RateLimit } from './RateLimit.js';

const FILTER_DIR = config.get('security.dir', 'app/filters');

const FILTERS = await Flow.of(Module.readDir(FILTER_DIR))
  .filter(it => it.type === MODULE_TYPES.SCRIPT)
  .map(it => it.import())
  .map(it => it.filter || it.default)
  .filter(it => typeof it === 'function')
  .map(it => new FilterHandler(it))
  .concat([new FilterHandler(CorsFilter), new FilterHandler(RateLimit)])
  .sort((a, b) => a.index - b.index)
  .get();

Object.freeze(FILTERS);

export async function applyFilters({ req, res, handler, user }) {
  async function dispatch(i = 0) {
    const filter = FILTERS[i];

    if (!filter) return;

    await handler.apply({
      req,
      res,
      handler,
      user,
      next: async () => await dispatch(i + 1),
    });
  }

  await dispatch(0);
}
