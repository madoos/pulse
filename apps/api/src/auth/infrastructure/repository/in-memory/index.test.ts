import { describe, expect, it } from 'vitest';
import { createInMemorySessionRepository, createInMemoryUserRepository } from '.';

describe('in-memory user and session repositories', () => {
  it('creates and finds users, with a unique email', async () => {
    const users = createInMemoryUserRepository();

    const ana = await users.create({ email: 'ana@example.com', passwordHash: 'hash' });

    expect(ana).toEqual({ id: expect.any(String), email: 'ana@example.com', passwordHash: 'hash' });
    expect(await users.findByEmail('ana@example.com')).toEqual(ana);
    expect(await users.findById(ana.id)).toEqual(ana);
    expect(await users.findByEmail('nobody@example.com')).toBeNull();
    await expect(users.create({ email: 'ana@example.com', passwordHash: 'x' })).rejects.toThrow();
  });

  it('creates, finds and revokes sessions', async () => {
    const sessions = createInMemorySessionRepository();
    const expiresAt = new Date('2026-11-21T18:00:00Z');

    const session = await sessions.create({ userId: 'user-1', expiresAt });

    expect(session).toEqual({
      id: expect.any(String),
      userId: 'user-1',
      expiresAt,
      revokedAt: null,
    });
    expect(await sessions.findById(session.id)).toEqual(session);

    const revokedAt = new Date('2026-11-21T12:00:00Z');
    await sessions.revoke(session.id, revokedAt);

    expect((await sessions.findById(session.id))?.revokedAt).toEqual(revokedAt);
  });
});
