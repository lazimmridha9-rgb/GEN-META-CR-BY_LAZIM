const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { loadSettings } = require('./settingsHandler');
const { createHelpers, CSV_GENERATORS, isMarketEnabled, MARKETS } = require('../shared/helpers/csvGenerators');

/**
 * Registers the CSV export IPC handler
 */
function registerExportHandler() {
  ipcMain.handle('export-csv', async (event, data, outputDirectory = null, newExtension = null) => {
    try {
      const settings = loadSettings();

      // Build default market configurations
      const defaultMarkets = {};
      for (const market of MARKETS) {
        defaultMarkets[market] = { enabled: true };
      }
      defaultMarkets['123rf'].country = 'US';
      defaultMarkets['istock'] = { enabled: true, editorial: false, artistName: '' };
      defaultMarkets['pond5'] = { enabled: true, editorial: false };

      // Merge defaults with user settings
      const enabledMarkets = Object.assign({}, defaultMarkets, settings.csvExportMarkets || {});

      // Show directory picker dialog
      const win = BrowserWindow.fromWebContents(event.sender);
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Select Directory to Save CSV Files',
        defaultPath: outputDirectory || '',
        buttonLabel: 'Select Folder',
        properties: ['openDirectory', 'createDirectory'],
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, message: 'Export canceled' };
      }

      // Create csv subdirectory
      const csvDirectory = path.join(filePaths[0], 'csv');
      if (!fs.existsSync(csvDirectory)) {
        fs.mkdirSync(csvDirectory, { recursive: true });
      }

      const helpers = createHelpers(newExtension);
      const exportedFiles = [];

      // Generate CSV for each enabled market
      for (const market of MARKETS) {
        if (!isMarketEnabled(enabledMarkets[market])) continue;

        const config = enabledMarkets[market];
        const csvContent = CSV_GENERATORS[market](data, helpers, config);
        const filePath = helpers.getUniqueFilename(csvDirectory, `metadata_${market}`, '.csv');
        fs.writeFileSync(filePath, csvContent, 'utf8');
        exportedFiles.push(filePath);
      }

      const fileCount = exportedFiles.length;
      return {
        success: true,
        filePaths: exportedFiles,
        message: `Successfully exported ${fileCount} CSV file${fileCount !== 1 ? 's' : ''} to ${csvDirectory}`,
      };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return { success: false, message: `Error exporting CSV: ${error.message}` };
    }
  });
}

module.exports = { registerExportHandler };
