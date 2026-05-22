const path = require('path');
const fs = require('fs');
const { loadSettings } = require('../../../handlers/settingsHandler');
const { validateUserID } = require('./userValidator');
const { getAllProcessingApiKeys } = require('./keyManager');
const { progressTracker, logError } = require('./progressTracker');
const { isGuestLoggedIn } = require('../../../services/guestAuthService');

/**
 * Handles the submission of a processing configuration
 * @param {Object} config - Processing configuration object
 * @returns {Promise<Object>} Processing result
 */
async function handleSubmitConfig(config) {
  global.processingState.isProcessingStopped = false;
  global.apiUsageTracker.startSession();

  const settings = loadSettings();

  if (settings.apiKeys.length === 0 && !settings.aiApiKey) {
    throw new Error('API key is not set. Please configure it in settings.');
  }
  if (!config.path) {
    throw new Error('No directory selected. Please select a directory first.');
  }

  const isRetryMode = config.retryMode === true;

  // Build list of media files to process
  let mediaFiles = [];
  if (config.selectedFiles && Array.isArray(config.selectedFiles)) {
    mediaFiles = config.selectedFiles.map((file) => ({
      filename: file.filename,
      path: file.path,
    }));
  } else {
    mediaFiles = fs.readdirSync(config.path)
      .filter((file) => ['.jpg', '.jpeg', '.png', '.eps', '.svg', '.mp4', '.mov'].some((ext) => file.toLowerCase().endsWith(ext)))
      .map((file) => ({ filename: file, path: path.join(config.path, file) }));
  }

  const { batchFiles } = require('../../../process/batchFiles');
  const batches = batchFiles(mediaFiles);
  const batchCount = batches.length;

  // Validate user session (regular or guest)
  const isGuest = isGuestLoggedIn();
  if (!settings.secretKey && !isGuest) {
    throw new Error('You are not logged in.');
  }
  // Skip API validation for guest users - they have full local access
  let validation = null;
  if (!isGuest) {
    validation = await validateUserID(settings.secretKey, batchCount);
    if (!validation || !validation.username || !validation.plan) {
      throw new Error('Invalid API response. Please try again.');
    }
  }

  const processingApiKeys = await getAllProcessingApiKeys(settings);
  if (processingApiKeys.length === 0) {
    throw new Error('No API keys available for processing');
  }

  // Set up progress tracking callbacks
  progressTracker.reset();
  const onBatchStart = (total) => progressTracker.setTotal(total);
  const onImageProcessed = () => progressTracker.increment();
  const onResultAvailable = (result) => progressTracker.addResult(result);
  global.progressEvents = { onBatchStart, onImageProcessed, onResultAvailable };

  const geminiModel = settings?.geminiModel || 'gemini-2.5-flash';
  const { processImages } = require('../../../process/processImages');

  const results = await processImages(config.path, {
    titleLength: settings.titleLength,
    titleLengthMode: settings.titleLengthMode || 'fixed',
    descriptionLength: settings.descriptionLength,
    keywordCount: settings.keywordCount,
    isPremium: settings.isPremium,
    outputDirectory: isRetryMode && config.outputDirectory ? config.outputDirectory : undefined,
    createJpgCopy: settings.createJpgCopy || false,
    createPngCopy: settings.createPngCopy || false,
    addPeriodTitle: settings.addPeriodTitle !== undefined ? settings.addPeriodTitle : true,
    addPeriodDescription: settings.addPeriodDescription !== undefined ? settings.addPeriodDescription : true,
    enableAdobeStockCategories: settings.enableAdobeStockCategories || false,
    enableShutterstockCategories: settings.enableShutterstockCategories !== undefined ? settings.enableShutterstockCategories : true,
    positiveKeywords: settings.positiveKeywords,
    negativeKeywords: settings.negativeKeywords,
    positiveKeywordsTarget: settings.positiveKeywordsTarget,
    positiveKeywordsFiletypes: settings.positiveKeywordsFiletypes,
    keywordFormat: settings.keywordFormat || 'auto',
    geminiModel,
    planType: 'Premium',
    enableCustomPrompt: false,
    customPrompt: settings.customPrompt || '',
  }, processingApiKeys, config.selectedFiles, settings.gsPath);

  // Normalize output directory property
  if (results.outputDir && !results.outputDirectory) {
    results.outputDirectory = results.outputDir;
  }

  await global.apiUsageTracker.endSession();

  // Send results and show notification if window is not focused
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send('processing-results', results);

    if (global.mainWindow.isWindowFocused && !global.mainWindow.isWindowFocused() && settings.enableNotifications !== false) {
      const { Notification } = require('electron');
      if (Notification.isSupported()) {
        const successCount = results.successful?.length || 0;
        const failedCount = results.failed?.length || 0;

        let body = '';
        if (successCount > 0 && failedCount > 0) {
          body = `Successfully processed ${successCount} file(s), ${failedCount} failed`;
        } else if (successCount > 0) {
          body = `Successfully processed ${successCount} file(s)`;
        } else if (failedCount > 0) {
          body = `Processing failed for ${failedCount} file(s)`;
        } else {
          body = 'Processing completed';
        }

        const notification = new Notification({
          title: 'GenMeta - Processing Complete',
          body,
          icon: path.join(__dirname, '..', '..', '..', 'assets', 'icon.png'),
        });

        notification.on('click', () => {
          if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            if (global.mainWindow.isMinimized()) global.mainWindow.restore();
            global.mainWindow.focus();
          }
        });

        notification.show();
      }
    }
  }

  return { success: true, message: 'Processing completed successfully' };
}

module.exports = { handleSubmitConfig };
