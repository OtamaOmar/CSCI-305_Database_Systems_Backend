const mysql = require('mysql2');

const pool = mysql.createPool({
  host:              process.env.DB_HOST,
  port:              process.env.DB_PORT || 3306,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  enableKeepAlive:   true,
  keepAliveInitialDelay: 0,
  connectTimeout:    30000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'PROTOCOL_ERROR') {
    console.error('Database protocol error.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ER_AUTHENTICATION_PLUGIN_ERROR') {
    console.error('Database authentication failed.');
  }
});

const db = pool.promise();

const testConnection = async () => {
  try {
    const conn = await db.getConnection();
    await conn.query('SELECT 1');
    conn.release();
  } catch (err) {
    throw err;
  }
};

module.exports = { db, testConnection };
