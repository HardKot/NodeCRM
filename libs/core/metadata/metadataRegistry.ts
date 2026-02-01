import { Metadata } from './metadata';

class MetadataRegistry {
  private readonly registry: Map<any, Metadata> = new Map();

  public registerTarget(target: any) {
    if (!this.registry.has(target)) {
      this.registry.set(target, new Metadata());
    }
    return this.registry.get(target)!;
  }

  public getMetadata(target: any): Metadata | undefined {
    return this.registry.get(target);
  }

  public static merge(a: MetadataRegistry, b: MetadataRegistry) {
    const newRegistry = new MetadataRegistry();
    a.registry.entries().forEach(entry => newRegistry.registry.set(entry[0], entry[1]));
    b.registry.entries().forEach(entry => newRegistry.registry.set(entry[0], entry[1]));
    return newRegistry;
  }
}

export { MetadataRegistry };
