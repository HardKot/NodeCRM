import { Slice } from '../slice/slice.js';
import fs from 'node:fs';
import EventEmitter from 'node:events';

class AppSpace extends EventEmitter {
  constructor(app) {
    super();
    this.slices = [];

    this.logger = app.logger.create('Space');
    this.config = Object.freeze({
      root: app.config.get('space.root', app.path),
      slices: app.config.get('space.slices', { root: './' }),
    });
    this.createSlice = options => new Slice(Object.assign({}, options, { context: app.context }));

    Object.freeze(this);
  }

  async bootstrap() {
    await this.loadSlices();
    await this.watchSlices();
  }

  async loadSlices() {
    const slices = Object.entries(this.config.slices).map(([slice, pathSlice]) =>
      this.createSlice({ name: slice, path: pathSlice })
    );
    this.logger.info(`Detected ${slices.length} slices: ${slices.map(s => s.name).join(', ')}`);
    await Promise.all(slices.map(slice => slice.load()));

    this.slices = Object.fromEntries(slices.map(slice => [slice.name, slice]));
    this.logger.info(`All slices loaded.`);

    return this.slices;
  }

  watchSlices() {
    const self = this;
    for (const slice of this.slices) {
      if (!fs.existsSync(slice.name)) continue;
      let timeout = null;

      fs.watch(slice.name, { recursive: true }, () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(async () => {
          self.logger.info(`Changes detected in slice "${slice.name}". Reloading...`);
          await slice.load();
          self.logger.info(`Slice "${slice.name}" reloaded.`);
          self.emit('slice:reload', slice);
        }, 100);
      });
    }
  }
}

export { AppSpace };
