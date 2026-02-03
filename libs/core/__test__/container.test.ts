import { Container, ContainerError } from '../application/container';
import { ComponentType, Scoped, SourceComponentParser } from '../component';
import { SourceMetadataParser } from '../metadata';

describe('Container test', () => {
  const componentParser = new SourceComponentParser(new SourceMetadataParser());

  class ComponentA {
    static $type = ComponentType.PROVIDER;
    public value: number = 1;
  }
  class ComponentB {
    static $type = ComponentType.PROVIDER;
    static $inject = ['ComponentA'];

    constructor(public componentA: ComponentA) {}

    get value() {
      return this.componentA.value;
    }
  }
  class ComponentC {
    static $type = ComponentType.PROVIDER;
    static $inject = ['ComponentD'];
    constructor(public componentD: ComponentD) {}
  }
  class ComponentD {
    static $type = ComponentType.CONSUMER;
    static $inject = ['ComponentC'];
    constructor(public componentC: ComponentC) {}
  }
  class ComponentE {
    static $type = ComponentType.CONSUMER;
    public value: number = 2;
  }
  class ComponentF {
    static $type = ComponentType.PROVIDER;
    public value: number = 2;
  }
  class ComponentG {
    static $scope = Scoped.TRANSIENT;
    public value: number;

    constructor() {
      this.value = Math.random();
    }
  }
  class ComponentH {
    public postConstruct = jest.fn();
  }

  it('should create Container instance', () => {
    const container = new Container();
    expect(container).toBeInstanceOf(Container);
  });

  it('Add simple components', async () => {
    const container = await Container.create([componentParser.parse(ComponentA)]);

    const instanceA = await container.get<ComponentA>('ComponentA');

    expect(instanceA).toBeDefined();
    expect(instanceA?.value).toBe(1);
  });

  it('Add component with dependencies', async () => {
    const container = await Container.create([
      componentParser.parse(ComponentA),
      componentParser.parse(ComponentB),
    ]);

    const instanceB = await container.get<ComponentB>('ComponentB');

    expect(instanceB).toBeDefined();
    expect(instanceB?.value).toBe(1);
  });

  it('Get non-registered component returns null', async () => {
    const container = await Container.create([componentParser.parse(ComponentA)]);
    const instance = await container.get('NonExistentComponent');
    expect(instance).toBeNull();
  });

  it('Get components by type', async () => {
    const container = await Container.create([
      componentParser.parse(ComponentA),
      componentParser.parse(ComponentE),
      componentParser.parse(ComponentF),
    ]);

    const services = await container.type(ComponentType.PROVIDER);
    expect(services.length).toBe(2);

    const firstProvider = services[0];
    const secondProvider = services[1];

    expect(firstProvider.instance).toBeInstanceOf(ComponentA);
    expect(secondProvider.instance).toBeInstanceOf(ComponentF);

    expect((firstProvider.instance as ComponentA).value).toBe(1);

    expect((secondProvider.instance as ComponentF).value).toBe(2);
  });

  it('Should create transient component instances', async () => {
    const container = await Container.create([componentParser.parse(ComponentG)]);

    const instanceG1 = await container.get<ComponentG>('ComponentG');
    const instanceG2 = await container.get<ComponentG>('ComponentG');

    expect(instanceG1).toBeDefined();
    expect(instanceG2).toBeDefined();

    expect(instanceG1).not.toBe(instanceG2);

    expect(instanceG1?.value).not.toBe(instanceG2?.value);
  });

  it('Should call postConstructor if defined', async () => {
    let postConstructorCalled = false;

    const container = await Container.create([componentParser.parse(ComponentH)]);

    const instanceA = await container.get<ComponentH>('ComponentH');

    expect(instanceA).toBeDefined();
    expect(instanceA?.postConstruct).toHaveBeenCalled();
  });

  it('Should throw error for missing dependency', async () => {
    await expect(async () => {
      await Container.create([componentParser.parse(ComponentB)]);
    }).rejects.toThrow(ContainerError);
  });

  it('Should detect circular dependencies', async () => {
    await expect(async () => {
      await Container.create([componentParser.parse(ComponentB)]);
    }).rejects.toThrow(ContainerError);
  });
});
