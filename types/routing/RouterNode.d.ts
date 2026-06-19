declare type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

declare class RouterNode {
    public constructor(mapping: string, parent?: RouterNode);
    public readonly mapping: string;

    public isMatch(path: string);
    public addHandler(method: Method, handler: Function);
    public addHandler(handler: Function);

    public getHandler(method: Method);
    private findOrCreateChild
}

export { RouterNode }