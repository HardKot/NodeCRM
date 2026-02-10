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
}

export { MetadataRegistry };
