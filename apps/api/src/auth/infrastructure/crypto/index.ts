import type { PasswordHasher } from '@auth/domain/PasswordHasher';
import type { TokenSigner } from '@auth/domain/TokenSigner';
import { sign, verify } from 'hono/jwt';
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 };

const derive = (password: string, salt: Buffer, options: ScryptOptions, keyLength: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keyLength, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );

export const scryptPasswordHasher: PasswordHasher = {
  hash: async (password) => {
    const salt = randomBytes(16);
    const { N, r, p, keyLength } = SCRYPT;
    const key = await derive(password, salt, { N, r, p }, keyLength);
    return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$');
  },
  verify: async (password, hash) => {
    const [scheme, N, r, p, salt, key] = hash.split('$');
    if (scheme !== 'scrypt' || !N || !r || !p || !salt || !key) return false;
    const expected = Buffer.from(key, 'base64');
    const actual = await derive(
      password,
      Buffer.from(salt, 'base64'),
      { N: Number(N), r: Number(r), p: Number(p) },
      expected.length,
    );
    return timingSafeEqual(actual, expected);
  },
};

export const createJwtTokenSigner = (secret: string): TokenSigner => ({
  sign: ({ userId, sessionId, expiresAt }) =>
    sign(
      { sub: userId, sid: sessionId, exp: Math.floor(expiresAt.getTime() / 1000) },
      secret,
      'HS256',
    ),
  verify: async (token) => {
    try {
      const payload = await verify(token, secret, 'HS256');
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || !payload.exp) {
        return null;
      }
      return {
        userId: payload.sub,
        sessionId: payload.sid,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch {
      return null;
    }
  },
});
