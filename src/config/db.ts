import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error(
    'Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME'
  );
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
  multipleStatements: false,
  enableKeepAlive: true,
});

export default pool;
