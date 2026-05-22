const { ipcMain } = require("electron");

const { getAllKeyStats } = require("../tracking");
const { handleRegenerateMetadata } = require("./regenerate");
const { handleSaveMetadata } = require("./metadata-save");
const { handleSubmitConfig } = require("./orchestrator");
const { handleRenameFiles } = require("./rename");

/**
 * Register all IPC handlers for processing operations
 */
function registerProcessingHandlers() {
  // Main processing submission
  ipcMain.handle("submit-config", async (event, config) => {
    try {
      return await handleSubmitConfig(config);
    } catch (error) {
      console.error("Processing error:", error);
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-error", error.message);
      }
      return { success: false, message: error.message };
    } finally {
      global.progressEvents = null;
      await global.apiUsageTracker.endSession();
    }
  });

  // Stop processing
  ipcMain.handle("processing:stop", async () => {
    try {
      global.processingState.isProcessingStopped = true;
      if (
        global.apiUsageTracker &&
        global.apiUsageTracker.isProcessing
      ) {
        await global.apiUsageTracker.endSession();
      }
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-stopped", {
          message: "Processing has been stopped by user request",
        });
      }
      return { success: true, message: "Processing stop request received" };
    } catch (error) {
      console.error("Error stopping processing:", error);
      return { success: false, message: error.message };
    }
  });

  // Save metadata to file
  ipcMain.handle("save-metadata", async (event, { filePath, metadata }) => {
    try {
      return await handleSaveMetadata(filePath, metadata);
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // Rename files
  ipcMain.handle(
    "rename-files",
    async (event, { files, renameType, prefixIndex }) => {
      try {
        return await handleRenameFiles(files, renameType, prefixIndex);
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
  );

  // Get API usage statistics
  ipcMain.handle("get-api-usage-stats", async () => {
    try {
      const stats = getAllKeyStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // Regenerate metadata for a single file
  ipcMain.handle("processing:regenerate-metadata", async (event, config) => {
    try {
      return await handleRegenerateMetadata(
        config.filePath,
        config.customPrompt,
      );
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerProcessingHandlers };
