const { VPNApi, PakasirApi } = require('../utils/api');
const { generateQRCodeBuffer } = require('../utils/qrcode');

const userSessions = new Map();
const paymentCheckers = new Map();
const ITEMS_PER_PAGE = 5;

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const message = `
🤖 *Selamat Datang di VPN Bot!*

Pilih menu di bawah ini:
  `.trim();
  
  const keyboard = [
    [
      { text: '🌐 Lihat Server', callback_data: 'menu_servers' },
      { text: '🛒 Beli VPN', callback_data: 'menu_buy' }
    ],
    [
      { text: '❓ Bantuan', callback_data: 'menu_help' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function handleServers(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const api = new VPNApi();
    const result = await api.getServers();
    
    if (result.success && result.data.length > 0) {
      await showServersPage(bot, chatId, result.data, 0);
    } else {
      await bot.sendMessage(chatId, '❌ Tidak ada server tersedia');
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

async function showServersPage(bot, chatId, servers, page, messageId = null) {
  const totalPages = Math.ceil(servers.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageServers = servers.slice(start, end);
  
  let message = '🌐 *Daftar Server VPN*\n';
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  pageServers.forEach((server, index) => {
    const price = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(server.price);
    
    const status = server.is_available ? '🟢' : '🔴';
    const num = start + index + 1;
    
    message += `${num}. ${status} *${server.name}*\n`;
    message += `   📍 ${server.location}\n`;
    message += `   🔧 ${server.type}\n`;
    message += `   💰 ${price}/bulan\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📄 Halaman ${page + 1}/${totalPages} • Total: ${servers.length} server`;
  
  const keyboard = [];
  const navButtons = [];
  
  if (page > 0) {
    navButtons.push({ text: '⬅️ Sebelumnya', callback_data: `servers_page_${page - 1}` });
  }
  
  if (page < totalPages - 1) {
    navButtons.push({ text: 'Selanjutnya ➡️', callback_data: `servers_page_${page + 1}` });
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  keyboard.push([
    { text: '🛒 Beli VPN', callback_data: 'menu_buy' },
    { text: '🏠 Menu Utama', callback_data: 'menu_main' }
  ]);
  
  const options = {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  };
  
  if (messageId) {
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      ...options
    });
  } else {
    await bot.sendMessage(chatId, message, options);
  }
}

async function handleBuy(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    const api = new VPNApi();
    const result = await api.getServers();
    
    if (result.success && result.data.length > 0) {
      const availableServers = result.data.filter(s => s.is_available);
      
      if (availableServers.length === 0) {
        await bot.sendMessage(chatId, '❌ Tidak ada server tersedia saat ini');
        return;
      }
      
      await showBuyPage(bot, chatId, availableServers, 0);
    } else {
      await bot.sendMessage(chatId, '❌ Tidak ada server tersedia');
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

async function showBuyPage(bot, chatId, servers, page, messageId = null) {
  const totalPages = Math.ceil(servers.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageServers = servers.slice(start, end);
  
  let message = '🛒 *Pilih Server VPN*\n';
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  pageServers.forEach((server, index) => {
    const price = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(server.price);
    
    const num = start + index + 1;
    message += `${num}. *${server.name}*\n`;
    message += `   📍 ${server.location} • 🔧 ${server.type}\n`;
    message += `   💰 ${price}/bulan\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📄 Halaman ${page + 1}/${totalPages}`;
  
  const keyboard = [];
  
  // Server buttons
  pageServers.forEach((server, index) => {
    const num = start + index + 1;
    keyboard.push([{
      text: `${num}. ${server.name} - ${server.location}`,
      callback_data: `select_server_${server.id}_${server.type}_${page}`
    }]);
  });
  
  // Navigation buttons
  const navButtons = [];
  if (page > 0) {
    navButtons.push({ text: '⬅️ Sebelumnya', callback_data: `buy_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navButtons.push({ text: 'Selanjutnya ➡️', callback_data: `buy_page_${page + 1}` });
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  keyboard.push([
    { text: '❌ Batal', callback_data: 'cancel_buy' },
    { text: '🏠 Menu Utama', callback_data: 'menu_main' }
  ]);
  
  const options = {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  };
  
  if (messageId) {
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      ...options
    });
  } else {
    await bot.sendMessage(chatId, message, options);
  }
}

async function handleCallback(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  
  try {
    // Menu navigation
    if (data === 'menu_main') {
      await bot.deleteMessage(chatId, messageId);
      await handleStart(bot, { chat: { id: chatId } });
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'menu_servers') {
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        await bot.deleteMessage(chatId, messageId);
        await showServersPage(bot, chatId, result.data, 0);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'menu_buy') {
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await bot.deleteMessage(chatId, messageId);
        await showBuyPage(bot, chatId, availableServers, 0);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'menu_help') {
      await bot.deleteMessage(chatId, messageId);
      await handleHelp(bot, { chat: { id: chatId } });
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Server list pagination
    if (data.startsWith('servers_page_')) {
      const page = parseInt(data.split('_')[2]);
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        await showServersPage(bot, chatId, result.data, page, messageId);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Buy pagination
    if (data.startsWith('buy_page_')) {
      const page = parseInt(data.split('_')[2]);
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await showBuyPage(bot, chatId, availableServers, page, messageId);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Server selection
    if (data.startsWith('select_server_')) {
      const parts = data.split('_');
      const serverId = parseInt(parts[2]);
      const serverType = parts[3];
      
      userSessions.set(chatId, {
        step: 'username',
        serverId: serverId,
        serverType: serverType,
        messageId: messageId
      });
      
      await showUsernameInput(bot, chatId, messageId);
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Username input via buttons
    if (data.startsWith('username_')) {
      const action = data.split('_')[1];
      const session = userSessions.get(chatId);
      
      if (!session) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Sesi expired, mulai lagi' });
        return;
      }
      
      if (action === 'custom') {
        session.step = 'username_text';
        userSessions.set(chatId, session);
        await bot.deleteMessage(chatId, messageId);
        await bot.sendMessage(chatId, '👤 Ketik username Anda (3-20 karakter, alphanumeric):');
      }
      
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Password input via buttons (for SSH)
    if (data.startsWith('password_')) {
      const action = data.split('_')[1];
      const session = userSessions.get(chatId);
      
      if (!session) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Sesi expired, mulai lagi' });
        return;
      }
      
      if (action === 'custom') {
        session.step = 'password_text';
        userSessions.set(chatId, session);
        await bot.deleteMessage(chatId, messageId);
        await bot.sendMessage(chatId, '🔐 Ketik password Anda (minimal 6 karakter):');
      }
      
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Duration selection
    if (data.startsWith('duration_')) {
      const parts = data.split('_');
      const duration = parseInt(parts[1]);
      const totalPrice = parseInt(parts[2]);
      const session = userSessions.get(chatId);
      
      if (session) {
        session.duration = duration;
        session.totalPrice = totalPrice;
        userSessions.set(chatId, session);
        
        await bot.deleteMessage(chatId, messageId);
        await showPaymentConfirmation(bot, chatId, session);
      }
      
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Confirm payment
    if (data === 'confirm_payment') {
      const session = userSessions.get(chatId);
      
      if (session) {
        await bot.deleteMessage(chatId, messageId);
        await generatePaymentQRIS(bot, chatId, session);
      }
      
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Cancel buy
    if (data === 'cancel_buy') {
      userSessions.delete(chatId);
      
      // Stop payment checker if exists
      if (paymentCheckers.has(chatId)) {
        clearInterval(paymentCheckers.get(chatId));
        paymentCheckers.delete(chatId);
      }
      
      await bot.deleteMessage(chatId, messageId);
      await bot.sendMessage(chatId, '❌ Pembelian dibatalkan');
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan' });
  }
}

async function showUsernameInput(bot, chatId, messageId) {
  const message = '👤 *Masukkan Username*\n\n📝 Ketik username Anda secara manual';
  
  const keyboard = [
    [{ text: '✏️ Ketik Username Manual', callback_data: 'username_custom' }],
    [
      { text: '❌ Batal', callback_data: 'cancel_buy' },
      { text: '🏠 Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function showPasswordInput(bot, chatId, messageId) {
  const message = '🔐 *Masukkan Password*\n\n📝 Ketik password Anda secara manual (minimal 6 karakter)';
  
  const keyboard = [
    [{ text: '✏️ Ketik Password Manual', callback_data: 'password_custom' }],
    [
      { text: '❌ Batal', callback_data: 'cancel_buy' },
      { text: '🏠 Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const session = userSessions.get(chatId);
  
  if (!session) return;
  
  if (session.step === 'username' || session.step === 'username_text') {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(text)) {
      await bot.sendMessage(chatId, '❌ Username tidak valid. Gunakan 3-20 karakter alphanumeric.\n\nCoba lagi:');
      return;
    }
    
    session.username = text;
    
    if (session.serverType === 'SSH') {
      session.step = 'password';
      const sentMsg = await bot.sendMessage(chatId, '🔐 Ketik password Anda (minimal 6 karakter):');
      session.messageId = sentMsg.message_id;
    } else {
      session.step = 'duration';
      await askDuration(bot, chatId);
    }
    
    userSessions.set(chatId, session);
  } else if (session.step === 'password' || session.step === 'password_text') {
    if (text.length < 6) {
      await bot.sendMessage(chatId, '❌ Password minimal 6 karakter.\n\nCoba lagi:');
      return;
    }
    
    session.password = text;
    session.step = 'duration';
    await askDuration(bot, chatId);
    userSessions.set(chatId, session);
  }
}

async function askDuration(bot, chatId) {
  const session = userSessions.get(chatId);
  const api = new VPNApi();
  const serversResult = await api.getServers();
  
  if (!serversResult.success) {
    await bot.sendMessage(chatId, '❌ Gagal mengambil data server');
    return;
  }
  
  const server = serversResult.data.find(s => s.id === session.serverId);
  if (!server) {
    await bot.sendMessage(chatId, '❌ Server tidak ditemukan');
    return;
  }
  
  const pricePerMonth = server.price;
  
  const keyboard = [];
  for (let i = 1; i <= 12; i++) {
    const totalPrice = pricePerMonth * i;
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(totalPrice);
    
    keyboard.push([{
      text: `${i} Bulan - ${formattedPrice}`,
      callback_data: `duration_${i}_${totalPrice}`
    }]);
  }
  
  keyboard.push([
    { text: '❌ Batal', callback_data: 'cancel_buy' },
    { text: '🏠 Menu Utama', callback_data: 'menu_main' }
  ]);
  
  let message = '📅 *Pilih Durasi Berlangganan*\n\n';
  message += `🌐 Server: ${server.name}\n`;
  message += `👤 Username: ${session.username}\n`;
  if (session.password) {
    message += `🔐 Password: ${session.password}\n`;
  }
  message += `\n💰 Harga: ${new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(pricePerMonth)}/bulan`;
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function showPaymentConfirmation(bot, chatId, session) {
  const api = new VPNApi();
  const serversResult = await api.getServers();
  
  if (!serversResult.success) {
    await bot.sendMessage(chatId, '❌ Gagal mengambil data server');
    return;
  }
  
  const server = serversResult.data.find(s => s.id === session.serverId);
  if (!server) {
    await bot.sendMessage(chatId, '❌ Server tidak ditemukan');
    return;
  }
  
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(session.totalPrice);
  
  let message = '📋 *Konfirmasi Pembelian*\n';
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🌐 *Server:* ${server.name}\n`;
  message += `📍 *Lokasi:* ${server.location}\n`;
  message += `👤 *Username:* ${session.username}\n`;
  if (session.password) {
    message += `🔐 *Password:* ${session.password}\n`;
  }
  message += `📅 *Durasi:* ${session.duration} bulan\n\n`;
  message += `💰 *Total Pembayaran:* ${formattedPrice}`;
  
  const keyboard = [
    [{ text: '✅ Lanjut Bayar', callback_data: 'confirm_payment' }],
    [
      { text: '❌ Batal', callback_data: 'cancel_buy' },
      { text: '🏠 Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function generatePaymentQRIS(bot, chatId, session) {
  try {
    const loadingMsg = await bot.sendMessage(chatId, '⏳ Membuat pembayaran QRIS...');
    
    const orderId = `VPN${Date.now()}${chatId}`;
    session.orderId = orderId;
    userSessions.set(chatId, session);
    
    const pakasir = new PakasirApi();
    const result = await pakasir.createQRIS(orderId, session.totalPrice);
    
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (!result.success) {
      await bot.sendMessage(chatId, `❌ Gagal membuat pembayaran: ${result.message}`);
      return;
    }
    
    const payment = result.data;
    const qrBuffer = await generateQRCodeBuffer(payment.payment_number);
    
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(payment.total_payment);
    
    const expiredDate = new Date(payment.expired_at);
    const expiredStr = expiredDate.toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    let message = '💳 *Pembayaran QRIS*\n';
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💰 *Total:* ${formattedAmount}\n`;
    message += `🆔 *Order ID:* \`${orderId}\`\n`;
    message += `⏰ *Expired:* ${expiredStr}\n\n`;
    message += `📱 Scan QR code di bawah dengan aplikasi pembayaran Anda\n\n`;
    message += `⚠️ Jangan tutup chat ini, pembayaran akan diproses otomatis`;
    
    await bot.sendPhoto(chatId, qrBuffer, {
      caption: message,
      parse_mode: 'Markdown'
    });
    
    // Start payment checker
    startPaymentChecker(bot, chatId, orderId, payment.total_payment, session);
    
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

function startPaymentChecker(bot, chatId, orderId, amount, session) {
  // Clear existing checker if any
  if (paymentCheckers.has(chatId)) {
    clearInterval(paymentCheckers.get(chatId));
  }
  
  let checkCount = 0;
  const maxChecks = 60; // 5 minutes (60 * 5 seconds)
  
  const checker = setInterval(async () => {
    checkCount++;
    
    try {
      const pakasir = new PakasirApi();
      const result = await pakasir.checkPayment(orderId, amount);
      
      if (result.success && result.data.status === 'completed') {
        clearInterval(checker);
        paymentCheckers.delete(chatId);
        
        await bot.sendMessage(chatId, '✅ *Pembayaran Berhasil!*\n\n⏳ Sedang membuat akun VPN...', {
          parse_mode: 'Markdown'
        });
        
        await createVPNAccount(bot, chatId, session);
      } else if (checkCount >= maxChecks) {
        clearInterval(checker);
        paymentCheckers.delete(chatId);
        
        await bot.sendMessage(chatId, '⏰ *Waktu Pembayaran Habis*\n\nPembayaran Anda belum terdeteksi. Silakan coba lagi.', {
          parse_mode: 'Markdown'
        });
        
        userSessions.delete(chatId);
      }
    } catch (error) {
      console.error('Payment check error:', error);
    }
  }, 5000); // Check every 5 seconds
  
  paymentCheckers.set(chatId, checker);
}

async function createVPNAccount(bot, chatId, session) {
  try {
    const loadingMsg = await bot.sendMessage(chatId, '⏳ Memproses pembelian...\n\n⚙️ Membuat akun VPN\n📦 Menyiapkan konfigurasi');
    
    const api = new VPNApi();
    const payload = {
      server_id: session.serverId,
      username: session.username,
      duration: session.duration
    };
    
    if (session.serverType === 'SSH') {
      payload.password = session.password;
    }
    
    const result = await api.createAccount(payload);
    
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (result.success) {
      const data = result.data;
      
      // Main info message
      let message = `✅ *Akun VPN Berhasil Dibuat!*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🌐 *Server:* ${data.server.name}\n`;
      message += `📍 *Lokasi:* ${data.server.location}\n`;
      message += `🔧 *Tipe:* ${data.server.category}\n\n`;
      message += `👤 *Username:* \`${data.username}\`\n`;
      
      if (data.password) {
        message += `🔐 *Password:* \`${data.password}\`\n`;
      }
      
      if (data.uuid) {
        message += `🔑 *UUID:* \`${data.uuid}\`\n`;
      }
      
      message += `\n📅 *Dibuat:* ${data.created_at}\n`;
      message += `⏰ *Expired:* ${data.expired_at}\n`;
      
      if (data.ports && data.ports.length > 0) {
        message += `🔌 *Ports:* ${data.ports.join(', ')}\n`;
      }
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      // Additional configs
      if (data.openvpn_config) {
        await bot.sendMessage(chatId, `📄 *OpenVPN Config*\n\n${data.openvpn_config}`, { parse_mode: 'Markdown' });
      }
      
      if (data.payload) {
        let payloadMsg = '📱 *Custom Payload*\n━━━━━━━━━━━━━━━━━━━━\n\n';
        if (data.payload.cdn) {
          payloadMsg += `*CDN:*\n\`\`\`\n${data.payload.cdn}\n\`\`\`\n\n`;
        }
        if (data.payload.with_path) {
          payloadMsg += `*With Path:*\n\`\`\`\n${data.payload.with_path}\n\`\`\``;
        }
        await bot.sendMessage(chatId, payloadMsg, { parse_mode: 'Markdown' });
      }
      
      if (data.links && Object.keys(data.links).length > 0) {
        let linksMsg = '🔗 *Connection Links*\n━━━━━━━━━━━━━━━━━━━━\n\n';
        for (const [name, link] of Object.entries(data.links)) {
          linksMsg += `*${name}:*\n\`${link}\`\n\n`;
        }
        await bot.sendMessage(chatId, linksMsg, { parse_mode: 'Markdown' });
      }
      
      if (data.subscription_url) {
        await bot.sendMessage(chatId, `📡 *Subscription URL*\n\n\`${data.subscription_url}\`\n\n💡 Copy link ini ke aplikasi VPN Anda`, { parse_mode: 'Markdown' });
      }
      
      await bot.sendMessage(chatId, '✨ Terima kasih! Gunakan /start untuk menu utama.');
      
      userSessions.delete(chatId);
    } else {
      await bot.sendMessage(chatId, `❌ *Pembelian Gagal*\n\n${result.message}`, { parse_mode: 'Markdown' });
      userSessions.delete(chatId);
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ *Error*\n\n${error.message}`, { parse_mode: 'Markdown' });
    userSessions.delete(chatId);
  }
}

async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  const message = `
📖 *Bantuan Bot VPN*

*Cara Membeli:*
1. Klik 🛒 Beli VPN
2. Pilih server yang diinginkan
3. Masukkan username
4. Masukkan password (khusus SSH)
5. Pilih durasi
6. Scan QRIS untuk bayar
7. Akun otomatis dibuat setelah pembayaran

💳 Pembayaran menggunakan QRIS
⚡ Proses otomatis dan cepat
🔒 Aman dan terpercaya
  `.trim();
  
  const keyboard = [
    [
      { text: '🌐 Lihat Server', callback_data: 'menu_servers' },
      { text: '🛒 Beli VPN', callback_data: 'menu_buy' }
    ],
    [
      { text: '🏠 Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

module.exports = {
  handleStart,
  handleServers,
  handleBuy,
  handleCallback,
  handleMessage,
  handleHelp,
  showServersPage,
  showBuyPage,
  showUsernameInput,
  showPasswordInput
};
