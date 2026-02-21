# Bot Telegram VPN

Bot Telegram untuk pembelian akun VPN dengan pembayaran QRIS otomatis menggunakan Pakasir.com.

## Fitur

### User
- ✅ Lihat daftar server VPN
- ✅ Beli akun VPN (SSH, VMess, VLess, Trojan)
- ✅ Pilih durasi 1-12 bulan dengan harga otomatis
- ✅ Pembayaran QRIS otomatis via Pakasir.com
- ✅ Akun dibuat otomatis setelah pembayaran berhasil
- ✅ UI/UX clean dan mudah digunakan

### Admin
- ✅ Cek saldo akun

## Flow Pembelian

1. User klik **Beli VPN**
2. Pilih server yang diinginkan
3. Input username (dan password untuk SSH)
4. Pilih durasi (1-12 bulan)
5. Konfirmasi pembelian
6. Scan QRIS untuk pembayaran
7. Sistem otomatis cek pembayaran setiap 5 detik
8. Akun VPN dibuat otomatis setelah pembayaran berhasil

**Tidak perlu top up saldo!** User langsung bayar sesuai harga VPN yang dipilih.

## Instalasi

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
- `/servers` - Lihat daftar server VPN
- `/buy` - Beli akun VPN
- `/help` - Bantuan

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

## Struktur Project

```
telegram-vpn-bot/
├── bot.js              # Main bot file
├── config.js           # Configuration
├── .env                # Environment variables
├── package.json        # Dependencies
├── handlers/
│   ├── admin.js        # Admin handlers
│   └── user.js         # User handlers (dengan QRIS payment)
└── utils/
    ├── api.js          # API client (VPN + Pakasir)
    └── qrcode.js       # QR code generator
```

## Troubleshooting

### Bot tidak merespon
- Pastikan token bot sudah benar
- Pastikan bot sudah dijalankan dengan `npm start`
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