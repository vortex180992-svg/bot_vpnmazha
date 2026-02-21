# Flow Pembayaran QRIS

## Alur Pembelian VPN

```
┌─────────────────┐
│  User /start    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pilih Server   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Username  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Input Password   │ (Hanya untuk SSH)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pilih Durasi    │ (1-12 bulan)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Konfirmasi     │ (Tampilkan total harga)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate QRIS   │ (Pakasir API)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tampilkan QR    │ (User scan dengan app)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto Check      │ (Setiap 5 detik)
│ Payment Status  │ (Max 5 menit)
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Success│ │Timeout│
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Create │ │Cancel │
│ VPN   │ │Session│
└───────┘ └───────┘
```

## Keunggulan Flow Ini

1. **Tidak Perlu Top Up**
   - User langsung bayar sesuai harga VPN
   - Tidak ada sistem saldo/wallet

2. **Otomatis**
   - Pembayaran terdeteksi otomatis
   - Akun VPN dibuat otomatis
   - Tidak perlu konfirmasi manual

3. **Clean UI/UX**
   - Step by step yang jelas
   - Harga transparan di setiap step
   - Konfirmasi sebelum bayar

4. **Real-time**
   - Cek pembayaran setiap 5 detik
   - Notifikasi instant saat berhasil
   - Timeout otomatis jika tidak bayar

## Integrasi Pakasir

### Create QRIS Payment
```javascript
POST https://app.pakasir.com/api/transactioncreate/qris
{
  "project": "your_project_slug",
  "order_id": "VPN1234567890",
  "amount": 50000,
  "api_key": "your_api_key"
}
```

Response:
```javascript
{
  "payment": {
    "order_id": "VPN1234567890",
    "amount": 50000,
    "fee": 1003,
    "total_payment": 51003,
    "payment_method": "qris",
    "payment_number": "00020101021226...", // QR string
    "expired_at": "2024-09-19T01:18:49Z"
  }
}
```

### Check Payment Status
```javascript
GET https://app.pakasir.com/api/transactiondetail
?project=your_project_slug
&order_id=VPN1234567890
&amount=50000
&api_key=your_api_key
```

Response:
```javascript
{
  "transaction": {
    "order_id": "VPN1234567890",
    "amount": 50000,
    "status": "completed", // atau "pending"
    "payment_method": "qris",
    "completed_at": "2024-09-19T01:20:00Z"
  }
}
```

## Session Management

Bot menggunakan Map untuk menyimpan session user:

```javascript
userSessions.set(chatId, {
  step: 'duration',
  serverId: 123,
  serverType: 'SSH',
  username: 'user123',
  password: 'pass123',
  duration: 3,
  totalPrice: 150000,
  orderId: 'VPN1234567890'
});
```

## Payment Checker

Interval checker yang berjalan setiap 5 detik:

```javascript
const checker = setInterval(async () => {
  const result = await pakasir.checkPayment(orderId, amount);
  
  if (result.data.status === 'completed') {
    // Stop checker
    clearInterval(checker);
    
    // Create VPN account
    await createVPNAccount(bot, chatId, session);
  }
}, 5000);
```

Max check: 60 kali × 5 detik = 5 menit

## Error Handling

1. **QRIS Generation Failed**
   - Tampilkan error message
   - User bisa coba lagi

2. **Payment Timeout**
   - Clear session
   - Clear checker
   - User bisa mulai dari awal

3. **VPN Creation Failed**
   - Tampilkan error
   - Payment sudah berhasil (perlu manual refund)

## Security Notes

- Order ID unik: `VPN${timestamp}${chatId}`
- Session disimpan di memory (hilang saat restart)
- Payment checker auto-cleanup setelah selesai
- Tidak ada data sensitif di log
