export declare class Session extends Map<string, any> {
    #private;
    readonly id: string;
    constructor(payload?: Record<string, any>, id?: string);
    set(key: string, value: any): this;
    get hasChange(): boolean;
    get roles(): string[];
    get permissions(): string[];
}
