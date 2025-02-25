import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('authConfig', () => ({
  jwtSecret: process.env.AUTH_JWT_SECRET,
  tokenExpiration: parseInt(process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRY ?? '86400'),
  secureCookie: process.env?.AUTH_SECURE_COOKIE && process.env.AUTH_SECURE_COOKIE === 'false' ? false : true,
}));
