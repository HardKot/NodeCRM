import { AccessFunction } from './types';
declare function PrivateAccess(): boolean;
declare function parserAccess(source: string): AccessFunction;
declare function wrapAccessFunction(func: Function): AccessFunction;
export { parserAccess, wrapAccessFunction, PrivateAccess, AccessFunction };
