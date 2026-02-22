require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    adminIds: process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || []
  },
  api: {
    baseUrl: process.env.API_BASE_URL,
    adminApiKey: process.env.ADMIN_API_KEY,
    timeout: {
      getServers: 15000,
      createAccount: 30000,
      retryDelay: 3000
    }
  },
  pakasir: {
    project: process.env.PAKASIR_PROJECT,
    apiKey: process.env.PAKASIR_API_KEY
  },
  markup: {
    price: parseInt(process.env.MARKUP_PRICE || '0')
  },
  delays: {
    beforeCreateAccount: 2000,
    betweenRequests: 1000
  }
};
