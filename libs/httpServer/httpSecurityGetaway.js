import { Component, Metadata } from '../core';
import { isUserRepository, UserRepositorySymbol } from '../security';
import { isTokenRepository, TokenRepositorySymbol } from './tokenRepository';
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
}, Metadata.from({
    binding: SecurityRepositorySymbol,
    type: 'provider',
    scope: 'singleton',
    eager: true,
    inject: [UserRepositorySymbol, TokenRepositorySymbol],
}));
const HttpSecurityGetawayEmpty = {
    findUserByUsername: async () => null,
    blockToken: async () => false,
    isTokenBlocked: async () => 0,
};
export { HttpSecurityGetaway, SecurityRepositorySymbol, HttpSecurityGetawayEmpty };
