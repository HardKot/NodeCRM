import { CrmSpace } from '../common/crmSpace.js';
import { Flow } from '../../libs/flow.js';
import { CrmModule } from '../common/index.js';

export class ApiSpace {
  constructor(app) {
    this.space = new CrmSpace('api', app);
    this.app = app;
  }

  async load() {
    const files = await Flow.of(this.space.load())
      .map(
        it =>
          new CrmModule(it, {
            context: this.getContext(),
            runOptions: this.getRunOptions(),
            dirname: this.space.path,
          })
      )
      .filter(it => it.isExists())
      .map(it => it.load());
    return files;
  }

  getContext() {
    return {};
  }

  getRunOptions() {
    return {};
  }
}
