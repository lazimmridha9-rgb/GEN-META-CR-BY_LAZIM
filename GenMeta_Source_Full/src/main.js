// =============================================================================
// Node.js built-in modules
// =============================================================================
const path = require("path");
const fs = require("fs");

// =============================================================================
// Electron core modules
// =============================================================================
const { app, BrowserWindow } = require("electron");

// =============================================================================
// Local modules - Window creation
// =============================================================================
const { createMainWindow } = require("./createMainWindow");

// =============================================================================
// Local modules - Utilities
// =============================================================================
const { logStartup } = require("./utils/logStartup");
const { cleanupTempDirectories } = require("./utils/cleanup");
const { handleProtocolUrl, setupProtocolClient } = require("./utils/protocolHandler");

// =============================================================================
// Local modules - Services
// =============================================================================
const { setupAutoUpdater } = require("./services/updateService");
const { isUserLoggedIn } = require("./services/authService");
const { isGuestLoggedIn, getGuestInfo } = require("./services/guestAuthService");
const { performStartupChecks, schedulePeriodicChecks } = require("./services/startupService");

// =============================================================================
// Local modules - Handlers
// =============================================================================
const handlers = require("./handlers/index");

// =============================================================================
// Application configuration
// =============================================================================
app.setName("GenMeta");

// Ensure single instance - quit if another instance is already running
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// =============================================================================
// Protocol handling (genmeta:// custom URL scheme)
// =============================================================================

// Handle URLs from second instance launches
app.on("second-instance", (event, commandLine) => {
  const url = commandLine.find((arg) => arg.startsWith("genmeta://"));
  if (url) {
    logStartup(`URL found in second instance: ${url}`);
    handleProtocolUrl(url);
  }

  // Restore and focus the main window if it exists
  if (global.mainWindow) {
    if (global.mainWindow.isMinimized()) {
      global.mainWindow.restore();
    }
    global.mainWindow.focus();
  }
});

// Initialize the protocol client for custom URL scheme
setupProtocolClient();

// Handle macOS open-url events
app.on("open-url", (event, url) => {
  event.preventDefault();
  logStartup(`App was opened with URL: ${url}`);
  handleProtocolUrl(url);
});

// Handle protocol URLs passed via command line on Windows
if (process.platform === "win32") {
  const protocolUrl = process.argv.slice(1).find((arg) => arg.startsWith("genmeta://"));
  if (protocolUrl) {
    logStartup(`Protocol URL found in command line args: ${protocolUrl}`);
    app.on("ready", () => setTimeout(() => handleProtocolUrl(protocolUrl), 1000));
  }
}

// =============================================================================
// Global state initialization
// =============================================================================
global.deviceId = handlers.getDeviceId();
global.mainWindow = null;

logStartup("App starting...");

// =============================================================================
// Global error handling
// =============================================================================
process.on("uncaughtException", (err) => {
  logStartup(`Uncaught Exception: ${err.message}\nStack: ${err.stack}`);
  console.error("Uncaught Exception:", err);
});

// =============================================================================
// Background state tracking
// =============================================================================
let isAppInBackground = false;

app.on("browser-window-blur", () => {
  isAppInBackground = true;
});

app.on("browser-window-focus", () => {
  isAppInBackground = false;
});

// Periodically check if app should quit (background with no windows)
setInterval(() => {
  if (isAppInBackground && BrowserWindow.getAllWindows().length === 0) {
    logStartup("App is in background with no windows, quitting...");
    app.quit();
  }
}, 5000);

// =============================================================================
// Auto-updater setup
// =============================================================================
setupAutoUpdater();

// =============================================================================
// Application ready handler
// =============================================================================
app.whenReady().then(async () => {
  // Set App User Model ID for Windows taskbar integration
  if (process.platform === "win32") {
    app.setAppUserModelId(app.name);
  }

  const loggedIn = isUserLoggedIn() || isGuestLoggedIn();
  const isGuest = isGuestLoggedIn();
  logStartup(`Initial login status: ${loggedIn ? (isGuest ? "guest logged in" : "logged in") : "not logged in"}`);

  try {
    // Create and configure the main application window
    const mainWindow = createMainWindow();
    global.mainWindow = mainWindow;
    logStartup("Main window created successfully");

    // Send initial login status when page finishes loading
    mainWindow.webContents.on("did-finish-load", () => {
      if (isGuest) {
        const guestInfo = getGuestInfo();
        mainWindow.webContents.send("login-status", {
          isLoggedIn: true,
          isGuest: true,
          username: guestInfo?.guestName || "Guest User",
        });
      } else {
        mainWindow.webContents.send("login-status", { isLoggedIn: loggedIn });
      }
    });

    // Run startup validation checks
    performStartupChecks(mainWindow);
    schedulePeriodicChecks(mainWindow);

    // Clean up global reference when window is closed
    mainWindow.on("closed", () => {
      logStartup("Main window closed");
      global.mainWindow = null;
    });

    // Register all IPC handlers with error handling
    const handlerRegistrations = [
      ["Settings", () => handlers.registerSettingsHandlers()],
      ["Path", () => handlers.registerPathHandler()],
      ["Processing", () => handlers.registerProcessingHandler()],
      ["Output", () => handlers.registerOutputHandler()],
      ["Export", () => handlers.registerExportHandler()],
      ["Ghostscript Path", () => handlers.registerGsPathHandlers()],
      ["FFmpeg", () => handlers.registerFFmpegHandlers()],
      ["Auth", () => handlers.registerAuthHandlers()],
      ["App", () => handlers.registerAppHandlers()],
      ["Update", () => handlers.registerUpdateHandlers()],
    ];

    for (const [name, register] of handlerRegistrations) {
      try {
        register();
        logStartup(`${name} handler registered`);
      } catch (error) {
        logStartup(`Failed to register ${name} handler: ${error.message}`);
      }
    }

    // Delayed IPC readiness notification to ensure renderer is fully loaded
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("message", "IPC connection established successfully");
        mainWindow.webContents.send("login-status", { isLoggedIn: isUserLoggedIn() || isGuestLoggedIn() });
      }
    }, 2000);
  } catch (error) {
    logStartup(`Failed to create main window: ${error.message}`);
  }

  // Open DevTools in development mode
  if (!app.isPackaged && global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.openDevTools();
    logStartup("DevTools opened");
  }
});

// =============================================================================
// Application shutdown handlers
// =============================================================================
app.on("window-all-closed", () => {
  logStartup("All windows closed");
  cleanupTempDirectories();
  app.quit();
});

app.on("before-quit", () => {
  logStartup("App is about to quit");
  cleanupTempDirectories();
});
