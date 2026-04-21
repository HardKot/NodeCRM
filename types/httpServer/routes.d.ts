import { Handle } from './handle';
import type { Routing, RESTMethod } from './types';
declare class Routes {
    readonly handlers: Handle[];
    static initialize(): Routing;
    static byHandlers(handlers: Handle[]): Routing;
    private mapping;
    private dynamicTree;
    constructor(handlers: Handle[]);
    route(key: string, method: RESTMethod): Handle | null;
    private findDynamicNode;
    private getDynamicNode;
}
export { Routes };
