const { VPNApi, PakasirApi } = require('../utils/api');
const { generateQRCodeBuffer } = require('../utils/qrcode');
const { calculatePrice, formatPrice } = require('../utils/pricing');
const config = require('../config');

const userSessions = new Map();
const paymentCheckers = new Map();
const ITEMS_PER_PAGE = 5;

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || msg.chat?.first_name || 'User';
  const userId = msg.from?.id || chatId;
  const username = msg.from?.username ? `@${msg.from.username}` : 'No Username';
  
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const dateTimeStr = `${dayName}, ${date} ${monthName} ${year} – ${hours}:${minutes}:${seconds}`;
  
  const message = `
Halo <b>${userName}</b> 👋🏼
${dateTimeStr}

<b>User Info</b>
└ ID: <code>${userId}</code>
└ Username: ${username}
└ Status: Active

<b>VPN Bot Premium</b>
Fast, secure, and reliable VPN service with multiple protocols and server locations worldwide.

<i>Select an option below:</i>
  `.trim();
  
  const keyboard = [
    [
      { text: '🛒 BELI VPN', callback_data: 'menu_buy' }
    ],
    [
      { text: 'Help & Support', callback_data: 'menu_help' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
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
  
  let message = '<b>DAFTAR SERVER VPN</b>\n\n';
  
  pageServers.forEach((server, index) => {
    const finalPrice = calculatePrice(server.price);
    const price = formatPrice(finalPrice);
    
    const status = server.is_available ? 'Tersedia' : 'Tidak Tersedia';
    const num = start + index + 1;
    
    message += `<blockquote>${num}. <b>${server.name}</b>\n`;
    message += `Lokasi: ${server.location}\n`;
    message += `Tipe: ${server.type}\n`;
    message += `Harga: ${price}/bulan\n`;
    message += `Status: ${status}</blockquote>\n`;
  });
  
  message += `\nHalaman ${page + 1} dari ${totalPages} • Total ${servers.length} server`;
  
  const keyboard = [];
  const navButtons = [];
  
  if (page > 0) {
    navButtons.push({ text: '← Sebelumnya', callback_data: `servers_page_${page - 1}` });
  }
  
  if (page < totalPages - 1) {
    navButtons.push({ text: 'Selanjutnya →', callback_data: `servers_page_${page + 1}` });
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  keyboard.push([
    { text: 'Beli VPN', callback_data: 'menu_buy' },
    { text: 'Menu Utama', callback_data: 'menu_main' }
  ]);
  
  const options = {
    parse_mode: 'HTML',
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
        await bot.sendMessage(chatId, 'Tidak ada server tersedia saat ini');
        return;
      }
      
      await showServerTypeSelection(bot, chatId, availableServers);
    } else {
      await bot.sendMessage(chatId, 'Tidak ada server tersedia');
    }
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

async function showServerTypeSelection(bot, chatId, servers) {
  const types = [...new Set(servers.map(s => s.type))];
  
  if (types.length === 0) {
    await bot.sendMessage(chatId, 'Tidak ada tipe server tersedia');
    return;
  }
  
  let message = '<b>PILIH TIPE SERVER</b>\n\n';
  message += 'Pilih protokol VPN yang ingin Anda gunakan:';
  
  const keyboard = [];
  
  const typeButtons = types.map(type => {
    const count = servers.filter(s => s.type === type).length;
    return {
      text: `${type} (${count} server)`,
      callback_data: `type_${type}`
    };
  });
  
  for (let i = 0; i < typeButtons.length; i += 2) {
    if (i + 1 < typeButtons.length) {
      keyboard.push([typeButtons[i], typeButtons[i + 1]]);
    } else {
      keyboard.push([typeButtons[i]]);
    }
  }
  
  keyboard.push([
    { text: '❌ Batal', callback_data: 'cancel_buy' }
  ]);
  keyboard.push([
    { text: 'Menu Utama', callback_data: 'menu_main' }
  ]);
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function showBuyPage(bot, chatId, servers, page, messageId = null, serverType = null) {
  const filteredServers = serverType 
    ? servers.filter(s => s.type === serverType)
    : servers;
  
  const totalPages = Math.ceil(filteredServers.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageServers = filteredServers.slice(start, end);
  
  let message = '<b>PILIH SERVER VPN</b>\n';
  if (serverType) {
    message += `<i>Tipe: ${serverType}</i>\n`;
  }
  message += '\n';
  
  pageServers.forEach((server, index) => {
    const finalPrice = calculatePrice(server.price);
    const price = formatPrice(finalPrice);
    
    const num = start + index + 1;
    message += `<blockquote>${num}. <b>${server.name}</b>\n`;
    message += `${server.location} • ${server.type}\n`;
    message += `${price}/bulan</blockquote>\n`;
  });
  
  message += `\nHalaman ${page + 1} dari ${totalPages}`;
  
  const keyboard = [];
  
  pageServers.forEach((server, index) => {
    const num = start + index + 1;
    keyboard.push([{
      text: `${num}. ${server.name} - ${server.location}`,
      callback_data: `select_server_${server.id}_${server.type}_${page}_${serverType || 'all'}`
    }]);
  });
  
  const navButtons = [];
  if (page > 0) {
    navButtons.push({ text: '← Sebelumnya', callback_data: `buy_page_${page - 1}_${serverType || 'all'}` });
  }
  if (page < totalPages - 1) {
    navButtons.push({ text: 'Selanjutnya →', callback_data: `buy_page_${page + 1}_${serverType || 'all'}` });
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  
  keyboard.push([
    { text: 'Batal', callback_data: 'cancel_buy' },
    { text: 'Menu Utama', callback_data: 'menu_main' }
  ]);
  
  const options = {
    parse_mode: 'HTML',
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
    if (data === 'menu_main') {
      await bot.deleteMessage(chatId, messageId);
      await handleStart(bot, { chat: { id: chatId } });
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'menu_buy') {
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await bot.deleteMessage(chatId, messageId);
        await showServerTypeSelection(bot, chatId, availableServers);
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
    
    if (data.startsWith('buy_page_')) {
      const parts = data.split('_');
      const page = parseInt(parts[2]);
      const serverType = parts[3] !== 'all' ? parts[3] : null;
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await showBuyPage(bot, chatId, availableServers, page, messageId, serverType);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data.startsWith('type_')) {
      const serverType = data.substring(5);
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await bot.deleteMessage(chatId, messageId);
        await showBuyPage(bot, chatId, availableServers, 0, null, serverType);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'back_to_types') {
      const api = new VPNApi();
      const result = await api.getServers();
      
      if (result.success) {
        const availableServers = result.data.filter(s => s.is_available);
        await bot.deleteMessage(chatId, messageId);
        await showServerTypeSelection(bot, chatId, availableServers);
      }
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
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
    
    if (data === 'confirm_payment') {
      const session = userSessions.get(chatId);
      
      if (session) {
        await bot.deleteMessage(chatId, messageId);
        await generatePaymentQRIS(bot, chatId, session);
      }
      
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
    if (data === 'cancel_buy') {
      userSessions.delete(chatId);
      
      if (paymentCheckers.has(chatId)) {
        clearInterval(paymentCheckers.get(chatId));
        paymentCheckers.delete(chatId);
      }
      
      await bot.deleteMessage(chatId, messageId);
      await bot.sendMessage(chatId, 'Pembelian dibatalkan');
      await bot.answerCallbackQuery(query.id);
      return;
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan' });
  }
}

async function showUsernameInput(bot, chatId, messageId) {
  const message = '<b>MASUKKAN USERNAME</b>\n\nKetik username Anda secara manual';
  
  const keyboard = [
    [{ text: 'Ketik Username', callback_data: 'username_custom' }],
    [
      { text: 'Batal', callback_data: 'cancel_buy' },
      { text: 'Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function showPasswordInput(bot, chatId, messageId) {
  const message = '<b>MASUKKAN PASSWORD</b>\n\nKetik password Anda secara manual (minimal 6 karakter)';
  
  const keyboard = [
    [{ text: 'Ketik Password', callback_data: 'password_custom' }],
    [
      { text: 'Batal', callback_data: 'cancel_buy' },
      { text: 'Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'HTML',
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
      await bot.sendMessage(chatId, 'Username tidak valid. Gunakan 3-20 karakter alfanumerik.\n\nCoba lagi:');
      return;
    }
    
    session.username = text;
    
    if (session.serverType === 'SSH') {
      session.step = 'password';
      const sentMsg = await bot.sendMessage(chatId, 'Ketik password Anda (minimal 6 karakter):');
      session.messageId = sentMsg.message_id;
    } else {
      session.step = 'duration';
      await askDuration(bot, chatId);
    }
    
    userSessions.set(chatId, session);
  } else if (session.step === 'password' || session.step === 'password_text') {
    if (text.length < 6) {
      await bot.sendMessage(chatId, 'Password minimal 6 karakter.\n\nCoba lagi:');
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
    await bot.sendMessage(chatId, 'Gagal mengambil data server');
    return;
  }
  
  const server = serversResult.data.find(s => s.id === session.serverId);
  if (!server) {
    await bot.sendMessage(chatId, 'Server tidak ditemukan');
    return;
  }
  
  const pricePerMonth = calculatePrice(server.price);
  
  const keyboard = [];
  for (let i = 1; i <= 12; i++) {
    const totalPrice = pricePerMonth * i;
    const formattedPrice = formatPrice(totalPrice);
    
    keyboard.push([{
      text: `${i} Bulan - ${formattedPrice}`,
      callback_data: `duration_${i}_${totalPrice}`
    }]);
  }
  
  keyboard.push([
    { text: 'Batal', callback_data: 'cancel_buy' },
    { text: 'Menu Utama', callback_data: 'menu_main' }
  ]);
  
  let message = '<b>PILIH DURASI BERLANGGANAN</b>\n\n';
  message += `<blockquote>Server: ${server.name}\n`;
  message += `Username: ${session.username}\n`;
  
  if (session.serverType === 'SSH' && session.password) {
    message += `Password: ${session.password}\n`;
  } else {
    message += `UUID: Auto-generated\n`;
  }
  
  message += `\nHarga: ${formatPrice(pricePerMonth)}/bulan</blockquote>`;
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function showPaymentConfirmation(bot, chatId, session) {
  const api = new VPNApi();
  const serversResult = await api.getServers();
  
  if (!serversResult.success) {
    await bot.sendMessage(chatId, 'Gagal mengambil data server');
    return;
  }
  
  const server = serversResult.data.find(s => s.id === session.serverId);
  if (!server) {
    await bot.sendMessage(chatId, 'Server tidak ditemukan');
    return;
  }
  
  const formattedPrice = formatPrice(session.totalPrice);
  
  let message = '<b>KONFIRMASI PEMBELIAN</b>\n\n';
  message += `<blockquote>Server: ${server.name}\n`;
  message += `Lokasi: ${server.location}\n`;
  message += `Username: ${session.username}\n`;
  
  if (session.serverType === 'SSH' && session.password) {
    message += `Password: ${session.password}\n`;
  } else {
    message += `UUID: Auto-generated\n`;
  }
  
  message += `Durasi: ${session.duration} bulan\n\n`;
  message += `Total Pembayaran: ${formattedPrice}</blockquote>`;
  
  const keyboard = [
    [{ text: 'Lanjut Bayar', callback_data: 'confirm_payment' }],
    [
      { text: 'Batal', callback_data: 'cancel_buy' },
      { text: 'Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function generatePaymentQRIS(bot, chatId, session) {
  try {
    const loadingMsg = await bot.sendMessage(chatId, 'Membuat pembayaran QRIS...');
    
    const orderId = `VPN${Date.now()}${chatId}`;
    session.orderId = orderId;
    session.originalAmount = session.totalPrice;
    userSessions.set(chatId, session);
    
    const pakasir = new PakasirApi();
    const result = await pakasir.createQRIS(orderId, session.totalPrice);
    
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    
    if (!result.success) {
      await bot.sendMessage(chatId, `Gagal membuat pembayaran: ${result.message}`);
      return;
    }
    
    const payment = result.data;
    const qrBuffer = await generateQRCodeBuffer(payment.payment_number);
    
    const formattedAmount = formatPrice(payment.total_payment);
    
    const expiredDate = new Date(payment.expired_at);
    const expiredStr = expiredDate.toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    let message = '<b>PEMBAYARAN QRIS</b>\n\n';
    message += `<blockquote>Total: ${formattedAmount}\n`;
    message += `Order ID: <code>${orderId}</code>\n`;
    message += `Kadaluarsa: ${expiredStr}</blockquote>\n\n`;
    message += `Scan QR code di bawah dengan aplikasi pembayaran Anda\n\n`;
    message += `<i>Jangan tutup chat ini, pembayaran akan diproses otomatis</i>`;
    
    await bot.sendPhoto(chatId, qrBuffer, {
      caption: message,
      parse_mode: 'HTML'
    });
    
    startPaymentChecker(bot, chatId, orderId, session.totalPrice, session);
    
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

function startPaymentChecker(bot, chatId, orderId, amount, session) {
  if (paymentCheckers.has(chatId)) {
    clearInterval(paymentCheckers.get(chatId));
  }
  
  let checkCount = 0;
  const maxChecks = 60;
  
  const checker = setInterval(async () => {
    checkCount++;
    
    try {
      const pakasir = new PakasirApi();
      const result = await pakasir.checkPayment(orderId, amount);
      
      console.log(`[Payment Check ${checkCount}/${maxChecks}] Order: ${orderId}, Status:`, result.data?.status || 'error');
      
      if (result.success && result.data.status === 'completed') {
        clearInterval(checker);
        paymentCheckers.delete(chatId);
        
        console.log(`[Payment Success] Order: ${orderId}, Creating VPN account...`);
        
        await bot.sendMessage(chatId, '<b>PEMBAYARAN BERHASIL!</b>\n\nSedang membuat akun VPN...', {
          parse_mode: 'HTML'
        });
        
        await createVPNAccount(bot, chatId, session);
      } else if (checkCount >= maxChecks) {
        clearInterval(checker);
        paymentCheckers.delete(chatId);
        
        console.log(`[Payment Timeout] Order: ${orderId}, Max checks reached`);
        
        await bot.sendMessage(chatId, '<b>WAKTU PEMBAYARAN HABIS</b>\n\nPembayaran Anda belum terdeteksi. Silakan coba lagi.', {
          parse_mode: 'HTML'
        });
        
        userSessions.delete(chatId);
      }
    } catch (error) {
      console.error('[Payment Check Error]', error);
    }
  }, 5000);
  
  paymentCheckers.set(chatId, checker);
  console.log(`[Payment Checker Started] Order: ${orderId}, ChatId: ${chatId}`);
}

async function createVPNAccount(bot, chatId, session) {
  try {
    console.log(`[Create VPN] Starting for ChatId: ${chatId}, Server: ${session.serverId}`);

    const loadingMsg = await bot.sendMessage(chatId, '⏳ Memproses pembelian...\n\n⚙️ Membuat akun VPN\n📦 Menyiapkan konfigurasi\n\n<i>Mohon tunggu sebentar...</i>', {
      parse_mode: 'HTML'
    });

    await new Promise(resolve => setTimeout(resolve, config.delays.beforeCreateAccount));

    const api = new VPNApi();
    const payload = {
      server_id: session.serverId,
      username: session.username,
      duration: session.duration
    };

    if (session.serverType === 'SSH') {
      payload.password = session.password;
    }

    console.log('[Create VPN] Payload:', JSON.stringify(payload, null, 2));

    const result = await api.createAccount(payload);

    console.log('[Create VPN] Result:', result.success ? 'SUCCESS' : 'FAILED');

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    if (result.success) {
      const data = result.data;

      console.log('[Create VPN] Account created:', data.username);

      let message = `<b>✅ AKUN VPN BERHASIL DIBUAT!</b>\n\n`;

      message += `<b>📋 INFORMASI AKUN</b>\n`;
      message += `<blockquote>Server: ${data.server.name}\n`;
      message += `Lokasi: ${data.server.location}\n`;
      message += `Tipe: ${data.server.category}\n\n`;
      message += `Username: <code>${data.username}</code>\n`;

      if (data.server.category === 'SSH' && data.password) {
        message += `Password: <code>${data.password}</code>\n`;
      } else if (data.uuid) {
        message += `UUID: <code>${data.uuid}</code>\n`;
      }

      if (data.ports && data.ports.length > 0) {
        message += `Port: ${data.ports.join(', ')}\n`;
      }

      message += `\nDibuat: ${data.created_at}\n`;
      message += `Kadaluarsa: ${data.expired_at}</blockquote>\n\n`;

      if (data.openvpn_config) {
        message += `<b>📄 KONFIGURASI OPENVPN</b>\n`;
        message += `<pre>${data.openvpn_config}</pre>\n\n`;
      }

      if (data.payload) {
        message += `<b>📱 CUSTOM PAYLOAD</b>\n`;
        if (data.payload.cdn) {
          message += `<b>CDN:</b>\n<pre>${data.payload.cdn}</pre>\n`;
        }
        if (data.payload.with_path) {
          message += `<b>With Path:</b>\n<pre>${data.payload.with_path}</pre>\n`;
        }
        message += `\n`;
      }

      if (data.links && Object.keys(data.links).length > 0) {
        message += `<b>🔗 LINK KONEKSI</b>\n`;
        for (const [name, link] of Object.entries(data.links)) {
          message += `<b>${name}:</b>\n<code>${link}</code>\n\n`;
        }
      }

      if (data.subscription_url) {
        message += `<b>📡 SUBSCRIPTION URL</b>\n`;
        message += `<code>${data.subscription_url}</code>\n\n`;
        message += `<i>💡 Copy link ini ke aplikasi VPN Anda</i>\n\n`;
      }

      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Terima kasih! Gunakan /start untuk menu utama.`;

      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

      userSessions.delete(chatId);
    } else {
      console.error('[Create VPN] Failed:', result.message);
      await bot.sendMessage(chatId, `<b>PEMBELIAN GAGAL</b>\n\n${result.message}`, { parse_mode: 'HTML' });
      userSessions.delete(chatId);
    }
  } catch (error) {
    console.error('[Create VPN] Error:', error);
    await bot.sendMessage(chatId, `<b>ERROR</b>\n\n${error.message}`, { parse_mode: 'HTML' });
    userSessions.delete(chatId);
  }
}

async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  const message = `
<b>BANTUAN BOT VPN</b>

<b>Cara Membeli:</b>
1. Klik Beli VPN
2. Pilih tipe server (SSH/VMess/VLess/Trojan)
3. Pilih server yang diinginkan
4. Masukkan username
5. Masukkan password (khusus SSH)
6. Pilih durasi
7. Scan QRIS untuk bayar
8. Akun otomatis dibuat setelah pembayaran

<blockquote>Pembayaran via QRIS
Proses otomatis dan cepat
Aman dan terpercaya</blockquote>
  `.trim();
  
  const keyboard = [
    [
      { text: '🛒 Beli VPN', callback_data: 'menu_buy' }
    ],
    [
      { text: 'Menu Utama', callback_data: 'menu_main' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

module.exports = {
  handleStart,
  handleBuy,
  handleCallback,
  handleMessage,
  handleHelp,
  showBuyPage,
  showUsernameInput,
  showPasswordInput,
  showServerTypeSelection
};
