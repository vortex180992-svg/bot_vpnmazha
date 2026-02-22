# Bot Telegram VPN

Bot Telegram untuk pembelian akun VPN dengan pembayaran QRIS otomatis menggunakan Pakasir.com.

## Fitur

### User
- ✅ Pilih protokol VPN (SSH, VMess, VLess, Trojan)
- ✅ Lihat dan pilih server dari berbagai lokasi
- ✅ Pilih durasi berlangganan (1-12 bulan)
- ✅ Pembayaran QRIS otomatis via Pakasir.com
- ✅ Akun dibuat otomatis setelah pembayaran berhasil
- ✅ UI/UX clean dan mudah digunakan
- ✅ Real-time user info display

### Admin
- ✅ Cek saldo akun VPN API

## Flow Pembelian

1. User klik **Purchase VPN**
2. Pilih protokol (SSH, VMess, VLess, Trojan)
3. Pilih server yang diinginkan
4. Input username (dan password untuk SSH)
5. Pilih durasi (1-12 bulan)
6. Konfirmasi pembelian
7. Scan QRIS untuk pembayaran
8. Sistem otomatis cek pembayaran setiap 5 detik
9. Akun VPN dibuat otomatis setelah pembayaran berhasil

**Tidak perlu top up saldo!** User langsung bayar sesuai harga VPN yang dipilih.

## Instalasi

### Local Development

1. Clone repository ini
2. Install dependencies:
```bash
npm install
```

3. Copy file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

4. Edit file `.env` dan isi:
   - `TELEGRAM_BOT_TOKEN`: Token bot dari @BotFather
   - `ADMIN_USER_IDS`: ID Telegram admin (pisahkan dengan koma jika lebih dari 1)
   - `API_BASE_URL`: Base URL API VPN
   - `ADMIN_API_KEY`: API key dari PRASS VPN
   - `PAKASIR_PROJECT`: Slug proyek Pakasir Anda
   - `PAKASIR_API_KEY`: API key dari Pakasir.com

5. Jalankan bot:
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

### Production Deployment (VPS)

Untuk deployment di VPS dengan Node.js 20 dan PM2, lihat dokumentasi lengkap:

📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Panduan lengkap setup VPS

Quick start:
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone & Setup
git clone https://github.com/AutoFTbot/pras-store-bot.git
cd pras-store-bot
npm install
cp .env.example .env
nano .env

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## Setup Pakasir.com

1. Daftar di [Pakasir.com](https://pakasir.com)
2. Buat proyek baru
3. Catat **Slug** dan **API Key** proyek
4. Masukkan ke file `.env`
5. (Opsional) Setup webhook untuk notifikasi pembayaran

## Cara Mendapatkan Token Bot

1. Buka Telegram dan cari @BotFather
2. Kirim `/newbot`
3. Ikuti instruksi untuk membuat bot baru
4. Copy token yang diberikan ke file `.env`

## Cara Mendapatkan User ID Telegram

1. Buka Telegram dan cari @userinfobot
2. Kirim `/start`
3. Bot akan memberikan User ID Anda
4. Masukkan User ID ke file `.env` di `ADMIN_USER_IDS`

## Perintah Bot

### User
- `/start` - Mulai bot dan lihat menu
- `/help` - Bantuan penggunaan bot

### Admin
- `/admin` - Menu admin
- `/saldo` - Cek saldo akun

## Catatan Penting

✅ User tidak perlu top up, langsung bayar via QRIS
✅ Pembayaran otomatis terdeteksi dalam 5 detik
✅ Akun VPN dibuat otomatis setelah pembayaran
✅ QR code expired dalam 15 menit
✅ Durasi dalam satuan BULAN (1-12)
✅ Server SSH memerlukan password, server lain auto-generate UUID

## Performance Optimization

Bot sudah dioptimasi untuk server API low-end:
- ⏱️ Delay 2 detik sebelum create account
- ⏰ Timeout 30 detik untuk API calls
- 🔄 Automatic retry mechanism
- ⚙️ Configurable settings

Lihat [PERFORMANCE.md](PERFORMANCE.md) untuk detail.

## Struktur Project

```
telegram-vpn-bot/
├── bot.js                    # Main bot file
├── config.js                 # Configuration
├── ecosystem.config.js       # PM2 configuration
├── .env                      # Environment variables
├── package.json              # Dependencies
├── handlers/
│   ├── admin.js             # Admin handlers
│   └── user.js              # User handlers (dengan QRIS payment)
└── utils/
    ├── api.js               # API client (VPN + Pakasir)
    ├── qrcode.js            # QR code generator
    └── pricing.js           # Price calculation
```

## Dokumentasi

- 📖 [DEPLOYMENT.md](DEPLOYMENT.md) - Panduan deployment VPS
- 📊 [PERFORMANCE.md](PERFORMANCE.md) - Performance optimization
- 📝 [CHANGELOG.md](CHANGELOG.md) - Version history
- 🎯 [FEATURES.md](FEATURES.md) - Detailed features
- 💳 [PAYMENT_FLOW.md](PAYMENT_FLOW.md) - Payment flow diagram

## Troubleshooting

### Bot tidak merespon
- Pastikan token bot sudah benar
- Pastikan bot sudah dijalankan dengan `npm start` atau PM2
- Cek koneksi internet

### Error saat membuat QRIS
- Pastikan Pakasir API key sudah benar
- Pastikan slug proyek sudah benar
- Cek apakah proyek Pakasir aktif

### Pembayaran tidak terdeteksi
- Tunggu hingga 5 menit (sistem cek setiap 5 detik)
- Pastikan pembayaran sudah berhasil di aplikasi
- Cek status pembayaran di dashboard Pakasir

### Error saat membuat akun VPN
- Pastikan VPN API key sudah benar
- Cek apakah server tersedia
- Pastikan pembayaran sudah berhasil
- Lihat logs: `pm2 logs vpn-bot`

## Support

Jika ada masalah:
1. Check logs: `pm2 logs vpn-bot`
2. Check status: `pm2 status`
3. Restart: `pm2 restart vpn-bot`
4. Baca dokumentasi lengkap

## License

MIT License

## Author

AutoFTbot

## Repository

https://github.com/AutoFTbot/pras-store-bot
