import { z } from 'zod';

export const LogInSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .meta({ id: 'LogIn', description: 'Credentials to start a session' });

export type LogIn = z.infer<typeof LogInSchema>;

export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
  })
  .meta({ id: 'User', description: 'A registered user' });

export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z
  .object({
    user: UserSchema,
  })
  .meta({ id: 'Session', description: 'The active session' });

export type Session = z.infer<typeof SessionSchema>;
