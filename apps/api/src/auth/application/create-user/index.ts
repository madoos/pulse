import type { PasswordHasher } from '@auth/domain/PasswordHasher';
import { normalizeEmail } from '@auth/domain/User';
import type { UserRepository } from '@auth/domain/UserRepository';

export type CreateUser = (
  email: string,
  password: string,
) => Promise<{ id: string; email: string }>;

export const MIN_PASSWORD_LENGTH = 12;

export const makeCreateUser =
  ({ users, hasher }: { users: UserRepository; hasher: PasswordHasher }): CreateUser =>
  async (email, password) => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`The password must have at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const normalized = normalizeEmail(email);
    if (await users.findByEmail(normalized)) throw new Error(`A user with ${normalized} exists`);

    const user = await users.create({
      email: normalized,
      passwordHash: await hasher.hash(password),
    });
    return { id: user.id, email: user.email };
  };
