const { BrowserWindow, app, screen, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// =============================================================================
// Constants
// =============================================================================

/** Path for persisting window state between launches. */
const WINDOW_STATE_PATH = path.join(app.getPath("userData"), "window-state.json");

/** Default window dimensions and position when no saved state exists. */
const DEFAULT_WINDOW_STATE = {
  width: 1100,
  height: 800,
  isMaximized: false,
  x: undefined,
  y: undefined,
};

const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

// =============================================================================
// Window state persistence helpers
// =============================================================================

/**
 * Load saved window state from disk.
 *
 * @returns {Object} Window state object with dimensions and position.
 */
function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(WINDOW_STATE_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load window state:", err);
  }
  return DEFAULT_WINDOW_STATE;
}

/**
 * Ensure the window is visible on one of the available displays.
 * Resets position if the window would be off-screen.
 *
 * @param {Object} windowState - Current window state.
 * @returns {Object} Validated window state with safe position.
 */
function ensureWindowVisible(windowState) {
  const displays = screen.getAllDisplays();
  const newState = { ...windowState };

  // Enforce minimum dimensions
  newState.width = Math.max(newState.width, MIN_WIDTH);
  newState.height = Math.max(newState.height, MIN_HEIGHT);

  // Skip position validation if coordinates are undefined
  if (newState.x === undefined || newState.y === undefined) {
    return newState;
  }

  // Check whether the window fits within any display bounds
  const visible = displays.some((d) => {
    const bounds = d.bounds;
    return (
      newState.x >= bounds.x &&
      newState.y >= bounds.y &&
      newState.x + newState.width <= bounds.x + bounds.width &&
      newState.y + newState.height <= bounds.y + bounds.height
    );
  });

  // Reset position if the window is not visible on any display
  if (!visible) {
    delete newState.x;
    delete newState.y;
  }

  return newState;
}

/**
 * Save current window state to disk for persistence across launches.
 *
 * @param {BrowserWindow} win - Electron browser window.
 */
function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;

  const bounds = win.getBounds();
  const state = {
    isMaximized: win.isMaximized(),
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
  };

  try {
    fs.writeFileSync(WINDOW_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save window state:", err);
  }
}

// =============================================================================
// Main window creation
// =============================================================================

/**
 * Create and configure the main application window with state persistence,
 * event handling, and application menu setup.
 *
 * @returns {BrowserWindow} Configured Electron browser window.
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
    title: "GenMeta",
    icon: path.resolve(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  // Debounced window state saver to avoid excessive disk writes
  let saveTimeout = null;
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win), 500);
  };

  // Load the HTML file, then restore maximized state and show the window
  win
    .loadFile(path.join(__dirname, "index.html"))
    .then(() => {
      if (validWindowState.isMaximized) {
        win.maximize();
      }
      win.show();
    })
    .catch((err) => {
      console.error("Failed to load application:", err);
    });

  // Persist window state on resize, move, and close
  win.on("resize", debouncedSave);
  win.on("move", debouncedSave);
  win.on("close", () => {
    saveWindowState(win);

    // Quit the app if this is the last remaining window
    if (BrowserWindow.getAllWindows().length <= 1) {
      app.quit();
    }
  });

  // Track focus state for internal use
  let isWindowFocused = true;

  win.on("focus", () => {
    isWindowFocused = true;
  });

  win.on("blur", () => {
    isWindowFocused = false;
  });

  // Extend window with a helper method for sending IPC messages
  win.showMessage = (message) => {
    if (!win.isDestroyed()) {
      win.webContents.send("message", message);
    }
  };

  // Helper to check combined focus state
  win.isWindowFocused = () => isWindowFocused && win.isFocused();

  // ---------------------------------------------------------------------------
  // Application menu template
  // ---------------------------------------------------------------------------
  const template = [
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { role: "close" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Hide the menu bar by default (accessible via Alt key)
  win.setMenuBarVisibility(false);

  // ---------------------------------------------------------------------------
  // Context menu on right-click
  // ---------------------------------------------------------------------------
  win.webContents.on("context-menu", () => {
    const contextMenu = Menu.buildFromTemplate([
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ]);
    contextMenu.popup({ window: win });
  });

  return win;
}

module.exports = { createMainWindow };
