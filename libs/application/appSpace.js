import path from 'node:path';
import fs from 'node:fs';

import { Slice } from '../slice/slice.js';

class AppSpace {
  constructor(app) {
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
  }

  async loadSlices() {
    const slices = Object.entries(this.config.slices).map(([slice, pathSlice]) =>
      this.createSlice({ name: slice, path: pathSlice })
    );

    await Promise.all(slices.map(slice => slice.load()));

    this.slices = Object.fromEntries(slices.map(slice => [slice.name, slice]));

    return this.slices;
  }

  async reloadSlice(name) {
    const slice = this.slices[name];
    if (!slice) return null;

    await slice.load();
    return slice;
  }
}

export { AppSpace };
