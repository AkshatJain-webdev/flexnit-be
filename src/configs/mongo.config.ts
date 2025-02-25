import { registerAs } from '@nestjs/config';

export const mongoConfig = registerAs('mongoConfig', () => ({
  mongoBaseUri: process.env.MONGO_BASE_URI ?? 'mongodb://localhost:27017',
  mongoDatabase: process.env.MONGO_DB ?? 'flexnit',
  mongoUser: process.env.MONGO_USER,
  mongoPassword: process.env.MONGO_PASSWORD,
}));
