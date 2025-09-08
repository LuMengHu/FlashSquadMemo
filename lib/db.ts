// lib/db.ts

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// process.env.DATABASE_URL 来自于我们之前从 Vercel 拉取的 .env.development.local 文件
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
