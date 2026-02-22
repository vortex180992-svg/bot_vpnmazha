const VPNApi = require('../utils/api');

async function handleCheckBalance(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, '⏳ Mengecek saldo...');
    
    const api = new VPNApi();
    const result = await api.getProfile();
    
    if (result.success) {
      const { name, email, balance } = result.data;
      const formattedBalance = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(balance);
      
      const message = `
💰 *Informasi Saldo*

👤 Nama: ${name}
📧 Email: ${email}
💵 Saldo: ${formattedBalance}
      `.trim();
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '❌ Gagal mengambil data saldo');
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

module.exports = {
  handleCheckBalance
};
