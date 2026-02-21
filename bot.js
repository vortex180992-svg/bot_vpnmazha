const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const adminHandler = require('./handlers/admin');
const userHandler = require('./handlers/user');

const bot = new TelegramBot(config.telegram.token, { polling: true });

function isAdmin(userId) {
  return config.telegram.adminIds.includes(userId);
}

// Command handlers
bot.onText(/\/start/, (msg) => {
  userHandler.handleStart(bot, msg);
});

bot.onText(/\/servers/, (msg) => {
  userHandler.handleServers(bot, msg);
});

bot.onText(/\/buy/, (msg) => {
  userHandler.handleBuy(bot, msg);
});

bot.onText(/\/help/, (msg) => {
  userHandler.handleHelp(bot, msg);
});

// Admin commands
bot.onText(/\/saldo/, (msg) => {
  if (isAdmin(msg.from.id)) {
    adminHandler.handleCheckBalance(bot, msg);
  } else {
    bot.sendMessage(msg.chat.id, '❌ Perintah ini hanya untuk admin.');
  }
});

bot.onText(/\/admin/, (msg) => {
  if (isAdmin(msg.from.id)) {
    const message = `
🔐 *Menu Admin*

/saldo - Cek saldo akun

*Info:*
Bot ini menggunakan API PRASS VPN untuk manajemen akun VPN.
    `.trim();
    
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(msg.chat.id, '❌ Anda bukan admin.');
  }
});

// Callback query handler
bot.on('callback_query', (query) => {
  userHandler.handleCallback(bot, query);
});

// Message handler untuk input user
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  userHandler.handleMessage(bot, msg);
});

// Error handler
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Bot VPN telah aktif!');
