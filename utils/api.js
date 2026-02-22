const axios = require('axios');
const config = require('../config');

class VPNApi {
  constructor(apiKey = config.api.adminApiKey) {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  async getProfile() {
    try {
      const response = await this.client.get('/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getServers() {
    try {
      const response = await this.client.get('/vpn/servers', {
        timeout: config.api.timeout.getServers
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAccount(serverData) {
    try {
      const response = await this.client.post('/vpn/accounts', serverData, {
        timeout: config.api.timeout.createAccount
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log('[VPN API] Retrying after error:', error.message);
        
        await new Promise(resolve => setTimeout(resolve, config.api.timeout.retryDelay));
        
        try {
          const response = await this.client.post('/vpn/accounts', serverData, {
            timeout: config.api.timeout.createAccount
          });
          return response.data;
        } catch (retryError) {
          throw this.handleError(retryError);
        }
      }
      
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || 'API Error');
    }
    return new Error(error.message || 'Network Error');
  }
}

class PakasirApi {
  constructor() {
    this.baseUrl = 'https://app.pakasir.com/api';
    this.project = config.pakasir.project;
    this.apiKey = config.pakasir.apiKey;
  }

  async createQRIS(orderId, amount) {
    try {
      console.log('[Pakasir] Creating QRIS:', { orderId, amount });
      
      const response = await axios.post(`${this.baseUrl}/transactioncreate/qris`, {
        project: this.project,
        order_id: orderId,
        amount: amount,
        api_key: this.apiKey
      });
      
      console.log('[Pakasir] QRIS Created:', response.data.payment?.order_id);
      
      return { success: true, data: response.data.payment };
    } catch (error) {
      console.error('[Pakasir] Create QRIS Error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  async checkPayment(orderId, amount) {
    try {
      const response = await axios.get(`${this.baseUrl}/transactiondetail`, {
        params: {
          project: this.project,
          order_id: orderId,
          amount: amount,
          api_key: this.apiKey
        }
      });
      
      const status = response.data.transaction?.status || 'unknown';
      
      if (status === 'completed') {
        console.log('[Pakasir] Payment COMPLETED:', orderId);
      }
      
      return { success: true, data: response.data.transaction };
    } catch (error) {
      console.error('[Pakasir] Check Payment Error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  async cancelTransaction(orderId, amount) {
    try {
      console.log('[Pakasir] Cancelling transaction:', orderId);
      
      await axios.post(`${this.baseUrl}/transactioncancel`, {
        project: this.project,
        order_id: orderId,
        amount: amount,
        api_key: this.apiKey
      });
      return { success: true };
    } catch (error) {
      console.error('[Pakasir] Cancel Error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  }
}

module.exports = { VPNApi, PakasirApi };
