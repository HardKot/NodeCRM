import { BeanError, Scoped } from '#constant';

import { Bean } from './bean.ts';

export { BeanBuilder };

class BeanBuilder<T> implements IBeanBuilder<T> {
  #beanProps: BeanProps<T>;

  constructor() {
    this.#beanProps = {
      name: '',
      factory: () => {
        throw new BeanError('No factory provided for bean');
      },
      deps: [],
      aliases: [],
    };
  }

  name(value: string) {
    this.#beanProps.name = value;
    return this;
  }
  eager() {
    this.#beanProps.eager = true;
    return this;
  }
  async() {
    this.#beanProps.async = true;
    return this;
  }

  singleton() {
    this.#beanProps.scope = Scoped.SINGLETON;
    return this;
  }
  transient() {
    this.#beanProps.scope = Scoped.TRANSIENT;
    return this;
  }
  scoped() {
    this.#beanProps.scope = Scoped.SCOPED;
    return this;
  }

  dependsOn(...deps: string[]) {
    this.#beanProps.deps?.push(...deps);
    return this;
  }
  alias(...aliases: string[]) {
    this.#beanProps.aliases?.push(...aliases);
    return this;
  }

  class(Class: { new(...args: any[]): T }) {
    this.#beanProps.factory = (deps) => new Class(...deps);
    return this;
  }
  factory(factory: () => T) {
    this.#beanProps.factory = factory;
    return this;
  }

  postConstruct(method: IBeanCallback<T>) {
    this.#beanProps.postConstruct = method;
    return this;
  }
  preDestroy(method: IBeanCallback<T>) {
    this.#beanProps.preDestroy = method;
    return this;
  }

  build() {
    return new Bean(this.#beanProps);
  }
}
