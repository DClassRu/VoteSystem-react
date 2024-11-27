require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
});

// Получение списка кандидатов
app.get('/api/candidates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM candidates ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка кандидатов' });
  }
});

// Проверка голосования
app.get('/api/check-vote/:telegramUserId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM votes WHERE telegram_user_id = ?',
      [req.params.telegramUserId]
    );
    res.json({ hasVoted: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при проверке голоса' });
  }
});

// Голосование
app.post('/api/vote', async (req, res) => {
  const { telegramUserId, candidateId } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const [existingVote] = await connection.query(
      'SELECT * FROM votes WHERE telegram_user_id = ?',
      [telegramUserId]
    );

    if (existingVote.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Вы уже проголосовали' });
    }

    await connection.query(
      'INSERT INTO votes (telegram_user_id, candidate_id) VALUES (?, ?)',
      [telegramUserId, candidateId]
    );

    await connection.query(
      'UPDATE candidates SET votes_count = votes_count + 1 WHERE id = ?',
      [candidateId]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Ошибка при голосовании' });
  } finally {
    connection.release();
  }
});

// Получение статуса голосования
app.get('/api/voting/status', async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT status, start_time, end_time FROM voting_settings ORDER BY id DESC LIMIT 1'
    );
    
    if (!settings.length) {
      return res.json({ 
        status: 'pending',
        message: 'Голосование еще не настроено' 
      });
    }

    const status = settings[0];
    let message = '';

    switch (status.status) {
      case 'pending':
        message = 'Голосование еще не началось';
        break;
      case 'active':
        message = 'Голосование активно';
        break;
      case 'finished':
        message = 'Голосование завершено';
        break;
    }

    res.json({
      status: status.status,
      message,
      startTime: status.start_time,
      endTime: status.end_time
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении статуса голосования' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 