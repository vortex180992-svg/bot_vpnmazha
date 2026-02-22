const QRCode = require('qrcode');

async function generateQRCodeBuffer(text) {
  try {
    const buffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 400,
      margin: 2
    });
    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

module.exports = { generateQRCodeBuffer };
