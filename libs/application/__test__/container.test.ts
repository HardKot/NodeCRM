import { Container, ContainerError } from '../container';
import { Component, ComponentType, Scoped, Metadata } from '../../core';
import { Module, RootModule } from '../../core';

interface ComponentA {
  value: number;
}
interface ComponentB {
  readonly value: number;
}
interface ComponentG {
  value: number;
}
interface ComponentH {
  postConstruct: () => void;
}

describe('Container test', () => {
  let componentA: Component<ComponentA>;
  let componentB: Component<ComponentB, { ComponentA: ComponentA }>;

  beforeEach(() => {
    componentA = new Component('ComponentA', () => ({ value: 1 }), new Metadata());
    componentB = new Component(
      'ComponentB',
      ({ ComponentA }): ComponentB => ({
        get value() {
          return ComponentA?.value ?? null;
        },
      }),
      Metadata.from({ type: ComponentType.PROVIDER, inject: ['ComponentA'] })
    );

    RootModule.Instance.clear();
  });

  it('should create Container instance', () => {
    const container = new Container();
    expect(container).toBeInstanceOf(Container);
  });

  it('Add simple components', async () => {
    const container = await Container.create([componentA]);

    const instanceA = await container.get<ComponentA>('ComponentA');

    expect(instanceA).toBeDefined();
    expect(instanceA?.value).toBe(1);
  });

  it('Add component with dependencies', async () => {
    const container = await Container.create([componentA, componentB]);

    const instanceB = await container.get<ComponentB>('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(1);
  });

  it('Get non-registered component returns null', async () => {
    const container = await Container.create([componentA]);
    const instance = await container.get('NonExistentComponent');
    expect(instance).toBeNull();
  });

  it('Should create transient component instances', async () => {
    const container = await Container.create([
      new Component(
        'ComponentG',
        () => ({ value: Math.random() }),
        Metadata.from({ scope: Scoped.TRANSIENT })
      ),
    ]);

    const instanceG1 = await container.get<ComponentG>('ComponentG');
    const instanceG2 = await container.get<ComponentG>('ComponentG');

    expect(instanceG1).toBeDefined();
    expect(instanceG2).toBeDefined();

    expect(instanceG1).not.toBe(instanceG2);

    expect(instanceG1?.value).not.toBe(instanceG2?.value);
  });

  it('Should call postConstructor if defined', async () => {
    const container = await Container.create([
      new Component('ComponentH', () => ({ postConstruct: jest.fn() }), new Metadata()),
    ]);

    const instanceA = await container.get<ComponentH>('ComponentH');

    expect(instanceA).toBeDefined();
    expect(instanceA?.postConstruct).toHaveBeenCalled();
  });

  it('Should throw error for missing dependency', async () => {
    await expect(async () => {
      await Container.create([componentB]);
    }).rejects.toThrow(ContainerError);
  });

  it('Should detect circular dependencies', async () => {
    const componentC = new Component(
      'ComponentC',
      () => ({}),
      Metadata.from({ type: ComponentType.PROVIDER, inject: ['ComponentD'] })
    );
    const componentD = new Component(
      'ComponentD',
      () => ({}),
      Metadata.from({ type: ComponentType.PROVIDER, inject: ['ComponentC'] })
    );

    await expect(async () => {
      await Container.create([componentC, componentD]);
    }).rejects.toThrow(ContainerError);
  });

  it('Bindings by class reference', async () => {
    class ServiceA {
      getValue() {
        return 1;
      }
    }

    class ServiceB {
      constructor(private serviceA: ServiceA) {}
      get value() {
        return this.serviceA.getValue() + 1;
      }
    }

    const container = await Container.create([
      new Component(
        'ServiceA',
        () => new ServiceA(),
        new Metadata(),
        RootModule.Instance,
        ServiceA
      ),
      new Component<ServiceB, { serviceA: ServiceA }>(
        'ServiceB',
        ({ serviceA }) => new ServiceB(serviceA),
        Metadata.from({ inject: [ServiceA] }),
        RootModule.Instance,
        ServiceB
      ),
    ]);

    const instanceB = await container.get<ComponentB>('ServiceB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(2);
  });

  it('Separate component by modules', async () => {
    const moduleA = new Module('ModuleA');
    const moduleB = new Module('ModuleB');

    moduleA.linkComponent(componentA);
    moduleB.linkComponent(componentB);

    const container = await Container.create([componentA, componentB]);

    const instanceB = await container.get<ComponentB>('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(null);
  });

  it('Component in one modules', async () => {
    const moduleA = new Module('ModuleA');

    moduleA.linkComponent(componentA);
    moduleA.linkComponent(componentB);

    const container = await Container.create([componentA, componentB]);

    const instanceB = await container.get<ComponentB>('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(1);
  });

  it('Component in imported modules', async () => {
    const moduleA = new Module('ModuleA', [componentA]);
    const moduleB = new Module('ModuleA', [componentB], {}, [moduleA]);

    const container = await Container.create([componentA, componentB]);

    const instanceB = await container.get<ComponentB>('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(1);
  });
});
