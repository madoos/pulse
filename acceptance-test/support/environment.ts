/** Where the system under test runs: Docker Compose by default, with the demo user of the seeds. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
export const API_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';
export const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://pulse:pulse@localhost:5432/pulse';
export const USER = {
  email: process.env.ACCEPTANCE_USER_EMAIL ?? 'admin@pulse.com',
  password: process.env.ACCEPTANCE_USER_PASSWORD ?? 'pulse-demo-password',
};
