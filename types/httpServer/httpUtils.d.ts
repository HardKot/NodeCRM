import type { RESTMethod, TLSOptions } from './types';
declare class HttpUtils {
    private constructor();
    static readTLS(dir?: string): TLSOptions;
    static isRestMethod(method: string): method is RESTMethod;
}
export { HttpUtils };
