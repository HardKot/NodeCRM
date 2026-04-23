const { Component } = require('../core');
const { isUserRepository, UserRepositorySymbol } = require('../security');
const { isTokenRepository, TokenRepositorySymbol } = require('./tokenRepository');
const SecurityRepositorySymbol = Symbol();
const HttpSecurityGetaway = new Component("HttpSecurityGetaway", (deps) => {
    let userRepository = null;
    let tokenRepository = null;
    if (isUserRepository(deps[UserRepositorySymbol]))
        userRepository = deps[UserRepositorySymbol];
    if (isTokenRepository(deps[TokenRepositorySymbol]))
        tokenRepository = deps[TokenRepositorySymbol];
    return {
        findUserByUsername: userRepository?.findByUsername.bind(userRepository) ?? (async () => null),
        blockToken: tokenRepository?.blockToken.bind(tokenRepository) ?? (async () => false),
        isTokenBlocked: tokenRepository?.isBlocked.bind(tokenRepository) ?? (async () => 0),
    };
}, {
    binding: SecurityRepositorySymbol,
    type: 'provider',
    scope: 'singleton',
    eager: true,
    inject: [UserRepositorySymbol, TokenRepositorySymbol],
});
const HttpSecurityGetawayEmpty = {
    findUserByUsername: async () => null,
    blockToken: async () => false,
    isTokenBlocked: async () => 0,
};

exports.HttpSecurityGetaway = HttpSecurityGetaway;
exports.SecurityRepositorySymbol = SecurityRepositorySymbol;
exports.HttpSecurityGetawayEmpty = HttpSecurityGetawayEmpty;