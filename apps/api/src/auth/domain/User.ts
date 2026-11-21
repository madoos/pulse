export type User = {
  id: string;
  email: string;
  passwordHash: string;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
