const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const adminHandler = require('./handlers/admin');
const userHandler = require('./handlers/user');

const bot = new TelegramBot(config.telegram.token, { polling: true });

function isAdmin(userId) {
  return config.telegram.adminIds.includes(userId);
}

bot.onText(/\/start/, (msg) => {
  userHandler.handleStart(bot, msg);
});

bot.onText(/\/help/, (msg) => {
  userHandler.handleHelp(bot, msg);
});

bot.onText(/\/saldo/, (msg) => {
  if (isAdmin(msg.from.id)) {
    adminHandler.handleCheckBalance(bot, msg);
  } else {
    bot.sendMessage(msg.chat.id, 'Perintah ini hanya untuk admin.');
  }
});

bot.onText(/\/markup/, (msg) => {
  if (isAdmin(msg.from.id)) {
    adminHandler.handleCheckMarkup(bot, msg);
  } else {
    bot.sendMessage(msg.chat.id, 'Perintah ini hanya untuk admin.');
  }
});

bot.onText(/\/setmarkup (.+)/, (msg, match) => {
  if (isAdmin(msg.from.id)) {
    const newMarkup = parseInt(match[1]);
    adminHandler.handleSetMarkup(bot, msg, newMarkup);
  } else {
    bot.sendMessage(msg.chat.id, 'Perintah ini hanya untuk admin.');
  }
});

bot.onText(/\/cekpayment (.+)/, (msg, match) => {
  if (isAdmin(msg.from.id)) {
    const orderId = match[1];
    adminHandler.handleCheckPayment(bot, msg, orderId);
  } else {
    bot.sendMessage(msg.chat.id, 'Perintah ini hanya untuk admin.');
  }
});

bot.onText(/\/admin/, (msg) => {
  if (isAdmin(msg.from.id)) {
    const message = `
<b>MENU ADMIN</b>

/saldo - Cek saldo akun
/markup - Cek markup saat ini
/setmarkup [jumlah] - Set markup harga
/cekpayment [order_id] - Cek status pembayaran

<i>Bot ini menggunakan API PRASS VPN untuk manajemen akun VPN.</i>
    `.trim();
    
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(msg.chat.id, 'Anda bukan admin.');
  }
});

bot.on('callback_query', (query) => {
  userHandler.handleCallback(bot, query);
});

bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  userHandler.handleMessage(bot, msg);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 VPN Bot is running!');
