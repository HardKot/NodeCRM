import * as http2 from 'node:http2';

import { Component } from '../core';

import { HttpSecurityGetaway } from './httpSecurityGetaway';
import { JwtService } from './jwtService';

import type {
  ISecurityGetaway,
  Tokens,
  JWTAccessTokenPayload,
  JWTRefreshTokenPayload,
} from './types';
import { Session } from '../security';


class SecurityError extends Error {}

class HttpSecurity {
  public readonly components: Component<any, any>[] = [HttpSecurityGetaway];

  constructor(
    private accessTokenService: JwtService,
    private refreshTokenService: JwtService,
    private getaway: ISecurityGetaway
  ) {}

  public async authenticate(request: http2.Http2ServerRequest): Promise<Session | null> {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return null;
    if (!authHeader.startsWith('Bearer ')) {
      throw new SecurityError('Unauthorized');
    }
    const accessToken = authHeader.slice(7);

    return await this.getSession(accessToken);
  }

  public generateTokens(session: Session): Tokens {
    const refreshToken = this.refreshTokenService.generate({ sessionId: session.id });
    const jti = this.refreshTokenService.getJTI(refreshToken).getOrNull()!;

    const sessionEntries = session.entries().toArray();
    sessionEntries.push(['refreshId', jti]);

    const accessToken = this.accessTokenService.generate(Object.fromEntries(sessionEntries));

    return {
      accessToken,
      refreshToken,
    };
  }

  private async getSession(accessToken: string): Promise<Session> {
    const verify = this.accessTokenService.verify<JWTAccessTokenPayload>(accessToken);
    if (verify.isFailure) throw new SecurityError('Invalid access token');
    const payload = verify.getOrNull()!;

    this.validateAccessTokenPayload(payload);
    await this.accessTokenIsBlocked(payload);

    return new Session(
      {
        userId: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
      },
      payload.sessionId
    );
  }

  private validateAccessTokenPayload(payload: JWTAccessTokenPayload): void {
    if (payload.refreshId || !payload.username || payload.roles || !payload.permissions) {
      throw new SecurityError('Access token payload is missing required fields');
    }
  }
  private async accessTokenIsBlocked(payload: JWTAccessTokenPayload): Promise<void> {
    const isBlocked =
      (await this.getaway?.isTokenBlocked({
        refreshId: payload.refreshId,
      })) ?? 0;

    if (isBlocked === -1) {
      throw new SecurityError('Access token is expired');
    } else if (isBlocked === 1) {
      throw new SecurityError('Refresh token is blocked');
    }
  }

  public async refreshToken(refreshToken: string): Promise<Tokens> {
    const verify = this.refreshTokenService.verify<JWTRefreshTokenPayload>(refreshToken);
    if (verify.isFailure) throw new SecurityError('Invalid refresh token');
    const payload = verify.getOrNull()!;

    this.validateRefreshTokenPayload(payload);
    await this.refreshTokenIsBlocked(payload);
    const session = await this.getSessionByUsername(payload.username!);
    await this.getaway?.blockToken(
      { refreshId: payload.jti },
      { life: this.refreshTokenService.expiresIn }
    );

    return this.generateTokens(session);
  }
  private validateRefreshTokenPayload(payload: JWTRefreshTokenPayload): void {
    if (!payload.username || !payload.jti) {
      throw new SecurityError('Refresh token payload is missing required fields');
    }
  }
  private async refreshTokenIsBlocked(payload: JWTRefreshTokenPayload): Promise<void> {
    const isBlocked =
      (await this.getaway?.isTokenBlocked({
        refreshId: payload.jti,
      })) ?? 0;

    if (isBlocked === 1) {
      throw new SecurityError('Refresh token is blocked');
    }
  }
  private async getSessionByUsername(username: string): Promise<Session> {
    const user = (await this.getaway?.findUserByUsername(username)) ?? null;
    if (!user) throw new SecurityError('User not found');

    return new Session({
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
    });
  }
}

export { HttpSecurity }
