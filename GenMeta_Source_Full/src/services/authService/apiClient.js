// Node modules
const { net } = require("electron");

// Local config
const API_CONFIG = require("../../config/api");

/**
 * Makes an HTTP request using Electron's net module.
 *
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {string} urlPath - The API path to request.
 * @param {Object} [headers={}] - Request headers.
 * @param {Object|string|null} [body=null] - Request body.
 * @returns {Promise<{statusCode: number, body: string}>} Response status code and body.
 */
function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method,
      protocol: API_CONFIG.protocol,
      port: API_CONFIG.port,
      hostname: API_CONFIG.hostname,
      path: urlPath,
    });

    // Set all headers
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

    request.on("error", (error) => {
      reject(error);
    });

    // Write body if provided
    if (body) {
      request.write(typeof body === "string" ? body : JSON.stringify(body));
    }

    request.end();
  });
}

/**
 * Generates default headers for authenticated API requests.
 *
 * @param {string} secretKey - The user's API secret key.
 * @returns {Object} Headers object with API key and device ID.
 */
const defaultHeaders = (secretKey) => ({
  "x-api-key": secretKey,
  "x-device-id": global.deviceId,
  "Content-Type": "application/json",
});

module.exports = { makeRequest, defaultHeaders };
