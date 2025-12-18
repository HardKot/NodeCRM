import path from 'node:path';

import { Slice } from '../slice/slice.js';

class AppSpace {
  constructor(app) {
    this.app = app;

    this.slices = [];

    this.modules = {};
    this.config = {};
    Object.freeze(this);
  }

  async load() {
    this.updateConfig();
    this.updateSlice();

    for (const slice of this.slices) {
      const modules = await slice.load();

      Object.assign(this.modules, modules);
    }
  }

  updateConfig() {
    const { config } = this.app;

    this.config.root = config.getByName('space.root', path.join(this.app.path));
    this.config.slices = config.getByName('space.slices', { root: './' });

    //   {
    //   infrastructure: ['repository', 'external', 'adapter'],
    //   interface: ['api', 'events', 'rpc'],
    //   domain: ['domain'],
    // }
    // );
  }

  updateSlice() {
    for (const slice in this.config.slices) {
      this.slices.push(
        new Slice(this.app, {
          path: this.config.slices[slice].map(it => path.join(this.config.root, it)),
          context: this.app.context,
        })
      );
    }
  }
}

export { AppSpace };
