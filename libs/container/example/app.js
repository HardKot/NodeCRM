import path from 'node:path';
import { Container, Scopes } from '../index.js';

const diContaier = Container({
  alias: {},
  slice: [path.join(import.meta.dirname, 'components')],
  defaultScope: Scopes.Singleton,
  scopeAssotiation: {
    Singleton: Scopes.Singleton,
    Multi: Scopes.Prototype,
  },

  watch: true,

  context: {
    ...global,
    secretValue: 12,
  },

  onBuild: () => {
    console.log('Contaner is created');
  },

  onRebuild: () => {
    console.log('Container is rebuild');
  },

  onError: e => {
    console.error(e);
  },
});

const userService = diContaier.instance({ name: 'UserService' });
const services = diContaier.instances({ tag: 'services' });
