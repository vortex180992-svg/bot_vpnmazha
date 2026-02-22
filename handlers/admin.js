const { VPNApi } = require('../utils/api');
const { getMarkup, formatPrice } = require('../utils/pricing');
const fs = require('fs');
const path = require('path');

async function handleCheckBalance(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, 'Mengecek saldo...');
    
    const api = new VPNApi();
    const result = await api.getProfile();
    
    if (result.success) {
      const { name, email, balance } = result.data;
      const formattedBalance = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(balance);
      
      const message = `
<b>INFORMASI SALDO</b>

<blockquote>Nama: ${name}
Email: ${email}
Saldo: ${formattedBalance}</blockquote>
      `.trim();
      
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } else {
      await bot.sendMessage(chatId, 'Gagal mengambil data saldo');
    }
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

async function handleCheckMarkup(bot, msg) {
  const chatId = msg.chat.id;
  const currentMarkup = getMarkup();
  const formattedMarkup = formatPrice(currentMarkup);
  
  const message = `
<b>INFORMASI MARKUP</b>

<blockquote>Markup Saat Ini: ${formattedMarkup}

Markup akan ditambahkan ke setiap harga server dari API.</blockquote>

Untuk mengubah markup, gunakan:
<code>/setmarkup [jumlah]</code>

Contoh: <code>/setmarkup 5000</code>
  `.trim();
  
  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleSetMarkup(bot, msg, newMarkup) {
  const chatId = msg.chat.id;
  
  if (isNaN(newMarkup) || newMarkup < 0) {
    await bot.sendMessage(chatId, 'Markup harus berupa angka positif!\n\nContoh: /setmarkup 5000');
    return;
  }
  
  try {
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('MARKUP_PRICE=')) {
      envContent = envContent.replace(/MARKUP_PRICE=\d+/, `MARKUP_PRICE=${newMarkup}`);
    } else {
      envContent += `\nMARKUP_PRICE=${newMarkup}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    const formattedMarkup = formatPrice(newMarkup);
    
    const message = `
<b>MARKUP BERHASIL DIUBAH!</b>

<blockquote>Markup Baru: ${formattedMarkup}</blockquote>

⚠️ <i>Restart bot untuk menerapkan perubahan:</i>
<code>npm start</code>
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

async function handleCheckPayment(bot, msg, orderId) {
  const chatId = msg.chat.id;
  
  if (!orderId) {
    await bot.sendMessage(chatId, 'Format: /cekpayment [order_id]\n\nContoh: /cekpayment VPN1234567890');
    return;
  }
  
  try {
    const { PakasirApi } = require('../utils/api');
    const pakasir = new PakasirApi();
    
    await bot.sendMessage(chatId, `Mengecek status pembayaran: ${orderId}...`);
    
    const result = await pakasir.checkPayment(orderId, 0);
    
    if (result.success && result.data) {
      const data = result.data;
      const formattedAmount = formatPrice(data.amount || 0);
      
      let message = '<b>STATUS PEMBAYARAN</b>\n\n';
      message += `<blockquote>Order ID: <code>${data.order_id}</code>\n`;
      message += `Amount: ${formattedAmount}\n`;
      message += `Status: ${data.status}\n`;
      message += `Payment Method: ${data.payment_method || '-'}\n`;
      if (data.completed_at) {
        message += `Completed: ${data.completed_at}</blockquote>`;
      } else {
        message += `</blockquote>`;
      }
      
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } else {
      await bot.sendMessage(chatId, `Pembayaran tidak ditemukan atau error: ${result.message}`);
    }
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

module.exports = {
  handleCheckBalance,
  handleCheckMarkup,
  handleSetMarkup,
  handleCheckPayment
};
