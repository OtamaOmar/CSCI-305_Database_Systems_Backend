require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./db/connection');

async function fixPasswords() {
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);
  await db.query('UPDATE users SET password = ?', [hash]);
  console.log('All user passwords updated to: password123');
  process.exit(0);
}

fixPasswords().catch(err => { console.error(err); process.exit(1); });
