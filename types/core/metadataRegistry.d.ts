import { Metadata } from './metadata';
declare class MetadataRegistry {
    private readonly registry;
    registerTarget(target: any): any;
    getMetadata(target: any): Metadata | undefined;
}
export { MetadataRegistry };
