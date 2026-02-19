import { ITokenRepository, TokenBlockedStatus } from './types';
import { Component, Metadata } from '../core';

const TokenRepositorySymbol = Symbol();

function isTokenRepository(obj: any): obj is ITokenRepository {
  return typeof obj.blockToken === 'function' && typeof obj.isBlocked === 'function';
}

class TokenRepositorySimple implements ITokenRepository {
  private tokens: Map<string, [number, number | undefined]> = new Map();

  blockToken(params: { refreshId?: string }, options?: { life?: number }): Promise<boolean> {
    if (!params.refreshId) return Promise.resolve(false);
    this.tokens.set(params.refreshId, [1, options?.life ? Date.now() + options.life * 1000 : undefined]);
    return Promise.resolve(true);
  }

  isBlocked(params: { refreshId?: string }): Promise<TokenBlockedStatus> {
    if (!params.refreshId) return Promise.resolve(0 as TokenBlockedStatus);
    const token = this.tokens.get(params.refreshId);
    if (!token) return Promise.resolve(0 as TokenBlockedStatus);
    const [status, expiresAt] = token;

    if (expiresAt && Date.now() > expiresAt) {
      this.tokens.delete(params.refreshId);
      return Promise.resolve(-1 as TokenBlockedStatus);
    }

    return Promise.resolve(status as TokenBlockedStatus);
  }
}

const TokenRepositorySimpleComponent = new Component(
  'TokenRepositorySimple',
  () => new TokenRepositorySimple(),
  Metadata.from({
    binding: TokenRepositorySymbol,
    type: 'provider',
    scope: 'singleton',
    eager: true,
  })
)

export { TokenRepositorySimpleComponent, TokenRepositorySymbol, isTokenRepository };
