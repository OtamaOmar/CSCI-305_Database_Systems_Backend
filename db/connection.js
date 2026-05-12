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
});

const db = pool.promise();

const testConnection = async () => {
  try {
    const conn = await db.getConnection();
    conn.release();
  } catch (err) {
    throw err;
  }
};

module.exports = { db, testConnection };
