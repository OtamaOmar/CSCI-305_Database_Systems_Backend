require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL server');

  const sanitizedSchema = schema
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('--');
    })
    .join('\n');

  const resetTables = process.env.DB_RESET === 'true';

  const tableNames = Array.from(
    new Set(
      Array.from(sanitizedSchema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([`"]?)(\w+)\1/gi)).map(match => match[2])
    )
  );

  const preStatements = [];
  if (resetTables && tableNames.length > 0) {
    console.log('Resetting tables (this will delete existing data).');
    preStatements.push('SET FOREIGN_KEY_CHECKS = 0');
    preStatements.push(`DROP TABLE IF EXISTS ${tableNames.map(name => `\`${name}\``).join(', ')}`);
    preStatements.push('SET FOREIGN_KEY_CHECKS = 1');
  }

  // Split schema into individual statements and execute them
  const statements = [
    ...preStatements,
    ...sanitizedSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .filter(stmt => {
        const upper = stmt.toUpperCase();
        return !upper.startsWith('DROP DATABASE') && !upper.startsWith('CREATE DATABASE') && !upper.startsWith('USE ');
      })
  ];

  let executedCount = 0;

  const executeStatement = (index) => {
    if (index >= statements.length) {
      console.log(`✓ Database tables initialized successfully! All ${executedCount} statements executed.`);
      connection.end();
      process.exit(0);
    }

    connection.query(statements[index], (err) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err.message);
        connection.end();
        process.exit(1);
      }
      executedCount++;
      console.log(`✓ Statement ${index + 1}/${statements.length} executed`);
      executeStatement(index + 1);
    });
  };

  executeStatement(0);
});
