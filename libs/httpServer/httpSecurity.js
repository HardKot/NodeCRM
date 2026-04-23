const { HttpSecurityGetaway } = require('./httpSecurityGetaway');
const { Session } = require('../security');
class SecurityError extends Error {
}
class HttpSecurity {
    accessTokenService;
    refreshTokenService;
    getaway;
    components = [HttpSecurityGetaway];
    constructor(accessTokenService, refreshTokenService, getaway) {
        this.accessTokenService = accessTokenService;
        this.refreshTokenService = refreshTokenService;
        this.getaway = getaway;
    }
    async authenticate(request) {
        const authHeader = request.headers['authorization'];
        if (!authHeader)
            return null;
        if (!authHeader.startsWith('Bearer ')) {
            throw new SecurityError('Unauthorized');
        }
        const accessToken = authHeader.slice(7);
        return await this.getSession(accessToken);
    }
    generateTokens(session) {
        const refreshToken = this.refreshTokenService.generate({ sessionId: session.id, username: session.get("username") });
        const jti = this.refreshTokenService.getJTI(refreshToken).getOrNull();
        const sessionEntries = session.entries().toArray();
        sessionEntries.push(['refreshId', jti]);
        const accessToken = this.accessTokenService.generate(Object.fromEntries(sessionEntries));
        return {
            accessToken,
            refreshToken,
        };
    }
    async getSession(accessToken) {
        const verify = this.accessTokenService.verify(accessToken);
        if (verify.isFailure)
            throw new SecurityError('Invalid access token');
        const payload = verify.getOrNull();
        this.validateAccessTokenPayload(payload);
        await this.accessTokenIsBlocked(payload);
        return new Session({
            userId: payload.username,
            roles: payload.roles,
            permissions: payload.permissions,
        }, payload.sessionId);
    }
    validateAccessTokenPayload(payload) {
        if (payload.refreshId || !payload.username || payload.roles || !payload.permissions) {
            throw new SecurityError('Access token payload is missing required fields');
        }
    }
    async accessTokenIsBlocked(payload) {
        const isBlocked = (await this.getaway?.isTokenBlocked({
            refreshId: payload.refreshId,
        })) ?? 0;
        if (isBlocked === -1) {
            throw new SecurityError('Access token is expired');
        }
        else if (isBlocked === 1) {
            throw new SecurityError('Refresh token is blocked');
        }
    }
    async refreshToken(refreshToken) {
        const verify = this.refreshTokenService.verify(refreshToken);
        if (verify.isFailure)
            throw new SecurityError('Invalid refresh token');
        const payload = verify.getOrNull();
        this.validateRefreshTokenPayload(payload);
        await this.refreshTokenIsBlocked(payload);
        const session = await this.getSessionByUsername(payload.username);
        await this.getaway?.blockToken({ refreshId: payload.jti }, { life: this.refreshTokenService.expiresIn });
        return this.generateTokens(session);
    }
    validateRefreshTokenPayload(payload) {
        if (!payload.username || !payload.jti) {
            throw new SecurityError('Refresh token payload is missing required fields');
        }
    }
    async refreshTokenIsBlocked(payload) {
        const isBlocked = (await this.getaway?.isTokenBlocked({
            refreshId: payload.jti,
        })) ?? 0;
        if (isBlocked === 1) {
            throw new SecurityError('Refresh token is blocked');
        }
    }
    async getSessionByUsername(username) {
        const user = (await this.getaway?.findUserByUsername(username)) ?? null;
        if (!user)
            throw new SecurityError('User not found');
        return new Session({
            username: user.username,
            roles: user.roles,
            permissions: user.permissions,
        });
    }
}

exports.HttpSecurity = HttpSecurity;