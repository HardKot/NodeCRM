import { Application } from "./application";

declare class Container {
    public app: Application;
    constructor(app: Application);

    async resolve<T>(alias: string): T;
    async destroyAll(): Promise<void>;
    async destroyScoped(scopeId: string): Promise<void>;
}

export { Container }