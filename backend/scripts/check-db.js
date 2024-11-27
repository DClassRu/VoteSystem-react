const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Successfully connected to database');

    // Проверка таблиц
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Available tables:', tables);

    // Проверка кандидатов
    const [candidates] = await connection.query('SELECT * FROM candidates');
    console.log('Candidates in database:', candidates);

    await connection.end();
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase(); 