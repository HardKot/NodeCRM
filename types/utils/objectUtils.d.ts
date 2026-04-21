type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? T[P] extends Array<infer U> ? Array<DeepPartial<U>> : DeepPartial<T[P]> : T[P];
};
export declare class ObjectUtils {
    constructor();
    static firstNotNullValue<T>(property: string, ...args: Record<string, any>[]): T | null;
    static goTo<T = any>(obj: Record<string, any>, path: string, defaultValue?: T): T | undefined;
    static deepFreeze<T extends object>(object: T): T;
    static deepAssign<T extends Record<string, any>>(target: T, ...sources: DeepPartial<T>[]): T;
    static getMethodNames(obj: object): string[];
    static toBase64Url(obj: any): string;
}
export {};
