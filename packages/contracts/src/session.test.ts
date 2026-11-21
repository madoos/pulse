import { describe, expect, it } from 'vitest';
import { LogInSchema, SessionSchema } from './session';

describe('LogInSchema', () => {
  it('accepts an email and a password', () => {
    expect(LogInSchema.safeParse({ email: 'ana@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });

  it('rejects an invalid email or an empty password', () => {
    expect(LogInSchema.safeParse({ email: 'ana', password: 'secret' }).success).toBe(false);
    expect(LogInSchema.safeParse({ email: 'ana@example.com', password: '' }).success).toBe(false);
  });
});

describe('SessionSchema', () => {
  it('describes the user of the session', () => {
    const session = {
      user: { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' },
    };

    expect(SessionSchema.parse(session)).toEqual(session);
  });
});
