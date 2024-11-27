# Система голосования в Telegram

Веб-приложение для проведения голосований через Telegram Mini App.
## Возможности

- Голосование за кандидатов через Telegram
- Административная панель через Telegram бота
- Статистика голосования в реальном времени
- Автоматическое начало и завершение голосования по расписанию
- Защита от повторного голосования
- Анимированный интерфейс с визуальной обратной связью

![Screenshot](https://i.imgur.com/ycdCE9s.png "Screenshot")
## Что использовалось

### Frontend
- React
- Vite
- Chart.js
- Lottie для анимаций
- Canvas Confetti для визуальных эффектов

### Backend
- Node.js
- Express
- MySQL
- Telegraf

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/DClassRu/VoteSystem-react.git
```
2. Установите зависимости:
#### В корневой директории
```bash
npm install
```
#### В директории frontend
```bash
cd frontend
npm install
```
#### В директории backend
```bash
cd backend
npm install
```


3. Создайте базу данных MySQL и импортируйте схему:
```bash
mysql -u root -p < database.sql
```

4. Настройте переменные окружения:
- Переименуйте `.env copy` в `.env`
- Заполните необходимые переменные:
  - `DB_HOST` - хост базы данных
  - `DB_USER` - пользователь базы данных
  - `DB_PASSWORD` - пароль базы данных
  - `DB_NAME` - имя базы данных
  - `BOT_TOKEN` - токен Telegram бота
  - `WEBAPP_URL` - URL веб-приложения
  - `FRONTEND_URL` - URL фронтенда

## Запуск
#### Фронтенд
```bash
cd frontend
npm run dev
```
#### Бэкэнд
```bash
cd backend
npm run dev
```
#### Telegram бот
```bash
cd backend
npm run bot
```


## Лицензия
MIT
