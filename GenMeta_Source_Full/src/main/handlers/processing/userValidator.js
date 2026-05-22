const { net, app } = require('electron');
const API_CONFIG = require('../../../config/api');
const { getDeviceId } = require('./deviceManager');

/**
 * Validates the user's API key and subscription status
 * @param {string} secretKey - The user's secret API key
 * @param {number} processCount - Number of batches to process
 * @returns {Promise<Object>} Validation result with user data
 */
function validateUserID(secretKey, processCount = 1) {
  return new Promise((resolve, reject) => {
    if (!secretKey) {
      reject(new Error('User ID is not set'));
      return;
    }
    if (!processCount || processCount < 1) {
      reject(new Error('No valid batches found in the selected directory.'));
      return;
    }

    const deviceId = getDeviceId();
    const request = net.request({
      method: 'POST',
      protocol: API_CONFIG.protocol,
      port: API_CONFIG.port,
      hostname: API_CONFIG.hostname,
      path: '/api/v1/app/appkey/validate',
    });

    request.setHeader('x-api-key', secretKey);
    request.setHeader('x-device-id', deviceId);
    request.setHeader('x-app-version', app.getVersion());
    request.setHeader('Content-Type', 'application/json');

    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => { responseData += chunk.toString(); });

      response.on('end', () => {
        try {
          const statusCode = response.statusCode;
          const parsed = JSON.parse(responseData);

          if (statusCode === 200 && parsed.success) {
            if (!parsed.data) {
              resolve({ success: true });
              return;
            }
            const { username, plan } = parsed.data;
            if (!username || !plan) {
              resolve({ success: true });
              return;
            }
            resolve(parsed.data);
            return;
          }

          // Handle specific error status codes
          switch (statusCode) {
            case 400:
              reject(new Error(parsed.message || 'Missing required parameters'));
              break;
            case 403:
              if (parsed.message.includes('suspended')) {
                reject(new Error('Your account has been suspended.'));
              } else if (parsed.message.includes('another device')) {
                reject(new Error('This account is already being used on another device.'));
              } else if (parsed.message.includes('expired')) {
                reject(new Error('Your plan has expired. Please renew your subscription.'));
              } else if (parsed.message.includes('not active')) {
                reject(new Error('This account is not active.'));
              } else {
                reject(new Error(parsed.message || 'Access forbidden'));
              }
              break;
            case 404:
              reject(new Error('Account not found.'));
              break;
            case 429:
              reject(new Error(
                parsed.allowedLimit
                  ? `Daily usage limit reached (${parsed.allowedLimit} processes/day).`
                  : parsed.message || 'Usage limit exceeded.'
              ));
              break;
            case 500:
              reject(new Error('Server error. Please try again later.'));
              break;
            default:
              reject(new Error(parsed.message || 'An unknown error occurred.'));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`API validation failed: ${error.message}`));
    });

    request.write(JSON.stringify({ processCount }));
    request.end();
  });
}

module.exports = { validateUserID };
