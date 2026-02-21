require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    adminIds: process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || []
  },
  api: {
    baseUrl: process.env.API_BASE_URL,
    adminApiKey: process.env.ADMIN_API_KEY
  },
  pakasir: {
    project: process.env.PAKASIR_PROJECT,
    apiKey: process.env.PAKASIR_API_KEY
  }
};
