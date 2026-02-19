import { Component, Metadata } from '../core';
import { isUserRepository, IUserRepository, UserRepositorySymbol } from '../security';

import type { ISecurityGetaway, ITokenRepository, SecurityRepositoryDeps } from './types';
import { isTokenRepository, TokenRepositorySymbol } from './tokenRepository';


const SecurityRepositorySymbol = Symbol();

const HttpSecurityGetaway = new Component<ISecurityGetaway, SecurityRepositoryDeps>(
  "HttpSecurityGetaway",
  (deps) => {
    let userRepository: IUserRepository | null = null;
    let tokenRepository: ITokenRepository | null = null;

    if (isUserRepository(deps[UserRepositorySymbol]))
      userRepository = deps[UserRepositorySymbol] as IUserRepository;
    if (isTokenRepository(deps[TokenRepositorySymbol])) tokenRepository = deps[TokenRepositorySymbol];

    return {
      findUserByUsername:
        userRepository?.findByUsername.bind(userRepository) ??  (async () => null),
      blockToken: tokenRepository?.blockToken.bind(tokenRepository) ?? (async () => false),
      isTokenBlocked: tokenRepository?.isBlocked.bind(tokenRepository) ?? (async () => 0),
    };
  },
  Metadata.from({
    binding: SecurityRepositorySymbol,
    type: 'provider',
    scope: 'singleton',
    eager: true,
    inject: [UserRepositorySymbol, TokenRepositorySymbol],
  })
);

const HttpSecurityGetawayEmpty: ISecurityGetaway = {
  findUserByUsername: async () => null,
  blockToken: async () => false,
  isTokenBlocked: async () => 0,
};

export { HttpSecurityGetaway, SecurityRepositorySymbol, HttpSecurityGetawayEmpty };
