import { describe, expect, it } from 'vitest';
import { createJwtTokenSigner, scryptPasswordHasher } from '.';

describe('scryptPasswordHasher', () => {
  it('verifies the password it hashed and rejects any other', async () => {
    const hash = await scryptPasswordHasher.hash('correct horse');

    expect(hash).not.toContain('correct horse');
    await expect(scryptPasswordHasher.verify('correct horse', hash)).resolves.toBe(true);
    await expect(scryptPasswordHasher.verify('wrong', hash)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await scryptPasswordHasher.hash('same')).not.toBe(
      await scryptPasswordHasher.hash('same'),
    );
  });

  it('rejects a malformed hash', async () => {
    await expect(scryptPasswordHasher.verify('anything', 'not-a-hash')).resolves.toBe(false);
  });
});

describe('JWT token signer', () => {
  const secret = 'a-secret-of-at-least-thirty-two-chars';
  const signer = createJwtTokenSigner(secret);
  const claims = {
    userId: 'user-1',
    sessionId: 'session-1',
    expiresAt: new Date(Math.floor(Date.now() / 1000 + 3600) * 1000),
  };

  it('verifies the claims it signed', async () => {
    await expect(signer.verify(await signer.sign(claims))).resolves.toEqual(claims);
  });

  it('rejects a token signed with another secret', async () => {
    const other = createJwtTokenSigner('another-secret-of-at-least-32-chars!');

    await expect(signer.verify(await other.sign(claims))).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const expired = { ...claims, expiresAt: new Date(Date.now() - 1000) };

    await expect(signer.verify(await signer.sign(expired))).resolves.toBeNull();
  });
});
