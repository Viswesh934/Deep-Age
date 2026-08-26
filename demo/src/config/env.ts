import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: Number(process.env.DEMO_PORT) || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
};
