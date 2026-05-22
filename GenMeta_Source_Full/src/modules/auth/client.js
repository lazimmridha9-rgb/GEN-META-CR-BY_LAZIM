const { net } = require("electron");

const API_CONFIG = require("../../config/api");

/**
 * Make an HTTP request using Electron's net module
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Request path
 * @param {object} [headers={}] - Request headers
 * @param {object|string|null} [body=null] - Request body
 * @returns {Promise<{statusCode: number, body: string}>} Response status and body
 */
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method,
      protocol: API_CONFIG.protocol,
      port: API_CONFIG.port,
      hostname: API_CONFIG.hostname,
      path,
    });

    for (const [key, value] of Object.entries(headers)) {
      request.setHeader(key, value);
    }

    let responseData = "";

    request.on("response", (response) => {
      response.on("data", (chunk) => {
        responseData += chunk.toString();
      });
      response.on("end", () => {
        resolve({ statusCode: response.statusCode, body: responseData });
      });
    });

    request.on("error", (error) => reject(error));

    if (body) {
      request.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    request.end();
  });
}

/**
 * Build default headers for authenticated API requests
 * @param {string} secretKey - User's API key
 * @returns {object} Headers object
 */
const defaultHeaders = (secretKey) => ({
  "x-api-key": secretKey,
  "x-device-id": global.deviceId,
  "Content-Type": "application/json",
});

module.exports = { defaultHeaders, makeRequest };
