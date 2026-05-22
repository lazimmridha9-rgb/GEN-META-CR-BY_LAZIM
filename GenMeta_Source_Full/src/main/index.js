const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const { createMainWindow } = require('./window');
const { logStartup } = require('../utils/logStartup');
const { cleanupTempDirectories } = require('../utils/cleanup');
const { setupAutoUpdater } = require('./services/updater');
const { isUserLoggedIn } = require('../modules/auth');
const { isGuestLoggedIn, getGuestInfo } = require('../services/guestAuthService');
const { performStartupChecks, schedulePeriodicChecks } = require('./services/startup');
const { handleProtocolUrl, setupProtocolClient } = require('./protocol');
const handlers = require('./ipc');

// Set application name
app.setName('GenMeta');

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Handle second instance launch (e.g., clicking shortcut again)
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find((arg) => arg.startsWith('genmeta://'));
  if (url) {
    logStartup(`URL found in second instance: ${url}`);
    handleProtocolUrl(url);
  }
  if (global.mainWindow) {
    if (global.mainWindow.isMinimized()) global.mainWindow.restore();
    global.mainWindow.focus();
  }
});

setupProtocolClient();

// Handle macOS open-url event
app.on('open-url', (event, url) => {
  event.preventDefault();
  logStartup(`App was opened with URL: ${url}`);
  handleProtocolUrl(url);
});

// Handle protocol URL from command line args on Windows
if (process.platform === 'win32') {
  const protocolUrl = process.argv.slice(1).find((arg) => arg.startsWith('genmeta://'));
  if (protocolUrl) {
    logStartup(`Protocol URL found in command line args: ${protocolUrl}`);
    app.on('ready', () => setTimeout(() => handleProtocolUrl(protocolUrl), 1000));
  }
}

// Initialize global state
global.deviceId = handlers.getDeviceId();
logStartup('App starting...');
global.mainWindow = null;

// Global error handler
process.on('uncaughtException', (err) => {
  logStartup(`Uncaught Exception: ${err.message}\nStack: ${err.stack}`);
  console.error('Uncaught Exception:', err);
});

// Track app background state
let isAppInBackground = false;
app.on('browser-window-blur', () => { isAppInBackground = true; });
app.on('browser-window-focus', () => { isAppInBackground = false; });

// Quit if app is in background with no windows
setInterval(() => {
  if (isAppInBackground && BrowserWindow.getAllWindows().length === 0) {
    logStartup('App is in background with no windows, quitting...');
    app.quit();
  }
}, 5000);

setupAutoUpdater();

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.name);
  }

  const loggedIn = isUserLoggedIn() || isGuestLoggedIn();
  const isGuest = isGuestLoggedIn();
  logStartup(`Initial login status: ${loggedIn ? (isGuest ? 'guest logged in' : 'logged in') : 'not logged in'}`);

  try {
    const mainWindow = createMainWindow();
    global.mainWindow = mainWindow;
    logStartup('Main window created successfully');

    // Send login status when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
      if (isGuest) {
        const guestInfo = getGuestInfo();
        mainWindow.webContents.send('login-status', {
          isLoggedIn: true,
          isGuest: true,
          username: guestInfo?.guestName || 'Guest User',
        });
      } else {
        mainWindow.webContents.send('login-status', { isLoggedIn: loggedIn });
      }
    });

    performStartupChecks(mainWindow);
    schedulePeriodicChecks(mainWindow);

    mainWindow.on('closed', () => {
      logStartup('Main window closed');
      global.mainWindow = null;
    });

    // Register all IPC handlers
    const handlerRegistrations = [
      ['Settings', () => handlers.registerSettingsHandlers()],
      ['Path', () => handlers.registerPathHandler()],
      ['Processing', () => handlers.registerProcessingHandler()],
      ['Output', () => handlers.registerOutputHandler()],
      ['Export', () => handlers.registerExportHandler()],
      ['Ghostscript Path', () => handlers.registerGsPathHandlers()],
      ['FFmpeg', () => handlers.registerFFmpegHandlers()],
      ['Auth', () => handlers.registerAuthHandlers()],
      ['App', () => handlers.registerAppHandlers()],
      ['Update', () => handlers.registerUpdateHandlers()],
    ];

    for (const [name, register] of handlerRegistrations) {
      try {
        register();
        logStartup(`${name} handler registered`);
      } catch (error) {
        logStartup(`Failed to register ${name} handler: ${error.message}`);
      }
    }

    // Notify renderer that IPC is ready after a short delay
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('message', 'IPC connection established successfully');
        mainWindow.webContents.send('login-status', { isLoggedIn: isUserLoggedIn() || isGuestLoggedIn() });
      }
    }, 2000);
  } catch (error) {
    logStartup(`Failed to create main window: ${error.message}`);
  }

  // Open DevTools in development mode
  if (!app.isPackaged && global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.openDevTools();
    logStartup('DevTools opened');
  }
});

app.on('window-all-closed', () => {
  logStartup('All windows closed');
  cleanupTempDirectories();
  app.quit();
});

app.on('before-quit', () => {
  logStartup('App is about to quit');
  cleanupTempDirectories();
});
