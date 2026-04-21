declare class StringUtils {
    constructor();
    static factoryCamelCase(...strings: string[]): string;
    static factoryPascalCase(...strings: string[]): string;
    static parse(source: string): string[];
}
export { StringUtils };
