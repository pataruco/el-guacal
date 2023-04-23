import { pool } from '../db';
import logger from '../libs/logger';

beforeAll(() => {
  // set server logs silent
  logger.silent = true;
});

afterAll(async () => {
  // disconnect server from database
  await pool.end();
});
