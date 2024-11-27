require('dotenv').config();
const crypto = require('crypto');

const generateTemporaryToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const token = process.env.ADMIN_TOKEN || generateTemporaryToken();
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('Ссылка для доступа к статистике:');
console.log(`${baseUrl}/stats.html?token=${token}`); 

//Этот скрипт когда то будет использоваться для генерации ссылки на статистику, но пока что он не нужен