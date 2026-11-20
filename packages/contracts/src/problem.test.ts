import { describe, expect, it } from 'vitest';
import { ProblemSchema } from './problem';

describe('ProblemSchema', () => {
  it('accepts an RFC 9457 problem', () => {
    const problem = {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: '/advisory-firms/999',
    };

    expect(ProblemSchema.parse(problem)).toEqual(problem);
  });

  it('rejects a status code that is not an error', () => {
    expect(ProblemSchema.safeParse({ type: 'about:blank', title: 'OK', status: 200 }).success).toBe(
      false,
    );
  });

  it('rejects a problem without a title', () => {
    expect(ProblemSchema.safeParse({ type: 'about:blank', status: 500 }).success).toBe(false);
  });
});
