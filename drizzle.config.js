// drizzle.config.js

import 'dotenv/config';

/** @type { import("drizzle-kit").Config } */
export default {
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
