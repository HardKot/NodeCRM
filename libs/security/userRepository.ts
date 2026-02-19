
import { Component, Metadata } from '../core';

import type { IUserRepository, User } from './types';

const UserRepositorySymbol = Symbol();

function isUserRepository(obj: any): obj is IUserRepository {
  return typeof obj.findByUsername === 'function';
}

class UserRepositorySimple implements IUserRepository {
  constructor(private users: User[] = []) {
    this.users = users;
  }

  findByUsername(username: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username) ?? null;
    return Promise.resolve(user);
  }
}

const UserRepositorySimpleComponent = new Component<IUserRepository, object>(
  'UserRepositorySimple',
  () => new UserRepositorySimple(),
  Metadata.from({ binding: UserRepositorySymbol, type: 'provider', scope: 'singleton', eager: true })
);

export { UserRepositorySimpleComponent, UserRepositorySymbol, isUserRepository };
