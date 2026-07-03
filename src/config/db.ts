import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,           // ✅ keeps TCP connection alive
  keepAliveInitialDelay: 0         // ✅ start keep‑alive immediately
});

// Test the connection on boot
pool.getConnection()
  .then((conn) => {
    console.log('Connected to MySQL Database: De Kuchney Villa Hotel Storage active.');
    conn.release();
  })
  .catch((err) => {
    console.error('Database connection error failed:', err.message);
  });

export default pool;