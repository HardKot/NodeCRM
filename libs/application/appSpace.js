import { Slice } from '../slice/slice.js';
import fs from 'node:fs';

class AppSpace {
  constructor(app) {
    this.slices = [];

    this.logger = app.logger.create('Space');
    this.config = Object.freeze({
      root: app.config.get('space.root', app.path),
      slices: app.config.get('space.slices', { root: './' }),
    });
    this.createSlice = options => new Slice(Object.assign({}, options, { context: app.context }));
    this.registerModule = app.registerModule.bind(app);
  }

  get modules() {
    return this.slices.flatMap(slice => slice.modules);
  }

  async bootstrap() {
    this.slices = this.createSlice(this.config.slices);
    await this.loadSlice();
    await this.watchSlice();
    return this.slices;
  }

  createSlice(options) {
    return Object.entries(options).map(([slice, pathSlice]) =>
      this.createSlice({ name: slice, path: pathSlice })
    );
  }

  async loadSlice() {
    this.logger.info(
      `Detected ${this.slices.length} slices: ${this.slices.map(s => s.name).join(', ')}`
    );
    await Promise.all(this.slices.map(slice => slice.load()));
    this.logger.info(`All slices loaded.`);
    this.registerModule(...this.modules);
  }

  watchSlice() {
    const self = this;

    for (const slice of this.slices) {
      if (!fs.existsSync(slice.name)) continue;
      let timeout = null;

      fs.watch(slice.name, { recursive: true }, () => {
        clearTimeout(timeout);

        timeout = setTimeout(async () => {
          const index = self.slices.indexOf(slice);
          const slices = self.slices.slice(0, index + 1);
          self.logger.info(`Changes detected in slice "${slice.name}". Reloading...`);

          for (const slice of slices) {
            await slice.load();
            self.logger.info(`Slice "${slice.name}" reloaded.`);
          }

          self.registerModule(...this.modules);
        }, 100);
      });
    }
  }
}

export { AppSpace };
