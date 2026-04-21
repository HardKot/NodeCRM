import * as http2 from 'node:http2';
import { Component } from '../core';
import { JwtService } from './jwtService';
import type { ISecurityGetaway, Tokens } from './types';
import { Session } from '../security';
declare class HttpSecurity {
    private accessTokenService;
    private refreshTokenService;
    private getaway;
    readonly components: Component<any, any>[];
    constructor(accessTokenService: JwtService, refreshTokenService: JwtService, getaway: ISecurityGetaway);
    authenticate(request: http2.Http2ServerRequest): Promise<Session | null>;
    generateTokens(session: Session): Tokens;
    private getSession;
    private validateAccessTokenPayload;
    private accessTokenIsBlocked;
    refreshToken(refreshToken: string): Promise<Tokens>;
    private validateRefreshTokenPayload;
    private refreshTokenIsBlocked;
    private getSessionByUsername;
}
export { HttpSecurity };
