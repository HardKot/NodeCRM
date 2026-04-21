import { Result } from '../utils';
declare class JwtError extends Error {
}
declare class JwtService {
    #private;
    alg: string;
    expiresIn: number;
    constructor(secret: string, alg: string, expiresIn: number);
    generate(data: Record<string, any>, jti?: string): string;
    getJTI(token: string): Result<string, JwtError>;
    verify<T extends {
        exp?: number;
    }>(token: string): Result<T, JwtError>;
    private getSignature;
    private encodeBase64Url;
    private decodeBase64Url;
}
export { JwtError, JwtService };
