import { Session } from './session';

export interface User {
  username: string;
  roles: string[];
  permissions: string[];
}

export interface IUserRepository {
  findByUsername: (username: string) => Promise<User | null>;
}

export interface AccessFunction {
  (session: Session): Promise<boolean> | boolean;
}
