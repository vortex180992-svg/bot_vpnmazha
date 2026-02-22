# Deployment Guide - VPS Setup

Panduan lengkap untuk deploy VPN Bot di VPS menggunakan Node.js 20 dan PM2.

## Prerequisites

- VPS dengan Ubuntu 20.04 atau lebih baru
- Akses SSH ke VPS
- Domain (opsional, untuk webhook)

## 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Install Node.js 20

### Menggunakan NodeSource Repository

```bash
# Install curl jika belum ada
sudo apt install -y curl

# Download dan jalankan script setup Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verifikasi instalasi
node --version
npm --version
```

Output yang diharapkan:
```
v20.x.x
10.x.x
```

### Alternatif: Menggunakan NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20

# Set sebagai default
nvm use 20
nvm alias default 20

# Verifikasi
node --version
```

## 3. Install PM2

PM2 adalah process manager untuk Node.js yang akan menjaga bot tetap running.

```bash
# Install PM2 secara global
sudo npm install -g pm2

# Verifikasi instalasi
pm2 --version
```

## 4. Install Git

```bash
sudo apt install -y git
```

## 5. Clone Repository

```bash
# Buat direktori untuk aplikasi
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/AutoFTbot/pras-store-bot.git
cd pras-store-bot

# Atau jika sudah punya, pull update terbaru
git pull origin main
```

## 6. Install Dependencies

```bash
# Install semua package yang dibutuhkan
npm install
```

## 7. Konfigurasi Environment

```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit file .env
nano .env
```

Isi konfigurasi:

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
ADMIN_USER_IDS=123456789,987654321

# API Configuration
API_BASE_URL=https://pras-store.com/api/v1
ADMIN_API_KEY=your_admin_api_key

# Pakasir Payment Gateway
PAKASIR_PROJECT=your_pakasir_project_slug
PAKASIR_API_KEY=your_pakasir_api_key

# Markup (optional)
MARKUP_PRICE=0
```

Simpan dengan `Ctrl + X`, lalu `Y`, lalu `Enter`.

## 8. Test Bot

Sebelum menjalankan dengan PM2, test dulu apakah bot berjalan dengan baik:

```bash
node bot.js
```

Jika muncul:
```
🤖 VPN Bot is now active!
```

Berarti bot sudah berjalan. Tekan `Ctrl + C` untuk stop.

## 9. Jalankan dengan PM2

### Start Bot

```bash
# Start bot dengan PM2
pm2 start bot.js --name vpn-bot

# Atau dengan ecosystem file (recommended)
pm2 start ecosystem.config.js
```

### Perintah PM2 Penting

```bash
# Lihat status bot
pm2 status

# Lihat logs
pm2 logs vpn-bot

# Lihat logs real-time
pm2 logs vpn-bot --lines 100

# Stop bot
pm2 stop vpn-bot

# Restart bot
pm2 restart vpn-bot

# Delete bot dari PM2
pm2 delete vpn-bot

# Monitoring
pm2 monit
```

## 10. Auto Start on Boot

Agar bot otomatis start saat VPS reboot:

```bash
# Generate startup script
pm2 startup

# Jalankan command yang muncul (biasanya seperti ini):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username

# Save current PM2 process list
pm2 save
```

## 11. Update Bot

Ketika ada update di GitHub:

```bash
# Masuk ke direktori bot
cd ~/apps/pras-store-bot

# Pull update terbaru
git pull origin main

# Install dependencies baru (jika ada)
npm install

# Restart bot
pm2 restart vpn-bot
```

## 12. Monitoring & Maintenance

### Check Logs

```bash
# Logs 100 baris terakhir
pm2 logs vpn-bot --lines 100

# Logs error saja
pm2 logs vpn-bot --err

# Clear logs
pm2 flush
```

### Check Resource Usage

```bash
# Monitoring real-time
pm2 monit

# Status detail
pm2 show vpn-bot
```

### Restart Schedule (Optional)

Restart bot setiap hari jam 3 pagi untuk refresh memory:

```bash
# Edit crontab
crontab -e

# Tambahkan baris ini
0 3 * * * pm2 restart vpn-bot
```

## 13. Firewall Configuration

Jika menggunakan UFW:

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (jika pakai webhook)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 14. Security Best Practices

### 1. Jangan Commit .env ke Git

File `.env` sudah ada di `.gitignore`, pastikan tidak ter-commit.

### 2. Gunakan SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key ke GitHub
cat ~/.ssh/id_ed25519.pub
```

### 3. Update Sistem Secara Berkala

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update
```

### 4. Backup Konfigurasi

```bash
# Backup .env file
cp .env .env.backup

# Backup ke local
scp user@vps:/path/to/.env ~/backup/.env
```

## 15. Troubleshooting

### Bot Tidak Start

```bash
# Check logs
pm2 logs vpn-bot --lines 50

# Check error
pm2 logs vpn-bot --err

# Restart
pm2 restart vpn-bot
```

### Memory Leak

```bash
# Check memory usage
pm2 monit

# Restart bot
pm2 restart vpn-bot

# Set max memory restart
pm2 start bot.js --name vpn-bot --max-memory-restart 500M
```

### Port Already in Use

```bash
# Check process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Permission Denied

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/apps/pras-store-bot

# Fix permissions
chmod -R 755 ~/apps/pras-store-bot
```

## 16. Ecosystem File (Recommended)

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vpn-bot',
    script: './bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Jalankan dengan:

```bash
pm2 start ecosystem.config.js
```

## 17. Nginx Reverse Proxy (Optional)

Jika ingin setup webhook atau web interface:

```bash
# Install Nginx
sudo apt install -y nginx

# Buat konfigurasi
sudo nano /etc/nginx/sites-available/vpn-bot

# Isi dengan:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/vpn-bot /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 18. SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto renewal
sudo certbot renew --dry-run
```

## Quick Start Commands

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

# Start Bot
pm2 start bot.js --name vpn-bot
pm2 startup
pm2 save

# Monitor
pm2 logs vpn-bot
pm2 monit
```

## Support

Jika ada masalah:
1. Check logs: `pm2 logs vpn-bot`
2. Check status: `pm2 status`
3. Restart: `pm2 restart vpn-bot`
4. Check dokumentasi: `README.md`, `PERFORMANCE.md`

## Resources

- Node.js: https://nodejs.org/
- PM2: https://pm2.keymetrics.io/
- Telegram Bot API: https://core.telegram.org/bots/api
- Pakasir API: https://pakasir.com/p/docs
