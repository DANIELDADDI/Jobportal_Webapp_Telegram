import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
});

pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
});

export const query = (text, params) => {
      return pool.query(text, params);
};

export const getClient = async () => {
      const client = await pool.connect();
      return client;
};

export default pool;