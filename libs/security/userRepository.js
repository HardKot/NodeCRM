import { Component } from '../core/index.js';
const UserRepositorySymbol = Symbol();
function isUserRepository(obj) {
    return typeof obj.findByUsername === 'function';
}
class UserRepositorySimple {
    users;
    constructor(users = []) {
        this.users = users;
        this.users = users;
    }
    findByUsername(username) {
        const user = this.users.find(u => u.username === username) ?? null;
        return Promise.resolve(user);
    }
}
const UserRepositorySimpleComponent = new Component('UserRepositorySimple', () => new UserRepositorySimple(), { binding: UserRepositorySymbol, type: 'provider', scope: 'singleton', eager: true });

export { UserRepositorySimpleComponent };
export { UserRepositorySymbol };
export { isUserRepository };