/**
 * @typedef {Object} ApiConfig
 * @property {string} protocol - The protocol used (http: | https:)
 * @property {string} hostname - The server hostname
 * @property {number | undefined} [port] - The server port (if applicable)
 * @property {string} baseUrl - The full base URL
 */

/** @type {"development" | "staging" | "production"} */
const ENV = 'staging';

/** @type {Record<"development" | "staging" | "production", ApiConfig>} */
const CONFIGS = {
  development: {
    protocol: 'http:',
    hostname: 'localhost',
    port: 5000,
    baseUrl: 'http://localhost:5000',
  },
  staging: {
    protocol: 'https:',
    hostname: 'apidev.genmeta.app',
    baseUrl: 'https://apidev.genmeta.app',
  },
  production: {
    protocol: 'https:',
    hostname: 'api.genmeta.app',
    baseUrl: 'https://api.genmeta.app',
  },
};

/** @type {ApiConfig} */
const API_CONFIG = CONFIGS[ENV];

module.exports = API_CONFIG;
