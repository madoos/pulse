import { scryptPasswordHasher } from '@auth/infrastructure/crypto';
import { createInMemoryUserRepository } from '@auth/infrastructure/repository/in-memory';
import { describe, expect, it } from 'vitest';
import { makeCreateUser } from '.';

const setUp = () => {
  const users = createInMemoryUserRepository();
  return { users, createUser: makeCreateUser({ users, hasher: scryptPasswordHasher }) };
};

describe('createUser', () => {
  it('stores the normalised email and a hash of the password, never the password', async () => {
    const { users, createUser } = setUp();

    const user = await createUser(' Ana@Example.com ', 'correct horse battery');

    expect(user).toEqual({ id: expect.any(String), email: 'ana@example.com' });
    const stored = await users.findById(user.id);
    expect(stored?.passwordHash).not.toContain('correct horse battery');
    expect(await scryptPasswordHasher.verify('correct horse battery', stored!.passwordHash)).toBe(
      true,
    );
  });

  it('rejects a short password', async () => {
    await expect(setUp().createUser('ana@example.com', 'short')).rejects.toThrow('at least 12');
  });

  it('rejects an email that is already registered', async () => {
    const { createUser } = setUp();
    await createUser('ana@example.com', 'correct horse battery');

    await expect(createUser('ANA@example.com', 'another long password')).rejects.toThrow('exists');
  });
});
