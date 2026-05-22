const { BrowserWindow, app, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Path for storing window state
const WINDOW_STATE_PATH = path.join(app.getPath('userData'), 'window-state.json');
const DEFAULT_WINDOW_STATE = {
  width: 1100,
  height: 800,
  isMaximized: false,
  x: undefined,
  y: undefined,
};

// Minimum window dimensions
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

/**
 * Load saved window state from disk
 * @returns {Object} Window state object
 */
function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(WINDOW_STATE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load window state:', err);
  }
  return DEFAULT_WINDOW_STATE;
}

/**
 * Ensure the window is visible on one of the available displays
 * @param {Object} windowState - Current window state
 * @returns {Object} Validated window state
 */
function ensureWindowVisible(windowState) {
  const displays = screen.getAllDisplays();
  const newState = { ...windowState };

  // Enforce minimum dimensions
  newState.width = Math.max(newState.width, MIN_WIDTH);
  newState.height = Math.max(newState.height, MIN_HEIGHT);

  // Skip position check if coordinates are undefined
  if (newState.x === undefined || newState.y === undefined) return newState;

  // Check if window is visible on any display
  const visible = displays.some((d) => {
    const bounds = d.bounds;
    return (
      newState.x >= bounds.x &&
      newState.y >= bounds.y &&
      newState.x + newState.width <= bounds.x + bounds.width &&
      newState.y + newState.height <= bounds.y + bounds.height
    );
  });

  // Reset position if window is off-screen
  if (!visible) {
    delete newState.x;
    delete newState.y;
  }

  return newState;
}

/**
 * Save window state to disk
 * @param {BrowserWindow} window - Electron browser window
 */
function saveWindowState(window) {
  if (!window || window.isDestroyed()) return;

  const bounds = window.getBounds();
  const state = {
    isMaximized: window.isMaximized(),
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
  };

  try {
    fs.writeFileSync(WINDOW_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

/**
 * Create and configure the main application window
 * @returns {BrowserWindow} Configured Electron browser window
 */
function createMainWindow() {
  const windowState = loadWindowState();
  const validWindowState = ensureWindowVisible(windowState);

  const win = new BrowserWindow({
    width: validWindowState.width,
    height: validWindowState.height,
    minWidth: 400,
    minHeight: 300,
    x: validWindowState.x,
    y: validWindowState.y,
    frame: true,
    show: false,
    title: `GenMeta v${app.getVersion()}`,
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  // Debounced save to avoid excessive disk writes
  let saveTimeout = null;
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win), 500);
  };

  // Load the application and show window when ready
  win
    .loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
    .then(() => {
      if (validWindowState.isMaximized) {
        win.maximize();
      }
      win.show();
    })
    .catch((err) => {
      console.error('Failed to load application:', err);
    });

  // Save state on resize/move
  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);

  // Save state and quit on close if this is the last window
  win.on('close', () => {
    saveWindowState(win);
    if (BrowserWindow.getAllWindows().length <= 1) {
      app.quit();
    }
  });

  // Track focus state for internal use
  let isWindowFocused = true;
  win.on('focus', () => { isWindowFocused = true; });
  win.on('blur', () => { isWindowFocused = false; });

  // Extend window with custom message method
  win.showMessage = (message) => {
    if (!win.isDestroyed()) {
      win.webContents.send('message', message);
    }
  };

  // Add method to check combined focus state
  win.isWindowFocused = () => isWindowFocused && win.isFocused();

  // Build application menu
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  win.setMenuBarVisibility(false);

  // Add context menu on right-click
  win.webContents.on('context-menu', () => {
    const contextMenu = Menu.buildFromTemplate([
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ]);
    contextMenu.popup({ window: win });
  });

  return win;
}

module.exports = { createMainWindow };
