const CONSTANTS = {
  MAX_CONCURRENT_UPLOAD_REQUESTS: 5,
  MAX_RETRIES: 1,
  INITIAL_TIMEOUT: 50000,
  DEFAULT_RESIZE_OPTIONS: {
    width: 1080,
    quality: 100,
    withoutEnlargement: true,
  },
  SUPPORTED_IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  SUPPORTED_VIDEO_FORMATS: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  EPS_FORMAT: '.eps',
  SVG_FORMAT: '.svg',
};

module.exports = CONSTANTS;
