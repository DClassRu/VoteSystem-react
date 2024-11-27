const { Telegraf, Markup } = require('telegraf');
const mysql = require('mysql2/promise');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
});

const adminStates = new Map();

const isAdmin = async (ctx, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE telegram_id = ?',
      [ctx.from.id]
    );
    if (rows.length > 0) {
      return next();
    }
    ctx.reply('У вас нет доступа к этой команде.');
  } catch (error) {
    console.error('Error checking admin:', error);
    ctx.reply('Произошла ошибка при проверке прав доступа.');
  }
};

// Команда start
bot.command('start', async (ctx) => {
  try {
    const [settings] = await pool.query('SELECT * FROM voting_settings ORDER BY id DESC LIMIT 1');
    const votingStatus = settings[0]?.status || 'pending';
    
    let message = '';
    let keyboard;

    switch (votingStatus) {
      case 'pending':
        message = 'Голосование еще не началось. Ожидайте начала!';
        keyboard = Markup.inlineKeyboard([]);
        break;
      case 'active':
        message = 'Добро пожаловать в систему голосования!';
        console.log('WEBAPP_URL:', process.env.WEBAPP_URL);
        
        if (!process.env.WEBAPP_URL) {
          message += '\nОшибка: URL веб-приложения не настроен';
          keyboard = Markup.inlineKeyboard([]);
        } else {
          keyboard = Markup.inlineKeyboard([
            [{ text: 'Открыть голосование', web_app: { url: process.env.WEBAPP_URL } }]
          ]);
        }
        break;
      case 'finished':
        message = 'Голосование завершено. Спасибо за участие!';
        keyboard = Markup.inlineKeyboard([]);
        break;
    }

    ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

// Админская панель
bot.command('admin', isAdmin, (ctx) => {
  ctx.reply('Панель управления', Markup.keyboard([
    ['👥 Управление кандидатами'],
    ['📊 Статус голосования', '🕒 Установить время'],
    ['▶️ Начать досрочно', '⏹ Завершить досрочно'],
    ['📈 Статистика']
  ]).resize());
});

// Управление кандидатами
bot.hears('👥 Управление кандидатами', isAdmin, async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Добавить кандидата', 'add_candidate')],
    [Markup.button.callback('Список кандидатов', 'list_candidates')],
    [Markup.button.callback('Удалить кандидата', 'remove_candidate')]
  ]);
  ctx.reply('Выберите действие:', keyboard);
});

// Добавление кандидата
bot.action('add_candidate', isAdmin, (ctx) => {
  adminStates.set(ctx.from.id, { action: 'adding_candidate' });
  ctx.reply('Отправьте имя кандидата:');
  ctx.answerCbQuery();
});

// Обработка админских кнопок
bot.hears('📊 Статус голосования', isAdmin, async (ctx) => {
  try {
    const [settings] = await pool.query('SELECT * FROM voting_settings ORDER BY id DESC LIMIT 1');
    const status = settings[0] || { status: 'Не настроено' };
    
    let message = `Статус голосования: ${status.status}\n`;
    if (status.start_time) {
      message += `Начало: ${new Date(status.start_time).toLocaleString()}\n`;
    }
    if (status.end_time) {
      message += `Окончание: ${new Date(status.end_time).toLocaleString()}`;
    }
    
    ctx.reply(message);
  } catch (error) {
    ctx.reply('Ошибка при получении статуса');
  }
});

bot.hears('🕒 Установить время', isAdmin, (ctx) => {
  ctx.reply('Отправьте время начала и окончания в формате:\nДД.ММ.ГГГГ ЧЧ:ММ - ДД.ММ.ГГГГ ЧЧ:ММ');
});

bot.hears('▶️ Начать досрочно', isAdmin, async (ctx) => {
  try {
    await pool.query('UPDATE voting_settings SET status = "active", start_time = NOW() WHERE status = "pending"');
    ctx.reply('Голосование запущено!');
  } catch (error) {
    ctx.reply('Ошибка при запуске голосования');
  }
});

bot.hears('⏹ Завершить досрочно', isAdmin, async (ctx) => {
  try {
    await pool.query('UPDATE voting_settings SET status = "finished", end_time = NOW() WHERE status = "active"');
    ctx.reply('Голосование завершено!');
  } catch (error) {
    ctx.reply('Ошибка при завершении голосования');
  }
});

bot.hears('📈 Статистика', isAdmin, async (ctx) => {
  try {
    const [candidates] = await pool.query('SELECT name, votes_count FROM candidates ORDER BY votes_count DESC');
    const [totalVotes] = await pool.query('SELECT COUNT(*) as total FROM votes');
    
    let message = '📊 Статистика голосования:\n\n';
    candidates.forEach(candidate => {
      message += `${candidate.name}: ${candidate.votes_count} голосов\n`;
    });
    message += `\nВсего голосов: ${totalVotes[0].total}`;
    
    ctx.reply(message);
  } catch (error) {
    ctx.reply('Ошибка при получении статистики');
  }
});

// Обработка установки времени
bot.on('text', isAdmin, async (ctx) => {
  if (ctx.message.text.includes('-')) {
    try {
      const [start, end] = ctx.message.text.split('-').map(t => new Date(t.trim().split('.').reverse().join('-')));
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return ctx.reply('Неверный формат даты');
      }

      await pool.query(
        'INSERT INTO voting_settings (status, start_time, end_time) VALUES (?, ?, ?)',
        ['pending', start, end]
      );
      
      ctx.reply(`Время установлено!\nНачало: ${start.toLocaleString()}\nОкончание: ${end.toLocaleString()}`);
    } catch (error) {
      ctx.reply('Ошибка при установке времени');
    }
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('Bot started');
  
  // Проверка статуса голосования каждую минуту
  setInterval(async () => {
    try {
      const [settings] = await pool.query('SELECT * FROM voting_settings WHERE status != "finished" ORDER BY id DESC LIMIT 1');
      if (!settings.length) return;

      const setting = settings[0];
      const now = new Date();
      const startTime = new Date(setting.start_time);
      const endTime = new Date(setting.end_time);

      if (setting.status === 'pending' && now >= startTime) {
        await pool.query('UPDATE voting_settings SET status = "active" WHERE id = ?', [setting.id]);
        console.log('Voting started automatically');
      } else if (setting.status === 'active' && now >= endTime) {
        await pool.query('UPDATE voting_settings SET status = "finished" WHERE id = ?', [setting.id]);
        console.log('Voting finished automatically');
      }
    } catch (error) {
      console.error('Error in voting status check:', error);
    }
  }, 60000);
});

// Не придумал как назвать
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 