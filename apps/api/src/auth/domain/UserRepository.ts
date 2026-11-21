import type { User } from './User';

export type UserRepository = {
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  create: (user: Omit<User, 'id'>) => Promise<User>;
};
