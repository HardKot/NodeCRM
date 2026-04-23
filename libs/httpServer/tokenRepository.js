const { Component } = require('../core');
const TokenRepositorySymbol = Symbol();
function isTokenRepository(obj) {
    return typeof obj.blockToken === 'function' && typeof obj.isBlocked === 'function';
}
class TokenRepositorySimple {
    tokens = new Map();
    blockToken(params, options) {
        if (!params.refreshId)
            return Promise.resolve(false);
        this.tokens.set(params.refreshId, [1, options?.life ? Date.now() + options.life * 1000 : undefined]);
        return Promise.resolve(true);
    }
    isBlocked(params) {
        if (!params.refreshId)
            return Promise.resolve(0);
        const token = this.tokens.get(params.refreshId);
        if (!token)
            return Promise.resolve(0);
        const [status, expiresAt] = token;
        if (expiresAt && Date.now() > expiresAt) {
            this.tokens.delete(params.refreshId);
            return Promise.resolve(-1);
        }
        return Promise.resolve(status);
    }
}
const TokenRepositorySimpleComponent = new Component('TokenRepositorySimple', () => new TokenRepositorySimple(), {
    binding: TokenRepositorySymbol,
    type: 'provider',
    scope: 'singleton',
    eager: true,
});

exports.TokenRepositorySimpleComponent = TokenRepositorySimpleComponent;
exports.TokenRepositorySymbol = TokenRepositorySymbol;
exports.isTokenRepository = isTokenRepository;