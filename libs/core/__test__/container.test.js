import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { Container, ContainerError } from '../container.js';

describe('Container test', () => {
  it('should create Container instance', () => {
    const container = new Container();
    expect(container).toBeInstanceOf(Container);
  });

  it('Add simple components', () => {
    const container = new Container();

    container.add(
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      }
    );

    container.build();
    const instanceA = container.get('ComponentA');

    expect(instanceA).toBeDefined();
    expect(instanceA.value).toBe(1);
  });

  it('Add component with dependencies', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      }
    );
    container.add(
      class ComponentB {
        static inject = ['ComponentA'];

        constructor(componentA) {
          this.componentA = componentA;
        }

        get value() {
          return this.componentA.value;
        }
      }
    );

    container.build();
    const instanceB = container.get('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB.value).toBe(1);
  });

  it('Should throw error for missing dependency', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        static inject = ['ComponentB'];

        constructor(componentB) {
          this.componentB = componentB;
        }
      }
    );

    expect(() => {
      container.build();
    }).toThrow(ContainerError);
  });

  it('Should detect circular dependencies', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        static inject = ['ComponentB'];

        constructor(componentB) {
          this.componentB = componentB;
        }
      }
    );
    container.add(
      class ComponentB {
        static inject = ['ComponentA'];

        constructor(componentA) {
          this.componentA = componentA;
        }
      }
    );

    expect(() => {
      container.build();
    }).toThrow(ContainerError);
  });

  it('Get non-registered component returns null', () => {
    const container = new Container();
    const instance = container.get('NonExistentComponent');
    expect(instance).toBeNull();
  });

  it('Get components by type', () => {
    const container = new Container();
    container.add({
      name: 'ComponentA',
      factory: () => ({ value: 1 }),
      type: 'service',
    });
    container.add({
      name: 'ComponentB',
      factory: () => ({ value: 2 }),
      type: 'service',
    });
    container.add({
      name: 'ComponentC',
      factory: () => ({ value: 3 }),
      type: 'controller',
    });

    container.build();
    const services = container.type('service');
    expect(services.length).toBe(2);
    expect(services[0].value).toBe(1);
    expect(services[1].value).toBe(2);
  });

  it('Should create transient component instances', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        static scope = 'transient';

        constructor() {
          this.value = Math.random();
        }
      }
    );
    container.add({
      name: 'ComponentB',
      factory: deps => deps.ComponentA,
      inject: ['ComponentA'],
      scope: 'transient',
    });

    container.build();
    const instanceB1 = container.get('ComponentB');
    const instanceB2 = container.get('ComponentB');

    expect(instanceB1).toBeDefined();
    expect(instanceB2).toBeDefined();
    expect(instanceB1).not.toBe(instanceB2);
    expect(instanceB1.value).not.toBe(instanceB2.value);
  });

  it('Should call postConstructor if defined', () => {
    const container = new Container();
    let postConstructorCalled = false;

    container.add(
      class ComponentA {
        postConstructor() {
          postConstructorCalled = true;
        }
      }
    );

    container.build();
    const instanceA = container.get('ComponentA');

    expect(instanceA).toBeDefined();
    expect(postConstructorCalled).toBe(true);
  });

  it('Should clear container', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        constructor() {
          this.value = Math.random();
        }
      }
    );

    container.build();
    const instanceA1 = container.get('ComponentA');

    container.clear();
    const instanceA2 = container.get('ComponentA');

    expect(instanceA1).toBeDefined();
    expect(instanceA2).toBeNull();
  });

  it('Error duplicate components', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      }
    );
    expect(() => {
      container.add(
        class ComponentA {
          constructor() {
            this.value = 2;
          }
        }
      );
    }).toThrow(ContainerError);
  });

  it('Scoped components behave correctly', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        static scope = 'scoped';

        constructor() {
          this.value = Math.random();
        }
      }
    );
    container.add({
      name: 'ComponentB',
      factory: deps => deps.ComponentA,
      inject: ['ComponentA'],
      scope: 'scoped',
    });

    container.build();

    container.runScope(() => {
      const instance = container.get('ComponentB');
      instance.value = 2;
      setTimeout(() => {
        expect(instance.value).toBe(2);
      }, 100);
    });

    container.runScope(() => {
      const instance = container.get('ComponentB');
      instance.value = 20;
      expect(instance.value).toBe(20);
    });
  });

  it('Hot reload component', () => {
    const container = new Container();

    container.add({
      name: 'ComponentA',
      factory: () => {
        return { value: 1 };
      },
      type: 'service',
    });

    container.build();
    const instanceA1 = container.get('ComponentA');
    expect(instanceA1.value).toBe(1);

    // Simulate hot reload by updating the component
    container.update({
      name: 'ComponentA',
      factory: () => {
        return { value: 2 };
      },
      type: 'service',
    });

    const instanceA2 = container.get('ComponentA');
    expect(instanceA2.value).toBe(2);
  });

  it('Should apply decorators to components', () => {
    const container = new Container();

    container.add(
      class ComponentA {
        getValue() {
          return 1;
        }
      }
    );

    container.decorate('ComponentA', originalInstance => {
      return {
        getValue: () => originalInstance.getValue() + 1,
      };
    });

    container.build();
    const instanceA = container.get('ComponentA');

    expect(instanceA.getValue()).toBe(2);
  });

  it('Should throw error when getting scoped component outside scope', () => {
    const container = new Container();
    container.add(
      class ComponentA {
        static scope = 'scoped';

        constructor() {
          this.value = Math.random();
        }
      }
    );

    container.build();

    expect(() => {
      container.get('ComponentA');
    }).toThrow(ContainerError);
  });

  it('Should dispose instances on clear', () => {
    const container = new Container();
    let disposed = false;

    container.add(
      class ComponentA {
        dispose() {
          disposed = true;
        }
      }
    );

    container.build();
    const instanceA = container.get('ComponentA');
    expect(instanceA).toBeDefined();

    container.clear();
    expect(disposed).toBe(true);
  });
});
