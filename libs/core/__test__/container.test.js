const { Container, ContainerError } = require('../application/container.js');

describe('Container test', () => {
  it('should create Container instance', () => {
    const container = new Container();
    expect(container).toBeInstanceOf(Container);
  });

  it('Add simple components', async () => {
    const container = await Container.create([
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      },
    ]);

    const instanceA = await container.get('ComponentA');

    expect(instanceA).toBeDefined();
    expect(instanceA.value).toBe(1);
  });

  it('Add component with dependencies', async () => {
    const container = await Container.create([
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      },
      class ComponentB {
        static inject = ['ComponentA'];

        constructor(componentA) {
          this.componentA = componentA;
        }

        get value() {
          return this.componentA.value;
        }
      },
    ]);

    const instanceB = await container.get('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB.value).toBe(1);
  });

  it('Should throw error for missing dependency', async () => {
    const container = Container.create([
      class ComponentA {
        static inject = ['ComponentB'];

        constructor(componentB) {
          this.componentB = componentB;
        }
      },
    ]);

    expect(container).rejects.toThrow(ContainerError);
  });

  it('Should detect circular dependencies', async () => {
    const container = Container.create([
      class ComponentA {
        static inject = ['ComponentB'];

        constructor(componentB) {
          this.componentB = componentB;
        }
      },
      class ComponentB {
        static inject = ['ComponentA'];

        constructor(componentA) {
          this.componentA = componentA;
        }
      },
    ]);

    expect(container).rejects.toThrow(ContainerError);
  });

  it('Get non-registered component returns null', async () => {
    const container = await Container.create();
    const instance = await container.get('NonExistentComponent');
    expect(instance).toBeNull();
  });

  it('Get components by type', async () => {
    const container = await Container.create([
      {
        name: 'ComponentA',
        factory: () => ({ value: 1 }),
        type: 'service',
      },
      {
        name: 'ComponentB',
        factory: () => ({ value: 2 }),
        type: 'service',
      },
      {
        name: 'ComponentC',
        factory: () => ({ value: 3 }),
        type: 'controller',
      },
    ]);

    const services = await container.type('service');
    expect(services.length).toBe(2);
    expect(services[0].instance.value).toBe(1);
    expect(services[1].instance.value).toBe(2);
  });

  it('Should create transient component instances', async () => {
    const container = await Container.create([
      class ComponentA {
        static scope = 'transient';

        constructor() {
          this.value = Math.random();
        }
      },
      {
        name: 'ComponentB',
        factory: deps => deps.ComponentA,
        inject: ['ComponentA'],
        scope: 'transient',
      },
    ]);

    const instanceB1 = await container.get('ComponentB');
    const instanceB2 = await container.get('ComponentB');

    expect(instanceB1).toBeDefined();
    expect(instanceB2).toBeDefined();
    expect(instanceB1).not.toBe(instanceB2);
    expect(instanceB1.value).not.toBe(instanceB2.value);
  });

  it('Should call postConstructor if defined', async () => {
    let postConstructorCalled = false;

    const container = await Container.create([
      class ComponentA {
        postConstructor() {
          postConstructorCalled = true;
        }
      },
    ]);

    const instanceA = await container.get('ComponentA');

    expect(instanceA).toBeDefined();
    expect(postConstructorCalled).toBe(true);
  });

  it('Error duplicate components', async () => {
    const container = await Container.create([
      class ComponentA {
        constructor() {
          this.value = 1;
        }
      },
    ]);
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

  it('Scoped components behave correctly', async () => {
    const container = await Container.create([
      class ComponentA {
        static scope = 'scoped';

        constructor() {
          this.value = Math.random();
        }
      },
      {
        name: 'ComponentB',
        factory: deps => deps.ComponentA,
        inject: ['ComponentA'],
        scope: 'scoped',
      },
    ]);

    await container.runScope(async () => {
      const instance = await container.get('ComponentB');
      instance.value = 2;
      setTimeout(() => {
        expect(instance.value).toBe(2);
      }, 100);
    });

    await container.runScope(async () => {
      const instance = await container.get('ComponentB');
      instance.value = 20;
      expect(instance.value).toBe(20);
    });
  });

  it('Should apply decorators to components', async () => {
    const container = await Container.create([
      class ComponentA {
        getValue() {
          return 1;
        }
      },
    ]);
    container.decorate('ComponentA', originalInstance => {
      return {
        getValue: () => originalInstance.getValue() + 1,
      };
    });

    const instanceA = await container.get('ComponentA');

    expect(instanceA.getValue()).toBe(2);
  });

  it('Should throw error when getting scoped component outside scope', async () => {
    const container = await Container.create([
      class ComponentA {
        static scope = 'scoped';

        constructor() {
          this.value = Math.random();
        }
      },
    ]);

    expect(container.get('ComponentA')).rejects.toThrow(ContainerError);
  });
});
