// Drag and Drop functionality
let dragCounter = 0;

// Helper function to check if the drag event contains files
function hasFiles(dataTransfer) {
  if (!dataTransfer || !dataTransfer.types) return false;

  // Check for Files type (most reliable)
  if (dataTransfer.types.includes("Files")) return true;

  // Check for application/x-moz-file (Firefox)
  if (dataTransfer.types.includes("application/x-moz-file")) return true;

  // Additional check for items property
  if (dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      if (dataTransfer.items[i].kind === "file") return true;
    }
  }

  return false;
}

// Helper function to update range input background based on value
function updateRangeBackground(rangeInput) {
  if (!rangeInput) return;

  const value = rangeInput.value;
  const min = rangeInput.min || 0;
  const max = rangeInput.max || 100;

  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;

  // Update background with dynamic gradient
  rangeInput.style.backgroundImage = `linear-gradient(to right,
    var(--primary-color) 0%,
    var(--primary-color) ${percentage}%,
    #575656 ${percentage}%,
    #575656 100%)`;
}

// Helper functions for keyword format button groups
function setKeywordFormat(group, format) {
  if (!group) return;

  const buttons = group.querySelectorAll(".keyword-format-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.format === format) {
      btn.classList.add("active");
    }
  });
}

function getKeywordFormat(group) {
  if (!group) return "auto";

  const activeBtn = group.querySelector(".keyword-format-btn.active");
  return activeBtn ? activeBtn.dataset.format : "auto";
}

function initializeKeywordFormatGroup(group, onChange) {
  if (!group) return;

  const buttons = group.querySelectorAll(".keyword-format-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setKeywordFormat(group, btn.dataset.format);
      if (onChange) onChange(btn.dataset.format);
    });
  });
}

// Helper functions for title length mode
function setTitleLengthMode(mode) {
  // Update settings dialog buttons
  if (elements.settingsTitleModeFixed && elements.settingsTitleModeAuto) {
    elements.settingsTitleModeFixed.classList.toggle(
      "active",
      mode === "fixed",
    );
    elements.settingsTitleModeAuto.classList.toggle("active", mode === "auto");

    // Enable/disable range container
    if (elements.settingsTitleLengthContainer) {
      elements.settingsTitleLengthContainer.classList.toggle(
        "disabled",
        mode === "auto",
      );
    }
  }

  // Update initial state buttons
  if (elements.initialTitleModeFixed && elements.initialTitleModeAuto) {
    elements.initialTitleModeFixed.classList.toggle("active", mode === "fixed");
    elements.initialTitleModeAuto.classList.toggle("active", mode === "auto");

    // Enable/disable range container
    if (elements.initialTitleLengthContainer) {
      elements.initialTitleLengthContainer.classList.toggle(
        "disabled",
        mode === "auto",
      );
    }
  }
}

function getTitleLengthMode() {
  if (
    elements.settingsTitleModeAuto &&
    elements.settingsTitleModeAuto.classList.contains("active")
  ) {
    return "auto";
  }
  return "fixed";
}

function getTitleLengthModeFromInitialState() {
  if (
    elements.initialTitleModeAuto &&
    elements.initialTitleModeAuto.classList.contains("active")
  ) {
    return "auto";
  }
  return "fixed";
}

function initializeDragAndDrop() {
  const dragOverlay = document.getElementById("drag-drop-overlay");
  const body = document.body;

  // Helper function to prevent defaults only for file drag operations
  function preventDefaults(e) {
    // Only prevent defaults if files are being dragged or if we're not in an input/textarea
    if (hasFiles(e.dataTransfer) || !isTextInputElement(e.target)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  // Helper function to check if the target is a text input element
  function isTextInputElement(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const inputType = element.type ? element.type.toLowerCase() : "";

    return (
      tagName === "textarea" ||
      (tagName === "input" &&
        (inputType === "text" ||
          inputType === "password" ||
          inputType === "email" ||
          inputType === "search" ||
          inputType === "url" ||
          inputType === "tel" ||
          inputType === "")) || // default input type is text
      element.contentEditable === "true"
    );
  }

  // Add event listeners with conditional prevention
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.addEventListener(eventName, preventDefaults, false);
  });

  // Handle drag enter
  document.addEventListener("dragenter", function (e) {
    // Don't interfere with text selection in input elements
    if (isTextInputElement(e.target)) {
      return;
    }

    dragCounter++;
    if (dragCounter === 1) {
      // Only show overlay if files are being dragged
      if (hasFiles(e.dataTransfer)) {
        dragOverlay.classList.remove("hidden");
        dragOverlay.classList.add("visible");
        body.classList.add("drag-active");
      }
    }
  });

  // Handle drag over
  document.addEventListener("dragover", function (e) {
    // Don't interfere with text selection in input elements
    if (isTextInputElement(e.target)) {
      return;
    }

    // Only show drag-over effect if files are being dragged and overlay is visible
    if (hasFiles(e.dataTransfer) && dragOverlay.classList.contains("visible")) {
      dragOverlay.classList.add("drag-over");
    }
  });

  // Handle drag leave
  document.addEventListener("dragleave", function (e) {
    // Don't interfere with text selection in input elements
    if (isTextInputElement(e.target)) {
      return;
    }

    dragCounter--;
    if (dragCounter === 0) {
      hideDragOverlay();
    }
    dragOverlay.classList.remove("drag-over");
  });

  // Handle drop
  document.addEventListener("drop", function (e) {
    // Don't interfere with text selection in input elements
    if (isTextInputElement(e.target)) {
      return;
    }

    dragCounter = 0;
    hideDragOverlay();

    // Only handle file drops
    if (
      e.dataTransfer &&
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      const files = Array.from(e.dataTransfer.files);
      handleDroppedFiles(files);
    }
  });

  function hideDragOverlay() {
    dragOverlay.classList.remove("visible", "drag-over");
    dragOverlay.classList.add("hidden");
    body.classList.remove("drag-active");
  }

  async function handleDroppedFiles(files) {
    // Get the file paths from the dropped files using webUtils
    const droppedPaths = [];

    // Extract paths from the files using the secure webUtils API
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Use webUtils.getPathForFile for secure path access
        const filePath = await window.electronAPI.files.getPathForFile(file);
        if (filePath) {
          droppedPaths.push(filePath);
        }
      } catch (error) {
        console.error("Error getting path for file:", error);
        // Fallback to file.path if available (for older Electron versions)
        if (file.path) {
          droppedPaths.push(file.path);
        }
      }
    }

    if (droppedPaths.length > 0) {
      try {
        // Process the dropped files through the main process
        const results =
          await window.electronAPI.files.processDroppedFiles(droppedPaths);

        if (results && results.length > 0) {
          // Handle the results
          const directories = results.filter((r) => r.type === "directory");
          const files = results.filter((r) => r.type === "file");

          if (directories.length > 0) {
            // Use the first directory
            const dir = directories[0];
            updateSelectedPath(dir.path, "directory", dir.imageCount);

            // Update global selectedPath variable if it exists
            if (typeof selectedPath !== "undefined") {
              selectedPath = dir.path;
              selectedFiles = null;
              updateSelectionState();
            }
          } else if (files.length > 0) {
            // Handle multiple files
            const filePaths = files.map((f) => f.path);
            const parentDir = files[0].directory;
            updateSelectedPath(filePaths, "files", files.length);

            // Update global variables if they exist
            if (typeof selectedPath !== "undefined") {
              selectedPath = parentDir;
              selectedFiles = files.map((f) => ({
                filename: f.filename,
                path: f.path,
              }));
              updateSelectionState();
            }
          }
        } else {
          console.warn("No supported files found in dropped items");
          // Show a message to the user
          updateSelectedPath("No supported files found", "error");
        }
      } catch (error) {
        console.error("Error processing dropped files:", error);
        updateSelectedPath("Error processing dropped files", "error");
      }
    }
  }

  function updateSelectedPath(paths, type, count) {
    const pathDisplay = document.getElementById("selected-path");
    const imageCount = document.getElementById("image-count");

    if (!pathDisplay || !imageCount) return;

    if (type === "directory") {
      pathDisplay.textContent = paths;
      imageCount.textContent = `${count || 0} Files`;
      imageCount.style.display = "flex";
    } else if (type === "files") {
      if (Array.isArray(paths)) {
        if (paths.length === 1) {
          // Show parent folder path for single file
          const parentPath = paths[0]
            .split(/[\\/]/)
            .slice(0, -1)
            .join(paths[0].includes("/") ? "/" : "\\");
          pathDisplay.textContent = parentPath;
        } else {
          // For multiple files, show the common parent directory if they're from the same folder
          // Otherwise show the first file's parent directory
          const parentPath = paths[0]
            .split(/[\\/]/)
            .slice(0, -1)
            .join(paths[0].includes("/") ? "/" : "\\");
          pathDisplay.textContent = parentPath;
        }
        imageCount.textContent = `${count || paths.length} Files`;
        imageCount.style.display = "flex";
      }
    } else if (type === "error") {
      pathDisplay.textContent = `Error: ${paths}`;
      imageCount.textContent = "Error";
      imageCount.style.display = "flex";
    }
  }
}

// Initialize drag and drop when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeDragAndDrop();
});

// Helper function to check if an error is Ghostscript related
function checkGhostscriptError(errorMessage) {
  if (!errorMessage) return false;
  return (
    errorMessage.includes("Ghostscript not found") ||
    errorMessage.includes("Cannot convert EPS file") ||
    (errorMessage.includes("gs") && errorMessage.includes("not found")) ||
    errorMessage.includes("EPS conversion failed") ||
    errorMessage.includes("Error converting EPS") ||
    errorMessage.includes("Valid Ghostscript path is required")
  );
}

// Helper function to check if a file is a video
function isVideoFile(filename) {
  if (!filename) return false;
  const videoExtensions = [".mp4", ".mov"];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return videoExtensions.includes(ext);
}

// Function to toggle video play/pause
function toggleVideoPlayPause(videoId) {
  const video = document.getElementById(videoId);
  const button = video.parentElement.querySelector(".video-play-pause-btn i");

  if (video.paused) {
    video.play();
    button.className = "fas fa-pause";
  } else {
    video.pause();
    button.className = "fas fa-play";
  }
}

// Make the function globally accessible
window.toggleVideoPlayPause = toggleVideoPlayPause;

// Add event listeners for video events when videos are loaded
function setupVideoEventListeners(videoElement) {
  const button = videoElement.parentElement.querySelector(
    ".video-play-pause-btn i",
  );

  videoElement.addEventListener("play", () => {
    button.className = "fas fa-pause";
  });

  videoElement.addEventListener("pause", () => {
    button.className = "fas fa-play";
  });

  videoElement.addEventListener("ended", () => {
    button.className = "fas fa-play";
  });

  // Hide controls overlay when video is playing, show when paused
  const overlay = videoElement.parentElement.querySelector(
    ".video-controls-overlay",
  );

  videoElement.addEventListener("play", () => {
    overlay.style.opacity = "0";
  });

  videoElement.addEventListener("pause", () => {
    overlay.style.opacity = "1";
  });

  videoElement.addEventListener("ended", () => {
    overlay.style.opacity = "1";
  });

  // Show overlay on hover
  videoElement.parentElement.addEventListener("mouseenter", () => {
    overlay.style.opacity = "1";
  });

  videoElement.parentElement.addEventListener("mouseleave", () => {
    if (!videoElement.paused) {
      overlay.style.opacity = "0";
    }
  });
}

// Helper function to generate preview HTML for files
function generatePreviewHTML(result) {
  const isVideo = result.isVideo || isVideoFile(result.filename);
  // For videos, prefer originalPath since outputPath might be the same file
  const previewPath = isVideo
    ? result.originalPath || result.outputPath || result.path
    : result.previewPath ||
      result.outputPath ||
      result.path ||
      result.originalPath;

  if (isVideo) {
    const videoId = `video-${Math.random().toString(36).substr(2, 9)}`;
    return `
      <div class="custom-video-container">
        <video id="${videoId}" src="${previewPath}" class="preview-video" muted preload="metadata">
          Your browser does not support the video tag.
        </video>
        <div class="video-controls-overlay">
          <button class="video-play-pause-btn" onclick="toggleVideoPlayPause('${videoId}')">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>`;
  } else {
    return `<img src="${previewPath}" alt="${result.filename}" class="preview-image" loading="lazy" >`;
  }
}

// Helper function to generate error preview HTML
function generateErrorPreviewHTML(errorResult) {
  const isVideo = errorResult.isVideo || isVideoFile(errorResult.filename);
  const previewPath =
    errorResult.originalPath || "./assets/images/error-placeholder.png";

  if (isVideo && errorResult.originalPath) {
    const videoId = `error-video-${Math.random().toString(36).substr(2, 9)}`;
    return `
      <div class="custom-video-container">
        <video id="${videoId}" src="${previewPath}" class="preview-video" muted preload="metadata">
          Your browser does not support the video tag.
        </video>
        <div class="video-controls-overlay">
          <button class="video-play-pause-btn" onclick="toggleVideoPlayPause('${videoId}')">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>`;
  } else {
    return `<img src="${previewPath}" alt="Error" class="preview-image" onerror="this.src='./assets/images/error-placeholder.png'" loading="lazy">`;
  }
}

let selectedPath = null;
let outputDirectory = null;
let selectedFiles = null;
let currentPlanName = null;

// Global variable to track modified metadata
let modifiedMetadata = new Set();

// Function to update submit button state and selection display
function updateSelectionState() {
  const hasSelection =
    selectedPath !== null || (selectedFiles && selectedFiles.length > 0);

  // Update initial generate button state
  if (elements.initialGenerateBtn) {
    // elements.initialGenerateBtn.disabled = !hasSelection;
    elements.initialGenerateBtn.disabled = false; // Always enabled to allow settings adjustment
  }

  // Update clear button state
  if (elements.clearStateBtn) {
    elements.clearStateBtn.disabled = !hasSelection;
  }

  // Update initial state selection display
  if (elements.selectedCount) {
    if (selectedFiles && selectedFiles.length > 0) {
      elements.selectedCount.textContent = selectedFiles.length;
    } else if (selectedPath) {
      // For folder selection, we'll show the count from imageCount element
      const imageCountText = elements.imageCount
        ? elements.imageCount.textContent
        : "0";
      const count = imageCountText.replace(/[^\d]/g, "") || "0";
      elements.selectedCount.textContent = count;
    } else {
      elements.selectedCount.textContent = "0";
    }
  }

  if (selectedFiles && selectedFiles.length > 0) {
    showFilePreview(selectedFiles);
  } else if (selectedPath) {
    // Show folder preview when a folder is selected
    showFolderPreview(selectedPath);
  } else {
    hideFilePreview();
  }

  // Update selection path display
  if (elements.selectionPathDisplay) {
    if (selectedFiles && selectedFiles.length > 0) {
      if (selectedFiles.length === 1) {
        // Show parent folder path for single file
        const filePath = selectedFiles[0].path;
        const parentPath = filePath
          .split(/[\\/]/)
          .slice(0, -1)
          .join(filePath.includes("/") ? "/" : "\\");
        elements.selectionPathDisplay.textContent = parentPath;
      } else {
        // Show parent folder path for multiple files (use first file's parent)
        const filePath = selectedFiles[0].path;
        const parentPath = filePath
          .split(/[\\/]/)
          .slice(0, -1)
          .join(filePath.includes("/") ? "/" : "\\");
        elements.selectionPathDisplay.textContent = parentPath;
      }
    } else if (selectedPath) {
      elements.selectionPathDisplay.textContent = selectedPath;
    } else {
      elements.selectionPathDisplay.textContent = "No Selection";
    }
  }
}

// Function to show file previews
function showFilePreview(files) {
  const previewSection = document.getElementById("file-preview-section");
  const selectionActions = document.querySelector(".selection-actions");
  const previewGrid = document.getElementById("file-preview-grid");
  const moreFilesIndicator = document.getElementById("more-files-indicator");
  const moreFilesCount = document.getElementById("more-files-count");

  if (!previewSection || !selectionActions || !previewGrid) return;

  // Hide selection actions and show preview section
  selectionActions.classList.add("hidden");
  previewSection.classList.remove("hidden");

  // Clear existing previews
  previewGrid.innerHTML = "";

  // Show up to 12 files
  const filesToShow = files.slice(0, 12);
  const remainingCount = files.length - 12;

  filesToShow.forEach((file) => {
    const previewItem = createFilePreviewItem(file);
    previewGrid.appendChild(previewItem);
  });

  // Show "X more" indicator if there are more than 4 files
  if (remainingCount > 0) {
    moreFilesCount.textContent = `+${remainingCount} more`;
    moreFilesIndicator.classList.remove("hidden");
  } else {
    moreFilesIndicator.classList.add("hidden");
  }
}

// Function to create a file preview item
function createFilePreviewItem(file) {
  const item = document.createElement("div");
  item.className = "file-preview-item";

  const filename = file.name || file.path.split(/[\\/]/).pop();
  const extension = filename.toLowerCase().split(".").pop();

  // Create thumbnail or placeholder
  let thumbnailElement;
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    thumbnailElement = document.createElement("img");
    thumbnailElement.className = "file-preview-thumbnail";
    thumbnailElement.src = file.path;
    thumbnailElement.alt = filename;
    thumbnailElement.onerror = function () {
      // If image fails to load, replace with placeholder
      this.outerHTML =
        '<div class="file-preview-placeholder"><i class="fas fa-image"></i></div>';
    };
  } else if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    thumbnailElement = document.createElement("div");
    thumbnailElement.className = "file-preview-placeholder";
    thumbnailElement.innerHTML = '<i class="fas fa-video"></i>';
  } else if (extension === "eps") {
    thumbnailElement = document.createElement("div");
    thumbnailElement.className = "file-preview-placeholder";
    thumbnailElement.innerHTML = '<i class="fas fa-file-image"></i>';
  } else {
    thumbnailElement = document.createElement("div");
    thumbnailElement.className = "file-preview-placeholder";
    thumbnailElement.innerHTML = '<i class="fas fa-file"></i>';
  }

  item.appendChild(thumbnailElement);

  return item;
}

// Function to hide file preview and show selection actions
function hideFilePreview() {
  const previewSection = document.getElementById("file-preview-section");
  const selectionActions = document.querySelector(".selection-actions");
  const previewGrid = document.getElementById("file-preview-grid");
  const moreFilesIndicator = document.getElementById("more-files-indicator");

  if (previewSection && selectionActions) {
    previewSection.classList.add("hidden");
    selectionActions.classList.remove("hidden");

    // Clear preview content
    if (previewGrid) {
      previewGrid.innerHTML = "";
    }
    if (moreFilesIndicator) {
      moreFilesIndicator.classList.add("hidden");
    }
  }
}

// Function to show folder preview
async function showFolderPreview(folderPath) {
  const previewSection = document.getElementById("file-preview-section");
  const selectionActions = document.querySelector(".selection-actions");
  const previewGrid = document.getElementById("file-preview-grid");
  const moreFilesIndicator = document.getElementById("more-files-indicator");
  const moreFilesCount = document.getElementById("more-files-count");

  if (!previewSection || !selectionActions || !previewGrid) {
    return;
  }

  // Hide selection actions and show preview section
  selectionActions.classList.add("hidden");
  previewSection.classList.remove("hidden");

  // Clear existing previews
  previewGrid.innerHTML = "";

  // Always try to get files from the folder for preview
  try {
    const result = await window.electronAPI.files.getFolderPreview(folderPath);

    if (result && result.files && result.files.length > 0) {
      // Show actual files from the folder
      const filesToShow = result.files.slice(0, 12);
      const remainingCount = Math.max(0, result.totalCount - 12);

      filesToShow.forEach((file) => {
        const previewItem = createFilePreviewItem(file);
        previewGrid.appendChild(previewItem);
      });

      // Show "X more" indicator if there are more than 4 files
      if (remainingCount > 0) {
        moreFilesCount.textContent = `+${remainingCount} more`;
        moreFilesIndicator.classList.remove("hidden");
      } else {
        moreFilesIndicator.classList.add("hidden");
      }
    } else {
      // Show empty state if no supported files found
      showEmptyFolderState(folderPath);
    }
  } catch (error) {
    console.error("Error getting folder preview:", error);
    // Show error state
    showEmptyFolderState(folderPath, "Error loading folder contents");
  }
}

// Function to show empty folder state when no files are found
function showEmptyFolderState(folderPath, errorMessage = null) {
  const previewGrid = document.getElementById("file-preview-grid");
  const moreFilesIndicator = document.getElementById("more-files-indicator");

  if (!previewGrid) return;

  // Clear existing previews
  previewGrid.innerHTML = "";

  // Create an empty state message
  const emptyState = document.createElement("div");
  emptyState.className = "empty-folder-state";
  emptyState.style.cssText = `
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    color: var(--text-secondary, #666);
    font-size: 14px;
  `;

  const folderName = folderPath.split(/[\\/]/).pop() || "Selected Folder";

  if (errorMessage) {
    emptyState.innerHTML = `
      <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
      ${errorMessage}
    `;
  } else {
    emptyState.innerHTML = `
      <i class="fas fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
      No supported files found in "${folderName}"
    `;
  }

  previewGrid.appendChild(emptyState);

  // Hide more files indicator
  if (moreFilesIndicator) {
    moreFilesIndicator.classList.add("hidden");
  }
}

const elements = {
  // API Key Banner elements
  apiKeyBanner: document.getElementById("api-key-banner"),
  configureApiBtn: document.getElementById("configure-api-btn"),

  selectedPath: document.getElementById("selected-path"),
  imageCount: document.getElementById("image-count"),
  clearStateBtn: document.getElementById("clear-state-btn"),
  clearSelectionBtn: document.getElementById("clear-selection-btn"),

  // Initial state selection elements
  initialSelectFilesBtn: document.getElementById("initial-select-files-btn"),
  initialSelectFolderBtn: document.getElementById("initial-select-folder-btn"),
  initialGenerateBtn: document.getElementById("initial-generate-btn"),
  initialMicrostockSelect: document.getElementById("initial-microstock-select"),
  initialGeminiModelSelect: document.getElementById(
    "initial-gemini-model-select",
  ),
  aiAgentSelect: document.getElementById("ai-agent-select"),
  selectedCount: document.getElementById("selected-count"),
  selectionPathDisplay: document.getElementById("selection-path-display"),

  configForm: document.getElementById("config-form"),
  apiKey: document.getElementById("api-key"),
  titleLength: document.getElementById("title-length"),
  titleLengthValue: document.getElementById("title-length-value"),
  initialTitleModeFixed: document.getElementById("initial-title-mode-fixed"),
  initialTitleModeAuto: document.getElementById("initial-title-mode-auto"),
  initialTitleLengthContainer: document.getElementById(
    "initial-title-length-container",
  ),
  descLength: document.getElementById("desc-length"),
  descLengthValue: document.getElementById("desc-length-value"),
  keywordCount: document.getElementById("keyword-count"),
  keywordCountValue: document.getElementById("keyword-count-value"),
  isPremium: document.getElementById("is-premium"),

  stopBtn: document.getElementById("stop-btn"),
  regenerateBtn: document.getElementById("regenerate-btn"),

  // Add secret key elements
  settingsSecretKey: document.getElementById("settings-secret-key"),
  toggleSecretKey: document.getElementById("toggle-secret-key"),

  // Add API key elements
  settingsApiKey: document.getElementById("settings-api-key-1"), // Keep for backward compatibility
  settingsApiKey1: document.getElementById("settings-api-key-1"),
  settingsApiKey2: document.getElementById("settings-api-key-2"),
  settingsApiKey3: document.getElementById("settings-api-key-3"),
  settingsApiKey4: document.getElementById("settings-api-key-4"),
  settingsApiKey5: document.getElementById("settings-api-key-5"),
  settingsApiKey6: document.getElementById("settings-api-key-6"),
  settingsApiKey7: document.getElementById("settings-api-key-7"),
  settingsApiKey8: document.getElementById("settings-api-key-8"),
  settingsApiKey9: document.getElementById("settings-api-key-9"),
  settingsApiKey10: document.getElementById("settings-api-key-10"),
  settingsAiApiKey: document.getElementById("settings-ai-api-key"),
  toggleApiKey1: document.getElementById("toggle-api-key-1"),
  toggleApiKey2: document.getElementById("toggle-api-key-2"),
  toggleApiKey3: document.getElementById("toggle-api-key-3"),
  toggleApiKey4: document.getElementById("toggle-api-key-4"),
  toggleApiKey5: document.getElementById("toggle-api-key-5"),
  toggleApiKey6: document.getElementById("toggle-api-key-6"),
  toggleApiKey7: document.getElementById("toggle-api-key-7"),
  toggleApiKey8: document.getElementById("toggle-api-key-8"),
  toggleApiKey9: document.getElementById("toggle-api-key-9"),
  toggleApiKey10: document.getElementById("toggle-api-key-10"),
  toggleAiApiKey: document.getElementById("toggle-ai-api-key"),
  getApiKeyBtn: document.getElementById("get-api-key-btn"),

  // Theme toggle element
  settingsDarkMode: document.getElementById("settings-dark-mode"),
  settingsEnableNotifications: document.getElementById(
    "settings-enable-notifications",
  ),

  // Login elements
  loginDialog: document.getElementById("login-dialog"),
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  toggleLoginPassword: document.getElementById("toggle-login-password"),
  loginBtn: document.getElementById("login-btn"),
  googleLoginBtn: document.getElementById("google-login-btn"),
  guestLoginBtn: document.getElementById("guest-login-btn"),

  resultsPanel: document.getElementById("results-panel"),
  progressContainer: document.getElementById("progress-container"),
  progressStatus: document.getElementById("progress-status"),
  progressCount: document.getElementById("progress-count"),
  progressBar: document.getElementById("progress-bar"),

  resultsSummary: document.getElementById("results-summary"),
  totalCount: document.getElementById("total-count"),
  successCount: document.getElementById("success-count"),
  failedCount: document.getElementById("failed-count"),
  outputDir: document.getElementById("output-dir"),
  exportCsvBtn: document.getElementById("export-csv-btn"),

  // Common keyword elements
  commonKeywordBtn: document.getElementById("common-keyword-btn"),
  commonKeywordDialog: document.getElementById("common-keyword-dialog"),
  closeKeywordDialog: document.getElementById("close-keyword-dialog"),
  cancelKeyword: document.getElementById("cancel-keyword"),
  applyKeyword: document.getElementById("apply-keyword"),
  commonKeywordForm: document.getElementById("common-keyword-form"),
  commonKeyword: document.getElementById("common-keyword"),
  customPositionGroup: document.getElementById("custom-position-group"),
  customPosition: document.getElementById("custom-position"),
  keywordPositionRadios: document.getElementsByName("keyword-position"),

  // Retry failed elements
  retryFailedBtn: document.getElementById("retry-failed-btn"),

  // Bulk edit tabs and fields
  bulkEditTabs: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Title bulk edit elements
  titleAction: document.getElementsByName("title-action"),
  bulkTitleText: document.getElementById("bulk-title-text"),
  titleReplaceText: document.getElementById("title-replace-text"),
  titleSearchText: document.getElementById("title-search-text"),
  titlePositionGroup: document.getElementById("title-position-group"),
  titlePosition: document.getElementById("title-position"),
  titlePositionOptions: document.getElementById("title-position-options"),
  titlePositionRadios: document.getElementsByName("title-position-type"),

  // Description bulk edit elements
  descriptionAction: document.getElementsByName("description-action"),
  bulkDescriptionText: document.getElementById("bulk-description-text"),
  descriptionReplaceText: document.getElementById("description-replace-text"),
  descriptionSearchText: document.getElementById("description-search-text"),
  descriptionPositionGroup: document.getElementById(
    "description-position-group",
  ),
  descriptionPosition: document.getElementById("description-position"),
  descriptionPositionOptions: document.getElementById(
    "description-position-options",
  ),
  descriptionPositionRadios: document.getElementsByName(
    "description-position-type",
  ),

  // API validation dialog elements
  apiValidationDialog: document.getElementById("api-validation-dialog"),
  closeApiValidationDialog: document.getElementById(
    "close-api-validation-dialog",
  ),
  closeApiValidationBtn: document.getElementById("close-api-validation-btn"),
  openSettingsFromValidationBtn: document.getElementById(
    "open-settings-from-validation-btn",
  ),

  resultsList: document.getElementById("results-list"),
  noResults: document.getElementById("no-results"),
  initialState: document.getElementById("initial-state"),

  settingsBtn: document.getElementById("settings-btn"),
  settingsDialog: document.getElementById("settings-dialog"),
  closeSettings: document.getElementById("close-settings"),
  cancelSettings: document.getElementById("cancel-settings"),
  saveSettings: document.getElementById("save-settings"),
  logoutBtn: document.getElementById("logout-btn"),
  settingsForm: document.getElementById("settings-form"),
  settingsTitleLength: document.getElementById("settings-title-length"),
  settingsTitleLengthValue: document.getElementById(
    "settings-title-length-value",
  ),
  settingsTitleModeFixed: document.getElementById("settings-title-mode-fixed"),
  settingsTitleModeAuto: document.getElementById("settings-title-mode-auto"),
  settingsTitleLengthContainer: document.getElementById(
    "settings-title-length-container",
  ),
  settingsDescLength: document.getElementById("settings-desc-length"),
  settingsDescLengthValue: document.getElementById(
    "settings-desc-length-value",
  ),
  settingsKeywordCount: document.getElementById("settings-keyword-count"),
  settingsKeywordCountValue: document.getElementById(
    "settings-keyword-count-value",
  ),
  settingsIsPremium: document.getElementById("settings-is-premium"),
  settingsCreateJpgCopy: document.getElementById("settings-create-jpg-copy"),
  settingsCreatePngCopy: document.getElementById("settings-create-png-copy"),
  settingsAddPeriodTitle: document.getElementById("settings-add-period-title"),
  settingsAddPeriodDescription: document.getElementById(
    "settings-add-period-description",
  ),
  settingsEnableShutterstockCategories: document.getElementById(
    "settings-enable-shutterstock-categories",
  ),
  settingsEnableAdobeStockCategories: document.getElementById(
    "settings-enable-adobe-stock-categories",
  ),

  // Positive and negative keywords settings
  settingsPositiveKeywords: document.getElementById(
    "settings-positive-keywords",
  ),
  settingsPositiveKeywordsTargetKeywords: document.getElementById(
    "settings-positive-keywords-target-keywords",
  ),
  settingsPositiveKeywordsTargetAll: document.getElementById(
    "settings-positive-keywords-target-all",
  ),
  settingsPositiveKeywordsFiletypeJpg: document.getElementById(
    "settings-positive-keywords-filetype-jpg",
  ),
  settingsPositiveKeywordsFiletypePng: document.getElementById(
    "settings-positive-keywords-filetype-png",
  ),
  settingsPositiveKeywordsFiletypeEps: document.getElementById(
    "settings-positive-keywords-filetype-eps",
  ),
  settingsKeywordFormatGroup: document.getElementById(
    "settings-keyword-format-group",
  ),
  settingsNegativeKeywords: document.getElementById(
    "settings-negative-keywords",
  ),

  // Advanced settings elements
  settingsGeminiModel: document.getElementById("settings-gemini-model"),
  settingsEnableCustomPrompt: document.getElementById(
    "settings-enable-custom-prompt",
  ),
  settingsCustomPrompt: document.getElementById("settings-custom-prompt"),
  customPromptContainer: document.getElementById("custom-prompt-container"),

  helpBtn: document.getElementById("help-btn"),
  helpDialog: document.getElementById("help-dialog"),
  closeHelpDialogBtn: document.getElementById("close-help-dialog"),
  closeHelpBtn: document.getElementById("close-help-btn"),

  // Initial state elements
  initialTitleLength: document.getElementById("initial-title-length"),
  initialTitleLengthValue: document.getElementById(
    "initial-title-length-value",
  ),
  initialDescLength: document.getElementById("initial-desc-length"),
  initialDescLengthValue: document.getElementById("initial-desc-length-value"),
  initialKeywordCount: document.getElementById("initial-keyword-count"),
  initialKeywordCountValue: document.getElementById(
    "initial-keyword-count-value",
  ),
  initialKeywordFormatGroup: document.getElementById(
    "initial-keyword-format-group",
  ),
  initialEditKeywordsBtn: document.getElementById("initial-edit-keywords-btn"),
  initialPositiveTags: document.getElementById("initial-positive-tags"),
  initialNegativeTags: document.getElementById("initial-negative-tags"),
  aiSectionBtn: document.querySelector(
    '.settings-menu-item[data-section="ai-section"]',
  ),

  // Status message display
  statusMessage: document.getElementById("status-message"),

  // API status display
  apiStatus: document.getElementById("api-status"),
  apiExpires: document.getElementById("api-expires"),
  apiPlan: document.getElementById("api-plan"),
  apiCredits: document.getElementById("api-credits"),

  // Update dialog elements
  updateDialog: document.getElementById("update-dialog"),
  closeUpdateDialog: document.getElementById("close-update-dialog"),

  // API Validation dialog elements
  apiValidationErrorDetails: document.getElementById(
    "api-validation-error-details",
  ),

  // New version text
  newVersionText: document.getElementById("new-version"),
  releaseNotes: document.getElementById("release-notes"),
  downloadUpdateBtn: document.getElementById("download-update-btn"),
  laterUpdateBtn: document.getElementById("later-update-btn"),
  installUpdateBtn: document.getElementById("install-update-btn"),
  updateProgressContainer: document.getElementById("update-progress-container"),
  updateProgressBar: document.getElementById("update-progress-bar"),
  updateProgressText: document.getElementById("update-progress-text"),

  // Development mode elements
  devUpdateCheck: document.getElementById("dev-update-check"),
  checkUpdateBtn: document.getElementById("check-update-btn"),

  // Add refer button element
  referBtn: document.getElementById("refer-btn"),

  geminiApiKeyGroup: document.getElementById("gemini-api-key-group"),
  aiApiKeyGroup: document.getElementById("ai-api-key-group"),

  // Add rename files elements
  renameFilesBtn: document.getElementById("rename-files-btn"),
  renameFilesDialog: document.getElementById("rename-files-dialog"),
  closeRenameDialog: document.getElementById("close-rename-dialog"),
  cancelRename: document.getElementById("cancel-rename"),
  applyRename: document.getElementById("apply-rename"),
  renameForm: document.getElementById("rename-files-form"),
  renameTypeRadios: document.getElementsByName("rename-type"),
  renameAddPrefix: document.getElementById("rename-add-prefix"),

  // Update check popup elements
  updateCheckIconBtn: document.getElementById("update-check-icon-btn"),
  updateCheckPopup: document.getElementById("update-check-popup"),
  closeUpdateCheckPopup: document.getElementById("close-update-check-popup"),
  updateCheckCloseBtn: document.getElementById("update-check-close-btn"),
  updateCheckLoading: document.getElementById("update-check-loading"),
  updateCheckResult: document.getElementById("update-check-result"),
  updateCheckDownloadBtn: document.getElementById("update-check-download-btn"),
  updateCheckInstallBtn: document.getElementById("update-check-install-btn"),

  // Keyword input elements
  positiveKeywordInput: document.getElementById("positive-keyword-input"),
  negativeKeywordInput: document.getElementById("negative-keyword-input"),
  addPositiveKeywordBtn: document.getElementById("add-positive-keyword-btn"),
  addNegativeKeywordBtn: document.getElementById("add-negative-keyword-btn"),
  positiveKeywordsContainer: document.getElementById(
    "positive-keywords-container",
  ),
  negativeKeywordsContainer: document.getElementById(
    "negative-keywords-container",
  ),
  positiveKeywordTarget: document.getElementById("positive-keyword-target"),
  filetypeDropdown: document.getElementById("filetype-dropdown"),
  filetypeCheckboxes: document.querySelectorAll(
    "#filetype-dropdown input[type='checkbox']",
  ),

  // Profile dropdown elements
  profileBtn: document.getElementById("profile-btn"),
  profileDropdown: document.getElementById("profile-dropdown"),
  profileName: document.getElementById("profile-name"),
  profileEmail: document.getElementById("profile-email"),
  profilePlan: document.getElementById("profile-plan"),
  profileExpiry: document.getElementById("profile-expiry"),
  profileCredits: document.getElementById("profile-credits"),
  profileExpiryItem: document.getElementById("profile-expiry-item"),
  profileCreditsItem: document.getElementById("profile-credits-item"),
};

// Make elements object globally accessible
window.elements = elements;

elements.configureApiBtn.addEventListener("click", () => {
  showSettingsWithTab("system-section");
});

// Add event listener for the refer button in the status bar
if (elements.referBtn) {
  elements.referBtn.addEventListener("click", async () => {
    const result = await window.electronAPI.openExternal("https://genmeta.app/dashboard/referral");
    if (!result.success) {
      showToastNotification("Could not open browser. Please check your default browser settings.", "error", 6000);
    }
  });
}

// Add event listeners for the help button and dialog
function openHelpDialog() {
  if (elements.helpDialog) {
    elements.helpDialog.classList.add("active");
  }
}

function closeHelpDialog() {
  if (elements.helpDialog) {
    elements.helpDialog.classList.remove("active");
  }
}

if (elements.helpBtn) {
  elements.helpBtn.addEventListener("click", openHelpDialog);
}

if (elements.closeHelpDialogBtn) {
  elements.closeHelpDialogBtn.addEventListener("click", closeHelpDialog);
}

if (elements.closeHelpBtn) {
  elements.closeHelpBtn.addEventListener("click", closeHelpDialog);
}

// Initialize the app
async function initApp() {
  try {
    // Initialize the Ghostscript installer first to create dynamic elements
    if (typeof window.initGhostscriptInstaller === "function") {
      window.initGhostscriptInstaller();
    }

    // Load settings after dynamic elements are created
    await loadSettings();

    // Check API status if logged in
    const isLoggedIn = await window.electronAPI.auth.checkLoginStatus();
    if (isLoggedIn) {
      // Check if this is a guest session
      const isGuest = await window.electronAPI.auth.checkGuestSession();
      if (isGuest) {
        // Guest session - show full premium status immediately
        updateStatusBarForGuest();
        const guestInfo = await window.electronAPI.auth.getGuestInfo();
        if (guestInfo) {
          updateProfileDropdownForGuest({
            guestName: guestInfo.guestName || "Guest User",
            guestEmail: guestInfo.guestEmail || "guest@genmeta.local",
            planType: "Premium",
            credits: "Unlimited",
            isUnlimited: true,
          });
        }
        // Show profile button
        if (elements.profileBtn) {
          elements.profileBtn.style.display = "flex";
        }
      } else {
        // Regular logged in user - check API status
        // Set initial loading state for status elements
        if (elements.apiStatus) {
          elements.apiStatus.textContent = "checking...";
          elements.apiStatus.className = "status-unknown";
        }
        if (elements.apiPlan) {
          elements.apiPlan.textContent = "checking...";
          elements.apiPlan.className = "status-unknown";
        }
        if (elements.apiCredits) {
          elements.apiCredits.textContent = "checking...";
          elements.apiCredits.className = "status-unknown";
        }
        if (elements.apiExpires) {
          elements.apiExpires.textContent = "checking...";
          elements.apiExpires.className = "status-unknown";
        }

        // Check if this was a manual reload
        const wasManualReload = sessionStorage.getItem("manualReload") === "true";
        if (wasManualReload) {
          sessionStorage.removeItem("manualReload");
          // For manual reloads, force API status check (auto-retry is built into the function)
          setTimeout(async () => {
            try {
              await checkApiStatus(true); // Force check with built-in retry logic
            } catch (error) {
              console.error(
                "Initial API status check after reload failed:",
                error,
              );
            }
          }, 500);
        } else {
          // Normal initialization delay
          setTimeout(async () => {
            try {
              await checkApiStatus(true); // Force check on normal init too
            } catch (error) {
              console.error("API status check failed:", error);
            }
          }, 100);
        }
        // Show profile button when logged in
        if (elements.profileBtn) {
          elements.profileBtn.style.display = "flex";
        }
      }
    } else {
      // User is not logged in - show login dialog
      showLoginDialog();

      // Hide profile button when not logged in
      if (elements.profileBtn) {
        elements.profileBtn.style.display = "none";
      }
      // Clear status display when not logged in
      clearApiStatusDisplay();
    }

    // Set up update listeners
    setupUpdateListeners();

    // Check for updates
    if (window.electronAPI.updates) {
      window.electronAPI.updates.checkForUpdates();
    }

    // Set up event listeners
    setupEventListeners();

    // Set up a basic message handler
    window.electronAPI.app.onMessage((message) => {
      console.info("Message from main process:", message);
    });

    if (elements.clearStateBtn) {
      elements.clearStateBtn.disabled = true;
    }

    if (elements.regenerateBtn) {
      elements.regenerateBtn.disabled = true;
    }

    // Initialize selection state
    updateSelectionState();

    const removeLoginStatusListener = window.electronAPI.app.onLoginStatus(
      (data) => {
        if (data && data.isLoggedIn) {
          hideLoginDialog();
          // Show profile button when logged in
          if (elements.profileBtn) {
            elements.profileBtn.style.display = "flex";
          }
          // Check if this is a guest session
          if (data.isGuest) {
            // Update status bar for guest user - full premium access
            updateStatusBarForGuest();
            // Update profile dropdown for guest user - full premium access
            updateProfileDropdownForGuest({
              guestName: data.username || "Guest User",
              guestEmail: "guest@genmeta.local",
              planType: "Premium",
              credits: "Unlimited",
              isUnlimited: true,
            });
          }
          // Check if API status is included in the login status message
          if (data.apiStatus) {
            // Update the API status display immediately
            updateApiStatusDisplay(data.apiStatus);
          }
        } else {
          showLoginDialog();
          clearApiStatusDisplay();
          // Hide profile button when not logged in
          if (elements.profileBtn) {
            elements.profileBtn.style.display = "none";
          }
          // Close profile dropdown if open
          closeProfileDropdown();

          // Reset UI elements specific to logged-in state
          if (elements.settingsDialog) {
            elements.settingsDialog.classList.remove("active");
          }

          if (elements.settingsForm) {
            elements.settingsForm.reset();
          }

          if (elements.loginForm) {
            elements.loginForm.reset();
          }

          // Clear any existing results
          resetAppState();

          // Show notification if this was a forced logout
          if (data && data.forcedLogout) {
            showToastNotification(
              data.reason || "You have been logged out",
              "error",
            );
          }
        }
      },
    );

    const navbarSaveAllBtn = document.getElementById("save-all-btn");

    setupProcessingListeners();
    await loadSettings();

    try {
      const version = await window.electronAPI.app.getVersion();
      const versionElement = document.getElementById("app-version");
      if (versionElement) {
        versionElement.textContent = version;
      }
    } catch {
      // Error handling
    }

    // Setup API status listener that will receive real-time updates
    window.electronAPI.app.onApiStatusUpdate((status) => {
      updateApiStatusDisplay(status);
    });

    if (navbarSaveAllBtn) {
      navbarSaveAllBtn.addEventListener("click", saveAllMetadata);
    }

    // Add event listeners for forgot password and create account links
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    const createAccountLink = document.getElementById("create-account-link");

    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const result = await window.electronAPI.openExternal("https://genmeta.app/reset-password");
        if (!result.success) {
          showToastNotification("Could not open browser. Please set a default browser in your system settings.", "error", 6000);
        }
      });
    }

    if (createAccountLink) {
      createAccountLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const result = await window.electronAPI.openExternal("https://genmeta.app/signup");
        if (!result.success) {
          showToastNotification("Could not open browser. Please set a default browser in your system settings.", "error", 6000);
        }
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        removeLoginStatusListener();
        window.electronAPI.cleanup.removeListeners();
      });
    }
  } catch (error) {
    console.error("Error initializing the app:", error);
  }
}

// Show login dialog
function showLoginDialog() {
  if (elements.loginDialog) {
    elements.loginDialog.classList.add("active");
  }
}

// Hide login dialog
function hideLoginDialog() {
  if (elements.loginDialog) {
    elements.loginDialog.classList.remove("active");
  }
}

// Show API validation error dialog
function showApiValidationErrorDialog(errorMessage) {
  if (elements.apiValidationDialog && elements.apiValidationErrorDetails) {
    elements.apiValidationErrorDetails.textContent = errorMessage;
    elements.apiValidationDialog.classList.add("active");
  }
}

// Hide API validation error dialog
function hideApiValidationErrorDialog() {
  if (elements.apiValidationDialog) {
    elements.apiValidationDialog.classList.remove("active");
  }
}

// Add login functionality
async function handleLogin(e) {
  e.preventDefault();

  if (!elements.loginEmail || !elements.loginEmail.value) {
    showToastNotification("Please enter your email", "error");
    return;
  }

  // Validate email format
  const email = elements.loginEmail.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToastNotification("Please enter a valid email address", "error");
    return;
  }

  if (!elements.loginPassword || !elements.loginPassword.value) {
    showToastNotification("Please enter your password", "error");
    return;
  }

  const password = elements.loginPassword.value;

  try {
    elements.loginBtn.disabled = true;
    elements.loginBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    const result = await window.electronAPI.auth.login({
      email: email,
      password: password,
    });

    if (result.success) {
      hideLoginDialog();
      await loadSettings();
      showToastNotification("Login successful", "success");
      // Note: API status check is handled by the backend after login
    } else {
      showToastNotification(`Login failed: ${result.message}`, "error");
    }
  } catch (error) {
    showToastNotification(
      `Login error: ${error.message || "Unknown error"}`,
      "error",
    );
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.innerHTML = "Login";
  }
}

// Handle Google login
async function handleGoogleLogin() {
  try {
    elements.googleLoginBtn.disabled = true;
    elements.googleLoginBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Waiting...';

    // Show a notification to the user
    showToastNotification(
      "Google login opened in your browser. Please complete authentication there.",
      "info",
      8000,
    );

    // Initiate the Google login process
    const result = await window.electronAPI.auth.loginWithGoogle();

    // If the login process doesn't complete via the redirect flow
    // and we get a direct response (unlikely with the new implementation)
    if (!result.success) {
      showToastNotification(
        `Google login failed: ${result.message || "Login was cancelled"}`,
        "error",
      );
      elements.googleLoginBtn.disabled = false;
      elements.googleLoginBtn.innerHTML =
        '<img src="./assets/icons/google.svg" alt="Google" class="google-icon"><span>Continue with Google</span>';
    }
  } catch (error) {
    // Re-enable the button and stop the spinner in case of error
    elements.googleLoginBtn.disabled = false;
    elements.googleLoginBtn.innerHTML =
      '<img src="./assets/icons/google.svg" alt="Google" class="google-icon"><span>Continue with Google</span>';

    showToastNotification(
      `Google login error: ${error.message || "Unknown error"}`,
      "error",
    );
  }
}

// Handle guest login - instant local access without server call
async function handleGuestLogin() {
  try {
    elements.guestLoginBtn.disabled = true;
    elements.guestLoginBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Setting up...';

    // Guest login is instant - no server/API call required
    const result = await window.electronAPI.auth.loginAsGuest();

    if (result.success) {
      hideLoginDialog();
      showToastNotification(`Welcome, ${result.username}! Guest mode activated.`, "success");
      // Reset button state for future use
      elements.guestLoginBtn.disabled = false;
      elements.guestLoginBtn.innerHTML =
        '<i class="fas fa-user-secret"></i><span>Login as Guest</span>';
    } else {
      showToastNotification(`Guest login failed: ${result.message}`, "error");
      elements.guestLoginBtn.disabled = false;
      elements.guestLoginBtn.innerHTML =
        '<i class="fas fa-user-secret"></i><span>Login as Guest</span>';
    }
  } catch (error) {
    elements.guestLoginBtn.disabled = false;
    elements.guestLoginBtn.innerHTML =
      '<i class="fas fa-user-secret"></i><span>Login as Guest</span>';

    showToastNotification(
      `Guest login error: ${error.message || "Unknown error"}`,
      "error",
    );
  }
}

// Handle logout
async function handleLogout() {
  try {
    const result = await window.electronAPI.auth.logout();

    if (!result.success) {
      showToastNotification(`Logout failed: ${result.message}`, "error");
    } else {
      showToastNotification("You have been logged out", "info");
    }
    // No need to update UI here - the login-status event will handle it
  } catch (error) {
    showToastNotification(
      `Logout error: ${error.message || "Unknown error"}`,
      "error",
    );
  }
}

// Load settings from electron store
async function loadSettings() {
  try {
    const settings = await window.electronAPI.settings.load();

    // Apply theme based on settings
    if (settings.darkMode === false) {
      document.documentElement.classList.remove("dark-theme");
      document.documentElement.classList.add("light-theme");
    } else {
      // Default to dark theme
      document.documentElement.classList.remove("light-theme");
      document.documentElement.classList.add("dark-theme");
    }

    // Load API keys into the new list UI
    if (typeof window.reloadApiKeys === "function") {
      window.reloadApiKeys();
    }

    if (elements.settingsSecretKey) {
      elements.settingsSecretKey.value = settings.secretKey || "";
    }

    if (elements.settingsAiApiKey) {
      elements.settingsAiApiKey.value = settings.aiApiKey || "";
    }

    // Premium plan: always show Gemini key group, hide AI key group
    if (elements.aiApiKeyGroup && elements.geminiApiKeyGroup) {
      elements.geminiApiKeyGroup.style.display = "block";
      elements.aiApiKeyGroup.style.display = "none";
    }

    if (elements.settingsGsPath) {
      elements.settingsGsPath.value = settings.gsPath || "";
    }

    if (elements.settingsTitleLength) {
      elements.settingsTitleLength.value = settings.titleLength || 90;

      if (elements.settingsTitleLengthValue) {
        elements.settingsTitleLengthValue.textContent =
          settings.titleLength || 90;
      }
    }

    // Set title length mode
    const titleLengthMode = settings.titleLengthMode || "fixed";
    if (elements.settingsTitleModeFixed && elements.settingsTitleModeAuto) {
      elements.settingsTitleModeFixed.classList.toggle(
        "active",
        titleLengthMode === "fixed",
      );
      elements.settingsTitleModeAuto.classList.toggle(
        "active",
        titleLengthMode === "auto",
      );

      // Enable/disable range container based on mode
      if (elements.settingsTitleLengthContainer) {
        elements.settingsTitleLengthContainer.classList.toggle(
          "disabled",
          titleLengthMode === "auto",
        );
      }
    }

    // Set initial title length mode
    if (elements.initialTitleModeFixed && elements.initialTitleModeAuto) {
      elements.initialTitleModeFixed.classList.toggle(
        "active",
        titleLengthMode === "fixed",
      );
      elements.initialTitleModeAuto.classList.toggle(
        "active",
        titleLengthMode === "auto",
      );

      // Enable/disable range container based on mode
      if (elements.initialTitleLengthContainer) {
        elements.initialTitleLengthContainer.classList.toggle(
          "disabled",
          titleLengthMode === "auto",
        );
      }
    }

    if (elements.settingsDescLength) {
      elements.settingsDescLength.value = settings.descriptionLength || 120;

      if (elements.settingsDescLengthValue) {
        elements.settingsDescLengthValue.textContent =
          settings.descriptionLength || 120;
      }
    }

    if (elements.settingsKeywordCount) {
      elements.settingsKeywordCount.value = settings.keywordCount || 20;

      if (elements.settingsKeywordCountValue) {
        elements.settingsKeywordCountValue.textContent =
          settings.keywordCount || 20;
      }
    }

    // Set the createJpgCopy checkbox
    if (elements.settingsCreateJpgCopy) {
      elements.settingsCreateJpgCopy.checked = settings.createJpgCopy || false;
    }

    // Set the createPngCopy checkbox
    if (elements.settingsCreatePngCopy) {
      elements.settingsCreatePngCopy.checked = settings.createPngCopy || false;
    }

    // Set the addPeriodTitle checkbox
    if (elements.settingsAddPeriodTitle) {
      elements.settingsAddPeriodTitle.checked =
        settings.addPeriodTitle !== undefined ? settings.addPeriodTitle : true;
    }

    // Set the addPeriodDescription checkbox
    if (elements.settingsAddPeriodDescription) {
      elements.settingsAddPeriodDescription.checked =
        settings.addPeriodDescription !== undefined
          ? settings.addPeriodDescription
          : true;
    }

    // Set the category settings
    if (elements.settingsEnableShutterstockCategories) {
      elements.settingsEnableShutterstockCategories.checked =
        settings.enableShutterstockCategories !== undefined
          ? settings.enableShutterstockCategories
          : true;
    }

    if (elements.settingsEnableAdobeStockCategories) {
      elements.settingsEnableAdobeStockCategories.checked =
        settings.enableAdobeStockCategories || false;
    }

    // Set the dark mode checkbox
    if (elements.settingsDarkMode) {
      elements.settingsDarkMode.checked = settings.darkMode !== false; // Default to true if not set
    }

    // Set the enable notifications checkbox
    if (elements.settingsEnableNotifications) {
      elements.settingsEnableNotifications.checked =
        settings.enableNotifications !== false; // Default to true if not set
    }

    // Set the keyword format
    if (elements.settingsKeywordFormatGroup) {
      const keywordFormat = settings.keywordFormat || "auto";
      setKeywordFormat(elements.settingsKeywordFormatGroup, keywordFormat);
    }

    // Advanced settings
    if (elements.settingsGeminiModel) {
      elements.settingsGeminiModel.value =
        settings.geminiModel || "gemini-2.5-flash";
    }

    // Load navbar select values
    if (elements.microstockSelect) {
      elements.microstockSelect.value =
        settings.microstockSelection || "general";
    }

    if (elements.modalGeminiModelSelect) {
      elements.modalGeminiModelSelect.value =
        settings.geminiModel || "gemini-2.5-flash";
    }

    if (elements.modalMicrostockSelect) {
      elements.modalMicrostockSelect.value =
        settings.microstockPlatform || "general";
    }

    // Sync initial state selects with settings
    if (elements.initialMicrostockSelect) {
      elements.initialMicrostockSelect.value =
        settings.microstockPlatform || "general";
    }

    if (elements.initialGeminiModelSelect) {
      const geminiModel = settings.geminiModel || "gemini-2.5-flash";
      elements.initialGeminiModelSelect.value = geminiModel;

      // Update the custom dropdown display to match the saved setting
      updateCustomDropdownDisplay("initial-gemini-model-dropdown", geminiModel);
    }

    // Load AI agent selection
    if (elements.aiAgentSelect) {
      elements.aiAgentSelect.value = settings.aiAgent || "gemini";
    }

    if (elements.settingsEnableCustomPrompt) {
      elements.settingsEnableCustomPrompt.checked =
        settings.enableCustomPrompt || false;

      // Show/hide custom prompt container based on setting
      if (elements.customPromptContainer) {
        if (settings.enableCustomPrompt) {
          elements.customPromptContainer.style.display = "block";
          elements.customPromptContainer.classList.add("show");
        } else {
          elements.customPromptContainer.style.display = "none";
          elements.customPromptContainer.classList.remove("show");
        }
      }
    }

    if (elements.settingsCustomPrompt) {
      elements.settingsCustomPrompt.value = settings.customPrompt || "";
    }

    if (elements.settingsIsPremium) {
      elements.settingsIsPremium.checked = true;
      elements.settingsIsPremium.disabled = true;
    }

    // Load positive and negative keywords settings
    if (
      elements.settingsPositiveKeywords &&
      elements.positiveKeywordsContainer
    ) {
      elements.settingsPositiveKeywords.value = settings.positiveKeywords || "";

      // Clear existing tags
      elements.positiveKeywordsContainer.innerHTML = "";

      // Add tags for each keyword
      if (settings.positiveKeywords) {
        try {
          // Try to parse as JSON first (new format)
          const keywordsArray = JSON.parse(settings.positiveKeywords);

          keywordsArray.forEach((keywordObj) => {
            // Add the keyword tag with its options
            addKeywordTag(keywordObj.text, elements.positiveKeywordsContainer, {
              target: keywordObj.target || "keywords",
              filetypes: keywordObj.filetypes || ["jpg", "png", "eps"],
            });
          });
        } catch (error) {
          // If JSON parsing fails, fall back to old comma-separated format
          console.warn(
            "Failed to parse positive keywords as JSON, using legacy format",
            error,
          );
          const keywords = settings.positiveKeywords
            .split(",")
            .filter((k) => k.trim());
          keywords.forEach((keyword) => {
            addKeywordTag(keyword.trim(), elements.positiveKeywordsContainer);
          });
        }
      }
    }

    if (
      elements.settingsPositiveKeywordsTargetKeywords &&
      elements.settingsPositiveKeywordsTargetAll
    ) {
      const target = settings.positiveKeywordsTarget || "keywords";
      elements.settingsPositiveKeywordsTargetKeywords.checked =
        target === "keywords";
      elements.settingsPositiveKeywordsTargetAll.checked = target === "all";
    }

    if (elements.settingsPositiveKeywordsFiletypeJpg) {
      elements.settingsPositiveKeywordsFiletypeJpg.checked =
        settings.positiveKeywordsFiletypes
          ? settings.positiveKeywordsFiletypes.includes("jpg")
          : true;
    }

    if (elements.settingsPositiveKeywordsFiletypePng) {
      elements.settingsPositiveKeywordsFiletypePng.checked =
        settings.positiveKeywordsFiletypes
          ? settings.positiveKeywordsFiletypes.includes("png")
          : true;
    }

    if (elements.settingsPositiveKeywordsFiletypeEps) {
      elements.settingsPositiveKeywordsFiletypeEps.checked =
        settings.positiveKeywordsFiletypes
          ? settings.positiveKeywordsFiletypes.includes("eps")
          : true;
    }

    if (
      elements.settingsNegativeKeywords &&
      elements.negativeKeywordsContainer
    ) {
      elements.settingsNegativeKeywords.value = settings.negativeKeywords || "";

      // Clear existing tags
      elements.negativeKeywordsContainer.innerHTML = "";

      // Add tags for each keyword
      if (settings.negativeKeywords) {
        const keywords = settings.negativeKeywords
          .split(",")
          .filter((k) => k.trim());
        keywords.forEach((keyword) => {
          addKeywordTag(keyword.trim(), elements.negativeKeywordsContainer);
        });
      }
    }

    // Sync initial state controls with settings
    syncInitialStateWithSettings(settings);

    // Check API key configuration and show/hide banner
    checkApiKeyConfiguration(settings);

    return settings;
  } catch {
    return null;
  }
}

// Function to update custom dropdown display based on selected value
function updateCustomDropdownDisplay(dropdownId, selectedValue) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  const toggle = dropdown.querySelector(".dropdown-toggle");
  const selectedDiv = dropdown.querySelector(".dropdown-selected");
  const items = dropdown.querySelectorAll(".dropdown-item-model");

  if (!toggle || !selectedDiv || !items.length) return;

  // Find the item with the matching value
  let selectedItem = null;
  items.forEach((item) => {
    item.classList.remove("selected");
    if (item.dataset.value === selectedValue) {
      selectedItem = item;
      item.classList.add("selected");
    }
  });

  // Update the display if we found the selected item
  if (selectedItem) {
    const title = selectedItem.querySelector(".dropdown-title").textContent;
    const subtitle =
      selectedItem.querySelector(".dropdown-subtitle").textContent;

    selectedDiv.querySelector(".dropdown-title").textContent = title;
    selectedDiv.querySelector(".dropdown-subtitle").textContent = subtitle;
  }
}

// Check API key configuration and show/hide banner
function checkApiKeyConfiguration(settings) {
  if (!elements.apiKeyBanner) return;

  // Check if any Gemini API key is configured
  let hasApiKey = false;

  // Check for API keys array (new format)
  if (settings.apiKeys && Array.isArray(settings.apiKeys)) {
    hasApiKey = settings.apiKeys.some((key) => key && key.trim() !== "");
  }

  // Check for legacy single API key
  if (!hasApiKey && settings.apiKey && settings.apiKey.trim() !== "") {
    hasApiKey = true;
  }

    // Check for Gemini API key
  if (!hasApiKey && settings.aiApiKey && settings.aiApiKey.trim() !== "") {
    hasApiKey = true;
  }

  // Show banner if no API key is configured
  if (!hasApiKey) {
    elements.apiKeyBanner.classList.remove("hidden");
  } else {
    elements.apiKeyBanner.classList.add("hidden");
  }
}

// Sync initial state controls with settings
function syncInitialStateWithSettings(settings) {
  // Sync range sliders
  if (elements.initialTitleLength) {
    elements.initialTitleLength.value = settings.titleLength || 90;
    updateRangeBackground(elements.initialTitleLength);
    if (elements.initialTitleLengthValue) {
      elements.initialTitleLengthValue.value = settings.titleLength || 90;
    }
  }

  // Sync title length mode
  const titleLengthMode = settings.titleLengthMode || "fixed";
  if (elements.initialTitleModeFixed && elements.initialTitleModeAuto) {
    elements.initialTitleModeFixed.classList.toggle(
      "active",
      titleLengthMode === "fixed",
    );
    elements.initialTitleModeAuto.classList.toggle(
      "active",
      titleLengthMode === "auto",
    );

    // Enable/disable range container based on mode
    if (elements.initialTitleLengthContainer) {
      elements.initialTitleLengthContainer.classList.toggle(
        "disabled",
        titleLengthMode === "auto",
      );
    }
  }

  if (elements.initialDescLength) {
    elements.initialDescLength.value = settings.descriptionLength || 120;
    updateRangeBackground(elements.initialDescLength);
    if (elements.initialDescLengthValue) {
      elements.initialDescLengthValue.value = settings.descriptionLength || 120;
    }
  }

  if (elements.initialKeywordCount) {
    elements.initialKeywordCount.value = settings.keywordCount || 20;
    updateRangeBackground(elements.initialKeywordCount);
    if (elements.initialKeywordCountValue) {
      elements.initialKeywordCountValue.value = settings.keywordCount || 20;
    }
  }

  // Sync keyword format
  if (elements.initialKeywordFormatGroup) {
    const keywordFormat = settings.keywordFormat || "auto";
    setKeywordFormat(elements.initialKeywordFormatGroup, keywordFormat);
  }

  // Load CSV Export settings
  const csvMarkets = settings.csvExportMarkets || {
    general: { enabled: true },
    adobestock: { enabled: true },
    freepik: { enabled: true },
    shutterstock: { enabled: true },
    istock: { enabled: true },
    pond5: { enabled: true },
    "123rf": { enabled: true, country: "US" },
    dreamstime: { enabled: true },
  };

  // Helper function to get enabled status (supports both old boolean and new object format)
  const isEnabled = (market) => {
    return market === true || (market && market.enabled !== false);
  };

  if (document.getElementById("csv-enable-general")) {
    document.getElementById("csv-enable-general").checked = isEnabled(
      csvMarkets.general,
    );
  }
  if (document.getElementById("csv-enable-adobestock")) {
    document.getElementById("csv-enable-adobestock").checked = isEnabled(
      csvMarkets.adobestock,
    );
  }
  if (document.getElementById("csv-enable-freepik")) {
    document.getElementById("csv-enable-freepik").checked = isEnabled(
      csvMarkets.freepik,
    );
  }
  if (document.getElementById("csv-enable-shutterstock")) {
    document.getElementById("csv-enable-shutterstock").checked = isEnabled(
      csvMarkets.shutterstock,
    );
  }
  if (document.getElementById("csv-enable-istock")) {
    document.getElementById("csv-enable-istock").checked = isEnabled(
      csvMarkets.istock,
    );
  }
  if (document.getElementById("csv-enable-pond5")) {
    document.getElementById("csv-enable-pond5").checked = isEnabled(
      csvMarkets.pond5,
    );
  }
  if (document.getElementById("csv-enable-123rf")) {
    document.getElementById("csv-enable-123rf").checked = isEnabled(
      csvMarkets["123rf"],
    );
  }
  if (document.getElementById("csv-enable-dreamstime")) {
    document.getElementById("csv-enable-dreamstime").checked = isEnabled(
      csvMarkets.dreamstime,
    );
  }
  if (document.getElementById("csv-enable-vecteezy")) {
    document.getElementById("csv-enable-vecteezy").checked = isEnabled(
      csvMarkets.vecteezy,
    );
  }

  // Load 123RF country code
  if (document.getElementById("csv-123rf-country")) {
    const rf123Settings = csvMarkets["123rf"];
    const countryCode = (rf123Settings && rf123Settings.country) || "US";
    document.getElementById("csv-123rf-country").value = countryCode;
  }

  // Load Pond5 editorial setting
  if (document.getElementById("csv-pond5-editorial")) {
    const pond5Settings = csvMarkets.pond5;
    const editorial = (pond5Settings && pond5Settings.editorial) || false;
    document.getElementById("csv-pond5-editorial").checked = editorial;
  }

  // Load iStock settings
  if (document.getElementById("csv-istock-editorial")) {
    const istockSettings = csvMarkets.istock;
    const editorial = (istockSettings && istockSettings.editorial) || false;
    document.getElementById("csv-istock-editorial").checked = editorial;
  }
  if (document.getElementById("csv-istock-artist-name")) {
    const istockSettings = csvMarkets.istock;
    const artistName = (istockSettings && istockSettings.artistName) || "";
    document.getElementById("csv-istock-artist-name").value = artistName;
  }

  // Update keyword preview
  updateKeywordPreview(settings);
}

// Sync settings dialog controls with initial state values
function syncSettingsWithInitialState() {
  // Sync range sliders from initial state to settings
  if (elements.initialTitleLength && elements.settingsTitleLength) {
    elements.settingsTitleLength.value = elements.initialTitleLength.value;
    if (elements.settingsTitleLengthValue) {
      elements.settingsTitleLengthValue.textContent =
        elements.initialTitleLength.value;
    }
  }

  // Sync title length mode from initial state to settings
  const currentMode = getTitleLengthModeFromInitialState();
  if (elements.settingsTitleModeFixed && elements.settingsTitleModeAuto) {
    elements.settingsTitleModeFixed.classList.toggle(
      "active",
      currentMode === "fixed",
    );
    elements.settingsTitleModeAuto.classList.toggle(
      "active",
      currentMode === "auto",
    );

    // Enable/disable range container based on mode
    if (elements.settingsTitleLengthContainer) {
      elements.settingsTitleLengthContainer.classList.toggle(
        "disabled",
        currentMode === "auto",
      );
    }
  }

  if (elements.initialDescLength && elements.settingsDescLength) {
    elements.settingsDescLength.value = elements.initialDescLength.value;
    if (elements.settingsDescLengthValue) {
      elements.settingsDescLengthValue.textContent =
        elements.initialDescLength.value;
    }
  }

  if (elements.initialKeywordCount && elements.settingsKeywordCount) {
    elements.settingsKeywordCount.value = elements.initialKeywordCount.value;
    if (elements.settingsKeywordCountValue) {
      elements.settingsKeywordCountValue.textContent =
        elements.initialKeywordCount.value;
    }
  }

  // Sync keyword format
  if (
    elements.initialKeywordFormatGroup &&
    elements.settingsKeywordFormatGroup
  ) {
    const format = getKeywordFormat(elements.initialKeywordFormatGroup);
    setKeywordFormat(elements.settingsKeywordFormatGroup, format);
  }

  // Sync platform and model selections
  if (elements.initialMicrostockSelect && elements.modalMicrostockSelect) {
    elements.modalMicrostockSelect.value =
      elements.initialMicrostockSelect.value;
  }

  if (elements.initialGeminiModelSelect && elements.modalGeminiModelSelect) {
    elements.modalGeminiModelSelect.value =
      elements.initialGeminiModelSelect.value;
  }

  if (elements.initialGeminiModelSelect && elements.settingsGeminiModel) {
    elements.settingsGeminiModel.value =
      elements.initialGeminiModelSelect.value;
  }
}

// Function to save current settings and sync all UI elements
async function saveAndSyncSettings() {
  try {
    await saveSettings();

    // Reload settings to ensure all UI elements are synchronized
    const settings = await window.electronAPI.settings.load();
    if (settings) {
      syncInitialStateWithSettings(settings);

      // Check API key configuration and update banner visibility
      checkApiKeyConfiguration(settings);

      // Also sync model settings modal if it exists
      if (elements.modalMicrostockSelect) {
        elements.modalMicrostockSelect.value =
          settings.microstockPlatform || "general";
      }
      if (elements.modalGeminiModelSelect) {
        elements.modalGeminiModelSelect.value =
          settings.geminiModel || "gemini-2.5-flash";
      }
    }

    return true;
  } catch (error) {
    console.error("Error saving and syncing settings:", error);
    return false;
  }
}

// Update keyword preview in initial state
function updateKeywordPreview(settings) {
  if (!elements.initialPositiveTags || !elements.initialNegativeTags) return;

  const positiveSection = document.getElementById("initial-positive-preview");
  const negativeSection = document.getElementById("initial-negative-preview");

  // Update positive keywords
  const positiveContainer = elements.initialPositiveTags;
  positiveContainer.innerHTML = "";
  let hasPositiveKeywords = false;

  if (settings.positiveKeywords) {
    try {
      const keywordsArray = JSON.parse(settings.positiveKeywords);
      if (keywordsArray.length > 0) {
        hasPositiveKeywords = true;
        keywordsArray.slice(0, 5).forEach((keywordObj) => {
          const tag = document.createElement("span");
          tag.className = "keyword-tag-preview has-keywords";
          tag.textContent = keywordObj.text;
          positiveContainer.appendChild(tag);
        });

        if (keywordsArray.length > 5) {
          const moreTag = document.createElement("span");
          moreTag.className = "keyword-tag-preview has-keywords";
          moreTag.textContent = `+${keywordsArray.length - 5} more`;
          positiveContainer.appendChild(moreTag);
        }
      }
    } catch {
      // Fallback for old format
      const keywords = settings.positiveKeywords
        .split(",")
        .filter((k) => k.trim());
      if (keywords.length > 0) {
        hasPositiveKeywords = true;
        keywords.slice(0, 5).forEach((keyword) => {
          const tag = document.createElement("span");
          tag.className = "keyword-tag-preview has-keywords";
          tag.textContent = keyword.trim();
          positiveContainer.appendChild(tag);
        });

        if (keywords.length > 5) {
          const moreTag = document.createElement("span");
          moreTag.className = "keyword-tag-preview has-keywords";
          moreTag.textContent = `+${keywords.length - 5} more`;
          positiveContainer.appendChild(moreTag);
        }
      }
    }
  }

  // Show/hide positive section based on whether keywords exist
  if (positiveSection) {
    positiveSection.style.display = hasPositiveKeywords ? "block" : "none";
  }

  // Update negative keywords
  const negativeContainer = elements.initialNegativeTags;
  negativeContainer.innerHTML = "";
  let hasNegativeKeywords = false;

  if (settings.negativeKeywords) {
    const keywords = settings.negativeKeywords
      .split(",")
      .filter((k) => k.trim());
    if (keywords.length > 0) {
      hasNegativeKeywords = true;
      keywords.slice(0, 5).forEach((keyword) => {
        const tag = document.createElement("span");
        tag.className = "keyword-tag-preview has-keywords";
        tag.textContent = keyword.trim();
        negativeContainer.appendChild(tag);
      });

      if (keywords.length > 5) {
        const moreTag = document.createElement("span");
        moreTag.className = "keyword-tag-preview has-keywords";
        moreTag.textContent = `+${keywords.length - 5} more`;
        negativeContainer.appendChild(moreTag);
      }
    }
  }

  // Show/hide negative section based on whether keywords exist
  if (negativeSection) {
    negativeSection.style.display = hasNegativeKeywords ? "block" : "none";
  }

  // Show/hide the entire keywords display section
  const keywordsDisplay = document.querySelector(".initial-keywords-display");
  if (keywordsDisplay) {
    if (!hasPositiveKeywords && !hasNegativeKeywords) {
      keywordsDisplay.style.display = "none";
    } else {
      // keywordsDisplay.style.display = "block";
      keywordsDisplay.style.display = "none"; // Hide entire section for now
    }
  }
}

// Save settings to electron store
async function saveSettings() {
  try {
    // Get current settings to preserve API keys (managed by api-key-manager.js)
    const currentSettings = await window.electronAPI.settings.load();
    const apiKeys = currentSettings.apiKeys || [];

    const settings = {
      apiKeys: apiKeys,
      apiKey: apiKeys[0] || "", // Keep backward compatibility with first key
      secretKey: elements.settingsSecretKey
        ? elements.settingsSecretKey.value
        : "",
      darkMode: elements.settingsDarkMode
        ? elements.settingsDarkMode.checked
        : true,
      enableNotifications: elements.settingsEnableNotifications
        ? elements.settingsEnableNotifications.checked
        : true,
      gsPath: elements.settingsGsPath ? elements.settingsGsPath.value : "",
      titleLength: elements.settingsTitleLength
        ? parseInt(elements.settingsTitleLength.value)
        : 90,
      titleLengthMode: getTitleLengthMode(),
      descriptionLength: elements.settingsDescLength
        ? parseInt(elements.settingsDescLength.value)
        : 120,
      keywordCount: elements.settingsKeywordCount
        ? parseInt(elements.settingsKeywordCount.value)
        : 20,
      isPremium: true,
      // Include the createJpgCopy setting
      createJpgCopy: elements.settingsCreateJpgCopy
        ? elements.settingsCreateJpgCopy.checked
        : false,
      // Include the createPngCopy setting
      createPngCopy: elements.settingsCreatePngCopy
        ? elements.settingsCreatePngCopy.checked
        : false,
      // Include the addPeriodTitle setting
      addPeriodTitle: elements.settingsAddPeriodTitle
        ? elements.settingsAddPeriodTitle.checked
        : true,
      // Include the addPeriodDescription setting
      addPeriodDescription: elements.settingsAddPeriodDescription
        ? elements.settingsAddPeriodDescription.checked
        : true,
      // Include the category settings
      enableShutterstockCategories: elements.settingsEnableShutterstockCategories
        ? elements.settingsEnableShutterstockCategories.checked
        : true,
      enableAdobeStockCategories: elements.settingsEnableAdobeStockCategories
        ? elements.settingsEnableAdobeStockCategories.checked
        : false,
      // Include the keywordFormat setting
      keywordFormat: elements.settingsKeywordFormatGroup
        ? getKeywordFormat(elements.settingsKeywordFormatGroup)
        : "auto",

      // Advanced settings
      geminiModel: elements.settingsGeminiModel
        ? elements.settingsGeminiModel.value
        : "gemini-2.5-flash",
      enableCustomPrompt: elements.settingsEnableCustomPrompt
        ? elements.settingsEnableCustomPrompt.checked
        : false,
      customPrompt: elements.settingsCustomPrompt
        ? elements.settingsCustomPrompt.value.trim()
        : "",
      // Include aiApiKey if displayed, otherwise preserve previous value
      aiApiKey:
        elements.settingsAiApiKey &&
        elements.aiApiKeyGroup.style.display !== "none"
          ? elements.settingsAiApiKey.value
          : undefined,
      // Preserve isAiApiKeyManaged flag for the backend
      isAiApiKeyManaged:
        elements.aiApiKeyGroup &&
        elements.aiApiKeyGroup.style.display !== "none",

      // Save positive and negative keywords settings
      positiveKeywords: elements.settingsPositiveKeywords
        ? elements.settingsPositiveKeywords.value.trim()
        : "",

      // Note: We're keeping these global settings for backward compatibility
      // but they'll be ignored when using the new per-keyword settings
      positiveKeywordsTarget:
        elements.settingsPositiveKeywordsTargetAll &&
        elements.settingsPositiveKeywordsTargetAll.checked
          ? "all"
          : "keywords",

      positiveKeywordsFiletypes: [
        ...(elements.settingsPositiveKeywordsFiletypeJpg &&
        elements.settingsPositiveKeywordsFiletypeJpg.checked
          ? ["jpg"]
          : []),
        ...(elements.settingsPositiveKeywordsFiletypePng &&
        elements.settingsPositiveKeywordsFiletypePng.checked
          ? ["png"]
          : []),
        ...(elements.settingsPositiveKeywordsFiletypeEps &&
        elements.settingsPositiveKeywordsFiletypeEps.checked
          ? ["eps"]
          : []),
      ],

      negativeKeywords: elements.settingsNegativeKeywords
        ? elements.settingsNegativeKeywords.value.trim()
        : "",

      // Save navbar select values
      microstockSelection: elements.microstockSelect
        ? elements.microstockSelect.value
        : "general",

      // CSV Export settings
      csvExportMarkets: {
        general: {
          enabled: document.getElementById("csv-enable-general")
            ? document.getElementById("csv-enable-general").checked
            : true,
        },
        adobestock: {
          enabled: document.getElementById("csv-enable-adobestock")
            ? document.getElementById("csv-enable-adobestock").checked
            : true,
        },
        freepik: {
          enabled: document.getElementById("csv-enable-freepik")
            ? document.getElementById("csv-enable-freepik").checked
            : true,
        },
        shutterstock: {
          enabled: document.getElementById("csv-enable-shutterstock")
            ? document.getElementById("csv-enable-shutterstock").checked
            : true,
        },
        istock: {
          enabled: document.getElementById("csv-enable-istock")
            ? document.getElementById("csv-enable-istock").checked
            : true,
          editorial: document.getElementById("csv-istock-editorial")
            ? document.getElementById("csv-istock-editorial").checked
            : false,
          artistName: document.getElementById("csv-istock-artist-name")
            ? document.getElementById("csv-istock-artist-name").value.trim()
            : "",
        },
        pond5: {
          enabled: document.getElementById("csv-enable-pond5")
            ? document.getElementById("csv-enable-pond5").checked
            : true,
          editorial: document.getElementById("csv-pond5-editorial")
            ? document.getElementById("csv-pond5-editorial").checked
            : false,
        },
        "123rf": {
          enabled: document.getElementById("csv-enable-123rf")
            ? document.getElementById("csv-enable-123rf").checked
            : true,
          country: document.getElementById("csv-123rf-country")
            ? document
                .getElementById("csv-123rf-country")
                .value.toUpperCase() || "US"
            : "US",
        },
        dreamstime: {
          enabled: document.getElementById("csv-enable-dreamstime")
            ? document.getElementById("csv-enable-dreamstime").checked
            : true,
        },
        vecteezy: {
          enabled: document.getElementById("csv-enable-vecteezy")
            ? document.getElementById("csv-enable-vecteezy").checked
            : true,
        },
      },
    };

    // Validate that at least one CSV market is enabled
    const csvMarkets = settings.csvExportMarkets;
    const hasAtLeastOneMarket = Object.values(csvMarkets).some((market) => {
      // Support both old boolean format and new object format
      return market === true || (market && market.enabled === true);
    });

    if (!hasAtLeastOneMarket) {
      showToastNotification(
        "At least one CSV export market must be enabled",
        "error",
        3000,
      );
      // Re-enable the general market as fallback
      if (document.getElementById("csv-enable-general")) {
        document.getElementById("csv-enable-general").checked = true;
        settings.csvExportMarkets.general = { enabled: true };
      }
      return false;
    }

    const result = await window.electronAPI.settings.save(settings);

    // If settings saved successfully, update API key banner visibility
    if (result) {
      checkApiKeyConfiguration(settings);
    }

    // If settings saved successfully and there's a secretKey, check API status
    // but only if the secretKey has changed (to prevent unnecessary API calls)
    if (result && settings.secretKey) {
      // Store the last checked secretKey to avoid redundant API calls
      const lastCheckedKey = localStorage.getItem("lastCheckedSecretKey");
      const lastCheckTime = parseInt(
        localStorage.getItem("lastApiStatusCheckTime") || "0",
      );
      const now = Date.now();

      // Only check if the key changed or it's been more than 10 seconds since last check
      if (
        lastCheckedKey !== settings.secretKey ||
        now - lastCheckTime > 10000
      ) {
        localStorage.setItem("lastCheckedSecretKey", settings.secretKey);
        localStorage.setItem("lastApiStatusCheckTime", now.toString());

        // Wait a bit to ensure settings are persisted before checking status
        setTimeout(async () => {
          try {
            await checkApiStatus(true); // Force check after settings save
          } catch (error) {
            console.error(
              "Error checking API status after saving settings:",
              error,
            );
          }
        }, 500);
      }
    }

    return result;
  } catch {
    return false;
  }
}

// Function to show the update check popup
function showUpdateCheckPopup() {
  if (elements.updateCheckPopup) {
    elements.updateCheckPopup.classList.add("show");
    if (elements.updateCheckLoading) {
      elements.updateCheckLoading.style.display = "flex";
    }
    if (elements.updateCheckResult) {
      elements.updateCheckResult.style.display = "none";
    }
    if (elements.updateCheckDownloadBtn) {
      elements.updateCheckDownloadBtn.classList.add("hidden");
    }
    if (elements.updateCheckInstallBtn) {
      elements.updateCheckInstallBtn.classList.add("hidden");
    }

    // Check for updates
    window.electronAPI.updates.checkForUpdates().catch((error) => {
      if (elements.updateCheckLoading) {
        elements.updateCheckLoading.style.display = "none";
      }
      if (elements.updateCheckResult) {
        elements.updateCheckResult.style.display = "block";
        elements.updateCheckResult.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              Error checking for updates: ${error.message || "Unknown error"}
            </div>
          `;
      }
    });
  }
}

// Function to hide the update check popup
function hideUpdateCheckPopup() {
  if (elements.updateCheckPopup) {
    elements.updateCheckPopup.classList.remove("show");
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Initial state microstock select event listener
  if (elements.initialMicrostockSelect) {
    elements.initialMicrostockSelect.addEventListener("change", async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.microstockPlatform = elements.initialMicrostockSelect.value;
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error saving microstock platform setting:", error);
      }
    });
  }

  // Initial state gemini model select event listener
  if (elements.initialGeminiModelSelect) {
    elements.initialGeminiModelSelect.addEventListener("change", async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.geminiModel = elements.initialGeminiModelSelect.value;
        await window.electronAPI.settings.save(settings);

        // Sync with settings dialog
        if (elements.settingsGeminiModel) {
          elements.settingsGeminiModel.value =
            elements.initialGeminiModelSelect.value;
        }
      } catch (error) {
        console.error("Error saving gemini model setting:", error);
      }
    });
  }

  // AI agent select event listener
  if (elements.aiAgentSelect) {
    elements.aiAgentSelect.addEventListener("change", async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.aiAgent = elements.aiAgentSelect.value;
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error saving AI agent setting:", error);
      }
    });
  }

  // Update check popup
  if (elements.updateCheckIconBtn) {
    elements.updateCheckIconBtn.addEventListener("click", showUpdateCheckPopup);
  }

  if (elements.closeUpdateCheckPopup) {
    elements.closeUpdateCheckPopup.addEventListener(
      "click",
      hideUpdateCheckPopup,
    );
  }

  if (elements.updateCheckCloseBtn) {
    elements.updateCheckCloseBtn.addEventListener(
      "click",
      hideUpdateCheckPopup,
    );
  }

  // Update check download and install buttons
  if (elements.updateCheckDownloadBtn) {
    elements.updateCheckDownloadBtn.addEventListener("click", function () {
      elements.updateCheckDownloadBtn.disabled = true;
      elements.updateCheckDownloadBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Downloading...';
      window.electronAPI.updates.downloadUpdate().catch((error) => {
        if (elements.updateCheckResult) {
          elements.updateCheckResult.innerHTML = `
              <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Error downloading update: ${error.message || "Unknown error"}
              </div>
            `;
        }
        elements.updateCheckDownloadBtn.disabled = false;
        elements.updateCheckDownloadBtn.innerHTML =
          '<i class="fas fa-download"></i> Download';
      });
    });
  }

  if (elements.updateCheckInstallBtn) {
    elements.updateCheckInstallBtn.addEventListener("click", function () {
      elements.updateCheckInstallBtn.disabled = true;
      elements.updateCheckInstallBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Installing...';
      window.electronAPI.updates.installUpdate().catch((error) => {
        if (elements.updateCheckResult) {
          elements.updateCheckResult.innerHTML = `
              <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Error installing update: ${error.message || "Unknown error"}
              </div>
            `;
        }
        elements.updateCheckInstallBtn.disabled = false;
        elements.updateCheckInstallBtn.innerHTML =
          '<i class="fas fa-arrow-circle-up"></i> Install';
      });
    });
  }

  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", handleLogin);
  }

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogin(e);
    });
  }
  if (elements.googleLoginBtn) {
    elements.googleLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleGoogleLogin();
    });
  }
  if (elements.guestLoginBtn) {
    elements.guestLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleGuestLogin();
    });
  }

  // Set up Google auth complete listener
  window.electronAPI.auth.onGoogleAuthComplete((result) => {
    // Reset the Google login button state
    if (elements.googleLoginBtn) {
      elements.googleLoginBtn.disabled = false;
      elements.googleLoginBtn.innerHTML =
        '<img src="./assets/icons/google.svg" alt="Google" class="google-icon"><span>Continue with Google</span>';
    }

    if (result.success) {
      // Login was successful
      showToastNotification("Google login successful", "success");
      hideLoginDialog();
      // The login status listener will handle the rest of the UI updates
    } else {
      // Login failed
      showToastNotification(
        `Google login failed: ${result.error || "Login was cancelled"}`,
        "error",
      );
    }
  });

  if (elements.toggleLoginPassword && elements.loginPassword) {
    elements.toggleLoginPassword.addEventListener("click", () => {
      const type =
        elements.loginPassword.type === "password" ? "text" : "password";
      elements.loginPassword.type = type;
      elements.toggleLoginPassword.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (elements.toggleSecretKey && elements.settingsSecretKey) {
    elements.toggleSecretKey.addEventListener("click", () => {
      const type =
        elements.settingsSecretKey.type === "password" ? "text" : "password";
      elements.settingsSecretKey.type = type;
      elements.toggleSecretKey.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  // API key management is now handled by api-key-manager.js

  if (elements.toggleAiApiKey && elements.settingsAiApiKey) {
    elements.toggleAiApiKey.addEventListener("click", () => {
      const type =
        elements.settingsAiApiKey.type === "password" ? "text" : "password";
      elements.settingsAiApiKey.type = type;
      elements.toggleAiApiKey.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (elements.getApiKeyBtn) {
    elements.getApiKeyBtn.addEventListener("click", async () => {
      const result = await window.electronAPI.openExternal("https://aistudio.google.com/app/apikey");
      if (!result.success) {
        showToastNotification("Could not open browser. Please check your default browser settings.", "error", 6000);
      }
    });
  }

  // Title length mode toggle event listeners
  if (elements.settingsTitleModeFixed && elements.settingsTitleModeAuto) {
    elements.settingsTitleModeFixed.addEventListener("click", async () => {
      setTitleLengthMode("fixed");
      await saveAndSyncSettings();
    });

    elements.settingsTitleModeAuto.addEventListener("click", async () => {
      setTitleLengthMode("auto");
      await saveAndSyncSettings();
    });
  }

  if (elements.initialTitleModeFixed && elements.initialTitleModeAuto) {
    elements.initialTitleModeFixed.addEventListener("click", async () => {
      setTitleLengthMode("fixed");
      await saveAndSyncSettings();
    });

    elements.initialTitleModeAuto.addEventListener("click", async () => {
      setTitleLengthMode("auto");
      await saveAndSyncSettings();
    });
  }

  // Add event listeners for navbar select elements
  if (elements.microstockSelect) {
    elements.microstockSelect.addEventListener("change", async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.microstockSelection = elements.microstockSelect.value;
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error saving microstock selection:", error);
      }
    });
  }

  if (elements.geminiModelSelect) {
    elements.geminiModelSelect.addEventListener("change", async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.geminiModel = elements.modalGeminiModelSelect.value;
        await window.electronAPI.settings.save(settings);

        // Also update the settings dialog select if it exists
        if (elements.settingsGeminiModel) {
          elements.settingsGeminiModel.value =
            elements.modalGeminiModelSelect.value;
        }
      } catch (error) {
        console.error("Error saving Gemini model selection:", error);
      }
    });
  }

  // Add event listener to sync settings dialog Gemini model with navbar select and initial state
  if (elements.settingsGeminiModel) {
    elements.settingsGeminiModel.addEventListener("change", async () => {
      if (elements.modalGeminiModelSelect) {
        elements.modalGeminiModelSelect.value =
          elements.settingsGeminiModel.value;
      }
      // Sync with initial state
      if (elements.initialGeminiModelSelect) {
        elements.initialGeminiModelSelect.value =
          elements.settingsGeminiModel.value;
      }

      // Auto-save immediately for select changes
      try {
        const settings = await window.electronAPI.settings.load();
        settings.geminiModel = elements.settingsGeminiModel.value;
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error auto-saving Gemini model from settings:", error);
      }
    });
  }

  // Add CSS for the detailed instructions
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .setting-hint-detailed {
      margin-top: 10px;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-size: 0.9em;
    }
    .setting-hint-detailed p {
      margin: 0 0 8px 0;
    }
    .setting-hint-detailed ol {
      margin: 0;
      padding-left: 20px;
    }
    .setting-hint-detailed li {
      margin-bottom: 4px;
    }
    .external-link {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
    }
    .external-link:hover {
      text-decoration: none;
    }
  `;
  document.head.appendChild(styleElement);

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", handleLogout);
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Prevent double-clicks by checking if button is already disabled
    if (elements.initialGenerateBtn && elements.initialGenerateBtn.disabled) {
      return;
    }

    // Immediately disable the button to prevent double-clicks
    if (elements.initialGenerateBtn) {
      elements.initialGenerateBtn.disabled = true;
      elements.initialGenerateBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }

    if (!selectedPath) {
      // Re-enable button if validation fails
      if (elements.initialGenerateBtn) {
        elements.initialGenerateBtn.disabled = false;
        elements.initialGenerateBtn.innerHTML =
          '<i class="fas fa-bolt"></i> Generate';
      }
      showToastNotification(
        "Please select images or a directory first",
        "warning",
      );
      return;
    }

    try {
      const settings = await window.electronAPI.settings.load();
      if (!settings || (!settings.apiKey && (!settings.apiKeys || settings.apiKeys.length === 0))) {
        // Re-enable button if validation fails
        if (elements.initialGenerateBtn) {
          elements.initialGenerateBtn.disabled = false;
          elements.initialGenerateBtn.innerHTML =
            '<i class="fas fa-bolt"></i> Generate';
        }
        showToastNotification(
          "Please set your valid Gemini API key in settings first",
          "warning",
        );
        elements.settingsDialog.classList.add("active");
        return;
      }

      resetAppState();
      setupProcessingListeners();

      // Get positive and negative keywords settings
      const positiveKeywords = settings.positiveKeywords || "";
      const negativeKeywords = settings.negativeKeywords || "";
      const positiveKeywordsTarget =
        settings.positiveKeywordsTarget || "keywords";
      const positiveKeywordsFiletypes = settings.positiveKeywordsFiletypes || [
        "jpg",
        "png",
        "eps",
      ];

      // Get microstock selection from navbar
      const microstockSelection = getSelectedPlatform();

      const config = {
        path: selectedPath,
        selectedFiles: selectedFiles,
        positiveKeywords,
        negativeKeywords,
        positiveKeywordsTarget,
        positiveKeywordsFiletypes,
        microstockSelection,
      };

      await window.electronAPI.processing.submit(config);
    } catch {
      // Re-enable button if an error occurs
      if (elements.initialGenerateBtn) {
        elements.initialGenerateBtn.disabled = false;
        elements.initialGenerateBtn.innerHTML =
          '<i class="fas fa-bolt"></i> Generate';
      }
      showToastNotification(
        "An error occurred while setting up processing. Please try again.",
        "error",
      );
    }
  };

  // Set up initial generate button with same functionality as submit button
  if (elements.initialGenerateBtn) {
    elements.initialGenerateBtn.addEventListener("click", handleSubmit);
  }

  // Set up regenerate button with same functionality as submit button
  if (elements.regenerateBtn) {
    elements.regenerateBtn.addEventListener("click", handleSubmit);
  }

  if (elements.stopBtn) {
    elements.stopBtn.addEventListener("click", async () => {
      try {
        elements.progressContainer.classList.add("hidden");
        elements.progressStatus.textContent = "Processing stopped by user";

        await window.electronAPI.processing.stopProcessing();

        elements.stopBtn.disabled = true;
        elements.stopBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      } catch {
        // Error handling
      }
    });
  }

  if (elements.exportCsvBtn) {
    elements.exportCsvBtn.addEventListener("click", exportAllMetadata);
  }

  // Add event listener for the retry failed button
  if (elements.retryFailedBtn) {
    elements.retryFailedBtn.addEventListener("click", retryFailedItems);
  }

  if (elements.commonKeywordBtn) {
    elements.commonKeywordBtn.addEventListener("click", () => {
      const originalContent = elements.commonKeywordBtn.innerHTML;
      elements.commonKeywordBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Loading...';
      elements.commonKeywordBtn.disabled = true;
      // Reset the form and show the dialog immediately
      resetBulkEditForm();

      // Set the first tab as active
      if (elements.bulkEditTabs) {
        elements.bulkEditTabs.forEach((t) => t.classList.remove("active"));
        elements.tabContents.forEach((content) =>
          content.classList.remove("active"),
        );
        const firstTab = elements.bulkEditTabs[0];
        if (firstTab) {
          firstTab.classList.add("active");
          const tabId = firstTab.getAttribute("data-tab");
          document.getElementById(tabId)?.classList.add("active");
        }
      }

      elements.commonKeywordDialog.classList.add("active");

      // Re-enable the button after showing the dialog
      elements.commonKeywordBtn.innerHTML = originalContent;
      elements.commonKeywordBtn.disabled = false;
    });
  }

  if (elements.closeKeywordDialog) {
    elements.closeKeywordDialog.addEventListener("click", () => {
      elements.commonKeywordDialog.classList.remove("active");
      resetBulkEditForm();
    });
  }

  if (elements.cancelKeyword) {
    elements.cancelKeyword.addEventListener("click", () => {
      elements.commonKeywordDialog.classList.remove("active");
      resetBulkEditForm();
    });
  }

  if (elements.applyKeyword) {
    elements.applyKeyword.addEventListener("click", applyCommonKeyword);
  }

  if (elements.commonKeyword) {
    elements.commonKeyword.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCommonKeyword();
      }
    });
  }

  elements.keywordPositionRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "custom") {
        elements.customPositionGroup.style.display = "block";
      } else {
        elements.customPositionGroup.style.display = "none";
      }
    });
  });

  // Settings dialog range sliders with sync and auto-save
  let settingsTitleLengthTimeout;
  elements.settingsTitleLength.addEventListener("input", () => {
    elements.settingsTitleLengthValue.textContent =
      elements.settingsTitleLength.value;
    updateRangeBackground(elements.settingsTitleLength);
    // Sync with initial state
    if (elements.initialTitleLength) {
      elements.initialTitleLength.value = elements.settingsTitleLength.value;
      updateRangeBackground(elements.initialTitleLength);
      if (elements.initialTitleLengthValue) {
        elements.initialTitleLengthValue.value =
          elements.settingsTitleLength.value;
      }
    }

    // Auto-save with debounce
    clearTimeout(settingsTitleLengthTimeout);
    settingsTitleLengthTimeout = setTimeout(async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.titleLength = parseInt(elements.settingsTitleLength.value);
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error auto-saving title length from settings:", error);
      }
    }, 500);
  });

  let settingsDescLengthTimeout;
  elements.settingsDescLength.addEventListener("input", () => {
    elements.settingsDescLengthValue.textContent =
      elements.settingsDescLength.value;
    updateRangeBackground(elements.settingsDescLength);
    // Sync with initial state
    if (elements.initialDescLength) {
      elements.initialDescLength.value = elements.settingsDescLength.value;
      updateRangeBackground(elements.initialDescLength);
      if (elements.initialDescLengthValue) {
        elements.initialDescLengthValue.value =
          elements.settingsDescLength.value;
      }
    }

    // Auto-save with debounce
    clearTimeout(settingsDescLengthTimeout);
    settingsDescLengthTimeout = setTimeout(async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.descriptionLength = parseInt(
          elements.settingsDescLength.value,
        );
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error(
          "Error auto-saving description length from settings:",
          error,
        );
      }
    }, 500);
  });

  let settingsKeywordCountTimeout;
  elements.settingsKeywordCount.addEventListener("input", () => {
    elements.settingsKeywordCountValue.textContent =
      elements.settingsKeywordCount.value;
    updateRangeBackground(elements.settingsKeywordCount);
    // Sync with initial state
    if (elements.initialKeywordCount) {
      elements.initialKeywordCount.value = elements.settingsKeywordCount.value;
      updateRangeBackground(elements.initialKeywordCount);
      if (elements.initialKeywordCountValue) {
        elements.initialKeywordCountValue.value =
          elements.settingsKeywordCount.value;
      }
    }

    // Auto-save with debounce
    clearTimeout(settingsKeywordCountTimeout);
    settingsKeywordCountTimeout = setTimeout(async () => {
      try {
        const settings = await window.electronAPI.settings.load();
        settings.keywordCount = parseInt(elements.settingsKeywordCount.value);
        await window.electronAPI.settings.save(settings);
      } catch (error) {
        console.error("Error auto-saving keyword count from settings:", error);
      }
    }, 500);
  });

  // Settings keyword format sync with initial state and auto-save
  if (elements.settingsKeywordFormatGroup) {
    initializeKeywordFormatGroup(
      elements.settingsKeywordFormatGroup,
      async (format) => {
        // Sync with initial state
        if (elements.initialKeywordFormatGroup) {
          setKeywordFormat(elements.initialKeywordFormatGroup, format);
        }

        // Auto-save immediately for format changes
        try {
          const settings = await window.electronAPI.settings.load();
          settings.keywordFormat = format;
          await window.electronAPI.settings.save(settings);
        } catch (error) {
          console.error(
            "Error auto-saving keyword format from settings:",
            error,
          );
        }
      },
    );
  }

  // Initialize range backgrounds on page load
  function initializeRangeBackgrounds() {
    if (elements.initialTitleLength)
      updateRangeBackground(elements.initialTitleLength);
    if (elements.initialDescLength)
      updateRangeBackground(elements.initialDescLength);
    if (elements.initialKeywordCount)
      updateRangeBackground(elements.initialKeywordCount);
    if (elements.settingsTitleLength)
      updateRangeBackground(elements.settingsTitleLength);
    if (elements.settingsDescLength)
      updateRangeBackground(elements.settingsDescLength);
    if (elements.settingsKeywordCount)
      updateRangeBackground(elements.settingsKeywordCount);
  }

  // Call the initialization function
  initializeRangeBackgrounds();

  // Initial state range sliders with auto-save and sync
  if (elements.initialTitleLength && elements.initialTitleLengthValue) {
    let titleLengthTimeout;

    // Range slider to number input sync
    elements.initialTitleLength.addEventListener("input", () => {
      elements.initialTitleLengthValue.value =
        elements.initialTitleLength.value;
      updateRangeBackground(elements.initialTitleLength);

      // Sync with settings
      if (elements.settingsTitleLength) {
        elements.settingsTitleLength.value = elements.initialTitleLength.value;
        elements.settingsTitleLengthValue.textContent =
          elements.initialTitleLength.value;
        updateRangeBackground(elements.settingsTitleLength);
      }

      // Auto-save with debounce
      clearTimeout(titleLengthTimeout);
      titleLengthTimeout = setTimeout(async () => {
        try {
          const settings = await window.electronAPI.settings.load();
          settings.titleLength = parseInt(elements.initialTitleLength.value);
          await window.electronAPI.settings.save(settings);
        } catch (error) {
          console.error("Error auto-saving title length:", error);
        }
      }, 500);
    });

    // Number input to range slider sync
    elements.initialTitleLengthValue.addEventListener("change", () => {
      const value = parseInt(elements.initialTitleLengthValue.value);
      const min = parseInt(elements.initialTitleLengthValue.min);
      const max = parseInt(elements.initialTitleLengthValue.max);

      // Validate and clamp value
      if (!isNaN(value)) {
        const clampedValue = Math.max(min, Math.min(max, value));
        elements.initialTitleLength.value = clampedValue;
        updateRangeBackground(elements.initialTitleLength);

        // Update input if value was clamped
        if (clampedValue !== value) {
          elements.initialTitleLengthValue.value = clampedValue;
        }

        // Sync with settings
        if (elements.settingsTitleLength) {
          elements.settingsTitleLength.value = clampedValue;
          elements.settingsTitleLengthValue.textContent = clampedValue;
          updateRangeBackground(elements.settingsTitleLength);
        }

        // Auto-save with debounce
        clearTimeout(titleLengthTimeout);
        titleLengthTimeout = setTimeout(async () => {
          try {
            const settings = await window.electronAPI.settings.load();
            settings.titleLength = clampedValue;
            await window.electronAPI.settings.save(settings);
          } catch (error) {
            console.error("Error auto-saving title length:", error);
          }
        }, 500);
      }
    });
  }

  if (elements.initialDescLength && elements.initialDescLengthValue) {
    let descLengthTimeout;

    // Range slider to number input sync
    elements.initialDescLength.addEventListener("input", () => {
      elements.initialDescLengthValue.value = elements.initialDescLength.value;
      updateRangeBackground(elements.initialDescLength);

      // Sync with settings
      if (elements.settingsDescLength) {
        elements.settingsDescLength.value = elements.initialDescLength.value;
        elements.settingsDescLengthValue.textContent =
          elements.initialDescLength.value;
        updateRangeBackground(elements.settingsDescLength);
      }

      // Auto-save with debounce
      clearTimeout(descLengthTimeout);
      descLengthTimeout = setTimeout(async () => {
        try {
          const settings = await window.electronAPI.settings.load();
          settings.descriptionLength = parseInt(
            elements.initialDescLength.value,
          );
          await window.electronAPI.settings.save(settings);
        } catch (error) {
          console.error("Error auto-saving description length:", error);
        }
      }, 500);
    });

    // Number input to range slider sync
    elements.initialDescLengthValue.addEventListener("change", () => {
      const value = parseInt(elements.initialDescLengthValue.value);
      const min = parseInt(elements.initialDescLengthValue.min);
      const max = parseInt(elements.initialDescLengthValue.max);

      // Validate and clamp value
      if (!isNaN(value)) {
        const clampedValue = Math.max(min, Math.min(max, value));
        elements.initialDescLength.value = clampedValue;
        updateRangeBackground(elements.initialDescLength);

        // Update input if value was clamped
        if (clampedValue !== value) {
          elements.initialDescLengthValue.value = clampedValue;
        }

        // Sync with settings
        if (elements.settingsDescLength) {
          elements.settingsDescLength.value = clampedValue;
          elements.settingsDescLengthValue.textContent = clampedValue;
          updateRangeBackground(elements.settingsDescLength);
        }

        // Auto-save with debounce
        clearTimeout(descLengthTimeout);
        descLengthTimeout = setTimeout(async () => {
          try {
            const settings = await window.electronAPI.settings.load();
            settings.descriptionLength = clampedValue;
            await window.electronAPI.settings.save(settings);
          } catch (error) {
            console.error("Error auto-saving description length:", error);
          }
        }, 500);
      }
    });
  }

  if (elements.initialKeywordCount && elements.initialKeywordCountValue) {
    let keywordCountTimeout;

    // Range slider to number input sync
    elements.initialKeywordCount.addEventListener("input", () => {
      elements.initialKeywordCountValue.value =
        elements.initialKeywordCount.value;
      updateRangeBackground(elements.initialKeywordCount);

      // Sync with settings
      if (elements.settingsKeywordCount) {
        elements.settingsKeywordCount.value =
          elements.initialKeywordCount.value;
        elements.settingsKeywordCountValue.textContent =
          elements.initialKeywordCount.value;
        updateRangeBackground(elements.settingsKeywordCount);
      }

      // Auto-save with debounce
      clearTimeout(keywordCountTimeout);
      keywordCountTimeout = setTimeout(async () => {
        try {
          const settings = await window.electronAPI.settings.load();
          settings.keywordCount = parseInt(elements.initialKeywordCount.value);
          await window.electronAPI.settings.save(settings);
        } catch (error) {
          console.error("Error auto-saving keyword count:", error);
        }
      }, 500);
    });

    // Number input to range slider sync
    elements.initialKeywordCountValue.addEventListener("change", () => {
      const value = parseInt(elements.initialKeywordCountValue.value);
      const min = parseInt(elements.initialKeywordCountValue.min);
      const max = parseInt(elements.initialKeywordCountValue.max);

      // Validate and clamp value
      if (!isNaN(value)) {
        const clampedValue = Math.max(min, Math.min(max, value));
        elements.initialKeywordCount.value = clampedValue;
        updateRangeBackground(elements.initialKeywordCount);

        // Update input if value was clamped
        if (clampedValue !== value) {
          elements.initialKeywordCountValue.value = clampedValue;
        }

        // Sync with settings
        if (elements.settingsKeywordCount) {
          elements.settingsKeywordCount.value = clampedValue;
          elements.settingsKeywordCountValue.textContent = clampedValue;
          updateRangeBackground(elements.settingsKeywordCount);
        }

        // Auto-save with debounce
        clearTimeout(keywordCountTimeout);
        keywordCountTimeout = setTimeout(async () => {
          try {
            const settings = await window.electronAPI.settings.load();
            settings.keywordCount = clampedValue;
            await window.electronAPI.settings.save(settings);
          } catch (error) {
            console.error("Error auto-saving keyword count:", error);
          }
        }, 500);
      }
    });
  }

  if (elements.initialKeywordFormatGroup) {
    initializeKeywordFormatGroup(
      elements.initialKeywordFormatGroup,
      async (format) => {
        // Sync with settings
        if (elements.settingsKeywordFormatGroup) {
          setKeywordFormat(elements.settingsKeywordFormatGroup, format);
        }

        // Auto-save immediately for format changes
        try {
          const settings = await window.electronAPI.settings.load();
          settings.keywordFormat = format;
          await window.electronAPI.settings.save(settings);
        } catch (error) {
          console.error("Error auto-saving keyword format:", error);
        }
      },
    );
  }

  if (elements.initialEditKeywordsBtn) {
    elements.initialEditKeywordsBtn.addEventListener("click", () => {
      // Open settings dialog and switch to AI section
      if (elements.settingsDialog && elements.aiSectionBtn) {
        elements.settingsDialog.classList.add("visible");
        elements.aiSectionBtn.click();
      }
    });
  }

  // No need for keyword tab navigation with the new horizontal layout

  // Set up file type dropdown toggle
  if (elements.filetypeDropdown) {
    const dropdownToggle =
      elements.filetypeDropdown.querySelector(".dropdown-toggle");

    if (dropdownToggle) {
      dropdownToggle.addEventListener("click", (e) => {
        e.preventDefault();
        elements.filetypeDropdown.classList.toggle("open");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!elements.filetypeDropdown.contains(e.target)) {
          elements.filetypeDropdown.classList.remove("open");
        }
      });
    }
  }

  // Set up positive keyword adding
  if (elements.addPositiveKeywordBtn && elements.positiveKeywordInput) {
    // Function to add a positive keyword tag
    const addPositiveKeyword = () => {
      const keyword = elements.positiveKeywordInput.value.trim();
      if (keyword) {
        // Get selected target and file types
        const targetSelect = document.getElementById("positive-keyword-target");
        const target = targetSelect ? targetSelect.value : "keywords";

        // Get selected file types from the checkboxes in the dropdown
        const filetypeCheckboxes = document.querySelectorAll(
          "#filetype-dropdown input[type='checkbox']",
        );
        const filetypes = [];

        // Get all checked checkboxes
        filetypeCheckboxes.forEach((checkbox) => {
          if (checkbox.checked) {
            filetypes.push(checkbox.value);
          }
        });

        // Default to all file types if none selected
        if (filetypes.length === 0) {
          filetypes.push("jpg", "png", "eps");
        }

        // Add the keyword with its options
        addKeywordTag(keyword, elements.positiveKeywordsContainer, {
          target: target,
          filetypes: filetypes,
        });

        elements.positiveKeywordInput.value = "";
        updateKeywordsHiddenInput();
      }
    };

    // Add keyword on button click
    elements.addPositiveKeywordBtn.addEventListener(
      "click",
      addPositiveKeyword,
    );

    // Add keyword on Enter key
    elements.positiveKeywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addPositiveKeyword();
      }
    });
  }

  // Set up negative keyword adding
  if (elements.addNegativeKeywordBtn && elements.negativeKeywordInput) {
    // Function to add a negative keyword tag
    const addNegativeKeyword = () => {
      const keyword = elements.negativeKeywordInput.value.trim();
      if (keyword) {
        addKeywordTag(keyword, elements.negativeKeywordsContainer);
        elements.negativeKeywordInput.value = "";
        updateKeywordsHiddenInput();
      }
    };

    // Add keyword on button click
    elements.addNegativeKeywordBtn.addEventListener(
      "click",
      addNegativeKeyword,
    );

    // Add keyword on Enter key
    elements.negativeKeywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addNegativeKeyword();
      }
    });
  }

  elements.settingsBtn.addEventListener("click", () => {
    // Open settings dialog immediately with AI Parameters tab as default
    showSettingsWithTab("ai-section");
  });

  elements.closeSettings.addEventListener("click", () => {
    elements.settingsDialog.classList.remove("active");
  });

  elements.cancelSettings.addEventListener("click", () => {
    elements.settingsDialog.classList.remove("active");
  });

  elements.helpDialog.addEventListener("click", (e) => {
    if (e.target === elements.helpDialog) {
      elements.helpDialog.classList.remove("active");
    }
  });

  elements.settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveAndSyncSettings();
    elements.settingsDialog.classList.remove("active");
  });

  elements.saveSettings.addEventListener("click", async () => {
    await saveAndSyncSettings();
    elements.settingsDialog.classList.remove("active");
  });

  // Dark mode toggle event listener
  if (elements.settingsDarkMode) {
    elements.settingsDarkMode.addEventListener("change", function () {
      if (this.checked) {
        document.documentElement.classList.remove("light-theme");
        document.documentElement.classList.add("dark-theme");
      } else {
        document.documentElement.classList.remove("dark-theme");
        document.documentElement.classList.add("light-theme");
      }
    });
  }

  // CSV Export validation - ensure at least one market is enabled
  const csvCheckboxes = [
    "csv-enable-general",
    "csv-enable-adobestock",
    "csv-enable-freepik",
    "csv-enable-shutterstock",
    "csv-enable-istock",
    "csv-enable-pond5",
    "csv-enable-123rf",
    "csv-enable-dreamstime",
    "csv-enable-vecteezy",
  ];

  csvCheckboxes.forEach((checkboxId) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
      checkbox.addEventListener("change", function () {
        // Count how many checkboxes are currently checked
        const checkedCount = csvCheckboxes.filter((id) => {
          const cb = document.getElementById(id);
          return cb && cb.checked;
        }).length;

        // If this is the last checkbox and user is trying to uncheck it, prevent it
        if (checkedCount === 0) {
          this.checked = true;
          showToastNotification(
            "At least one CSV export market must be enabled",
            "warning",
            3000,
          );
        }
      });
    }
  });

  // 123RF Settings Popup Event Listeners
  const csv123rfSettingsBtn = document.getElementById("csv-123rf-settings-btn");
  const csv123rfSettingsDialog = document.getElementById(
    "csv-123rf-settings-dialog",
  );
  const close123rfSettings = document.getElementById("close-123rf-settings");
  const cancel123rfSettings = document.getElementById("cancel-123rf-settings");
  const save123rfSettings = document.getElementById("save-123rf-settings");
  const csv123rfCountryInput = document.getElementById("csv-123rf-country");

  if (csv123rfSettingsBtn && csv123rfSettingsDialog) {
    // Open 123RF settings popup
    csv123rfSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent label click
      csv123rfSettingsDialog.classList.add("active");
    });

    // Close popup handlers
    if (close123rfSettings) {
      close123rfSettings.addEventListener("click", () => {
        csv123rfSettingsDialog.classList.remove("active");
      });
    }

    if (cancel123rfSettings) {
      cancel123rfSettings.addEventListener("click", () => {
        csv123rfSettingsDialog.classList.remove("active");
      });
    }

    // Save 123RF settings
    if (save123rfSettings && csv123rfCountryInput) {
      save123rfSettings.addEventListener("click", async () => {
        const countryCode = csv123rfCountryInput.value.trim().toUpperCase();

        // Validate country code (2 letters)
        if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
          showToastNotification(
            "Please enter a valid 2-letter country code (e.g., US, UK, BD)",
            "error",
            3000,
          );
          return;
        }

        // Save to settings
        const settings = await window.electronAPI.settings.load();
        if (!settings.csvExportMarkets) {
          settings.csvExportMarkets = {};
        }
        if (!settings.csvExportMarkets["123rf"]) {
          settings.csvExportMarkets["123rf"] = { enabled: true };
        }
        settings.csvExportMarkets["123rf"].country = countryCode;

        const saved = await window.electronAPI.settings.save(settings);
        if (saved) {
          showToastNotification(
            `123RF country code set to ${countryCode}`,
            "success",
            2000,
          );
          csv123rfSettingsDialog.classList.remove("active");
        } else {
          showToastNotification("Failed to save settings", "error", 3000);
        }
      });
    }

    // Close on overlay click
    csv123rfSettingsDialog.addEventListener("click", (e) => {
      if (e.target === csv123rfSettingsDialog) {
        csv123rfSettingsDialog.classList.remove("active");
      }
    });

    // Auto-uppercase input
    if (csv123rfCountryInput) {
      csv123rfCountryInput.addEventListener("input", function () {
        this.value = this.value.toUpperCase();
      });
    }
  }

  // Pond5 Settings Popup Event Listeners
  const csvPond5SettingsBtn = document.getElementById("csv-pond5-settings-btn");
  const csvPond5SettingsDialog = document.getElementById(
    "csv-pond5-settings-dialog",
  );
  const closePond5Settings = document.getElementById("close-pond5-settings");
  const cancelPond5Settings = document.getElementById("cancel-pond5-settings");
  const savePond5Settings = document.getElementById("save-pond5-settings");
  const csvPond5EditorialCheckbox = document.getElementById(
    "csv-pond5-editorial",
  );

  if (csvPond5SettingsBtn && csvPond5SettingsDialog) {
    // Open Pond5 settings popup
    csvPond5SettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent label click
      csvPond5SettingsDialog.classList.add("active");
    });

    // Close popup handlers
    if (closePond5Settings) {
      closePond5Settings.addEventListener("click", () => {
        csvPond5SettingsDialog.classList.remove("active");
      });
    }

    if (cancelPond5Settings) {
      cancelPond5Settings.addEventListener("click", () => {
        csvPond5SettingsDialog.classList.remove("active");
      });
    }

    // Save Pond5 settings
    if (savePond5Settings && csvPond5EditorialCheckbox) {
      savePond5Settings.addEventListener("click", async () => {
        const editorial = csvPond5EditorialCheckbox.checked;

        // Save to settings
        const settings = await window.electronAPI.settings.load();
        if (!settings.csvExportMarkets) {
          settings.csvExportMarkets = {};
        }
        if (!settings.csvExportMarkets.pond5) {
          settings.csvExportMarkets.pond5 = { enabled: true };
        }
        settings.csvExportMarkets.pond5.editorial = editorial;

        const saved = await window.electronAPI.settings.save(settings);
        if (saved) {
          showToastNotification(
            `Pond5 editorial ${editorial ? "enabled" : "disabled"}`,
            "success",
            2000,
          );
          csvPond5SettingsDialog.classList.remove("active");
        } else {
          showToastNotification("Failed to save settings", "error", 3000);
        }
      });
    }

    // Close on overlay click
    csvPond5SettingsDialog.addEventListener("click", (e) => {
      if (e.target === csvPond5SettingsDialog) {
        csvPond5SettingsDialog.classList.remove("active");
      }
    });
  }

  // iStock Settings Popup Event Listeners
  const csvIstockSettingsBtn = document.getElementById(
    "csv-istock-settings-btn",
  );
  const csvIstockSettingsDialog = document.getElementById(
    "csv-istock-settings-dialog",
  );
  const closeIstockSettings = document.getElementById("close-istock-settings");
  const cancelIstockSettings = document.getElementById(
    "cancel-istock-settings",
  );
  const saveIstockSettings = document.getElementById("save-istock-settings");
  const csvIstockEditorialCheckbox = document.getElementById(
    "csv-istock-editorial",
  );
  const csvIstockArtistNameInput = document.getElementById(
    "csv-istock-artist-name",
  );

  if (csvIstockSettingsBtn && csvIstockSettingsDialog) {
    // Open iStock settings popup
    csvIstockSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent label click
      csvIstockSettingsDialog.classList.add("active");
    });

    // Close popup handlers
    if (closeIstockSettings) {
      closeIstockSettings.addEventListener("click", () => {
        csvIstockSettingsDialog.classList.remove("active");
      });
    }

    if (cancelIstockSettings) {
      cancelIstockSettings.addEventListener("click", () => {
        csvIstockSettingsDialog.classList.remove("active");
      });
    }

    // Save iStock settings
    if (
      saveIstockSettings &&
      csvIstockEditorialCheckbox &&
      csvIstockArtistNameInput
    ) {
      saveIstockSettings.addEventListener("click", async () => {
        const editorial = csvIstockEditorialCheckbox.checked;
        const artistName = csvIstockArtistNameInput.value.trim();

        // Save to settings
        const settings = await window.electronAPI.settings.load();
        if (!settings.csvExportMarkets) {
          settings.csvExportMarkets = {};
        }
        if (!settings.csvExportMarkets.istock) {
          settings.csvExportMarkets.istock = { enabled: true };
        }
        settings.csvExportMarkets.istock.editorial = editorial;
        settings.csvExportMarkets.istock.artistName = artistName;

        const saved = await window.electronAPI.settings.save(settings);
        if (saved) {
          showToastNotification(
            "iStock settings saved successfully",
            "success",
            2000,
          );
          csvIstockSettingsDialog.classList.remove("active");
        } else {
          showToastNotification("Failed to save settings", "error", 3000);
        }
      });
    }

    // Close on overlay click
    csvIstockSettingsDialog.addEventListener("click", (e) => {
      if (e.target === csvIstockSettingsDialog) {
        csvIstockSettingsDialog.classList.remove("active");
      }
    });
  }

  // Set up initial state file selection buttons
  if (elements.initialSelectFilesBtn) {
    elements.initialSelectFilesBtn.addEventListener("click", async () => {
      try {
        const result = await window.electronAPI.files.selectImages();
        if (result) {
          selectedPath = result.path;
          selectedFiles = result.selectedFiles; // Store the selected files
          // Show parent folder path for selected files
          elements.selectedPath.textContent = selectedPath;
          elements.imageCount.textContent = `${result.imageCount} Files`;
          elements.imageCount.style.display =
            result.imageCount > 0 ? "flex" : "none";

          if (elements.clearStateBtn) {
            elements.clearStateBtn.disabled = false;
          }

          if (elements.regenerateBtn) {
            elements.regenerateBtn.disabled = false;
          }

          updateSelectionState();
        }
      } catch {
        showToastNotification(
          "Failed to select images. Please try again.",
          "error",
        );
      }
    });
  }

  if (elements.initialSelectFolderBtn) {
    elements.initialSelectFolderBtn.addEventListener("click", async () => {
      try {
        const result = await window.electronAPI.files.selectPath();
        if (result) {
          selectedPath = result.path;
          selectedFiles = null; // Clear any previously selected files
          // Show full folder path
          elements.selectedPath.textContent = selectedPath;
          elements.imageCount.textContent = `${result.imageCount} Files`;
          elements.imageCount.style.display =
            result.imageCount > 0 ? "flex" : "none";

          if (elements.clearStateBtn) {
            elements.clearStateBtn.disabled = false;
          }

          if (elements.regenerateBtn) {
            elements.regenerateBtn.disabled = false;
          }

          updateSelectionState();
        }
      } catch {
        showToastNotification(
          "Failed to select directory. Please try again.",
          "error",
        );
      }
    });
  }

  elements.helpBtn.addEventListener("click", () => {
    elements.helpDialog.classList.add("active");
  });

  elements.closeHelpDialogBtn.addEventListener("click", () => {
    elements.helpDialog.classList.remove("active");
  });

  elements.closeHelpBtn.addEventListener("click", () => {
    elements.helpDialog.classList.remove("active");
  });

  // Profile dropdown functionality
  if (elements.profileBtn) {
    elements.profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }

  // Close profile dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      elements.profileDropdown &&
      !elements.profileDropdown.contains(e.target) &&
      !elements.profileBtn.contains(e.target)
    ) {
      closeProfileDropdown();
    }
  });

  // Set up the check update button
  if (elements.checkUpdateBtn) {
    elements.checkUpdateBtn.addEventListener("click", async () => {
      try {
        elements.checkUpdateBtn.innerHTML;
        elements.checkUpdateBtn.disabled = true;
        elements.checkUpdateBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Checking...';

        // Check for updates
        await window.electronAPI.updates.checkForUpdates();

        // Also check API status if logged in
        const isLoggedIn = await window.electronAPI.auth.checkLoginStatus();
        if (isLoggedIn) {
          await checkApiStatus(true); // Force check when manually checking for updates
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      } finally {
        elements.checkUpdateBtn.disabled = false;
        elements.checkUpdateBtn.innerHTML =
          '<i class="fas fa-arrows-rotate"></i> Check Updates';
      }
    });
  }

  elements.closeApiValidationDialog.addEventListener("click", () => {
    hideApiValidationErrorDialog();
  });

  elements.closeApiValidationBtn.addEventListener("click", () => {
    hideApiValidationErrorDialog();
  });

  elements.openSettingsFromValidationBtn.addEventListener("click", () => {
    hideApiValidationErrorDialog();
    elements.settingsDialog.classList.add("active");
  });

  if (elements.clearStateBtn) {
    elements.clearStateBtn.addEventListener("click", () => {
      selectedPath = null;
      selectedFiles = null;

      if (elements.selectedPath) {
        elements.selectedPath.textContent = "No Selection";
      }

      if (elements.imageCount) {
        elements.imageCount.textContent = "0 Files";
        elements.imageCount.style.display = "flex";
      }

      resetAppState();

      if (elements.initialState) {
        elements.initialState.classList.remove("hidden");
      }

      if (elements.resultsSummary) {
        elements.resultsSummary.classList.add("hidden");
      }

      if (elements.initialGenerateBtn) {
        elements.initialGenerateBtn.disabled = true;
        elements.initialGenerateBtn.innerHTML =
          '<i class="fas fa-bolt"></i> Generate';
      }

      elements.clearStateBtn.disabled = true;

      if (elements.regenerateBtn) {
        elements.regenerateBtn.disabled = true;
      }

      updateSelectionState();
    });
  }

  // Clear selection button (in file preview section)
  if (elements.clearSelectionBtn) {
    elements.clearSelectionBtn.addEventListener("click", () => {
      selectedPath = null;
      selectedFiles = null;

      if (elements.selectedPath) {
        elements.selectedPath.textContent = "No Selection";
      }

      if (elements.imageCount) {
        elements.imageCount.textContent = "0 Files";
        elements.imageCount.style.display = "flex";
      }

      if (elements.clearStateBtn) {
        elements.clearStateBtn.disabled = true;
      }

      if (elements.regenerateBtn) {
        elements.regenerateBtn.disabled = true;
      }

      updateSelectionState();
    });
  }

  // Set up bulk edit tabs
  if (elements.bulkEditTabs) {
    elements.bulkEditTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        // Remove active class from all tabs and content
        elements.bulkEditTabs.forEach((t) => t.classList.remove("active"));
        elements.tabContents.forEach((content) =>
          content.classList.remove("active"),
        );

        // Add active class to clicked tab
        e.target.classList.add("active");

        // Show the corresponding content
        const tabId = e.target.getAttribute("data-tab");
        document.getElementById(tabId)?.classList.add("active");
      });
    });
  }

  // Set up title action radios
  if (elements.titleAction) {
    elements.titleAction.forEach((radio) => {
      radio.addEventListener("change", () => {
        // First hide all conditional input groups
        if (elements.titleReplaceText)
          elements.titleReplaceText.style.display = "none";
        if (elements.titlePositionOptions)
          elements.titlePositionOptions.style.display = "none";
        if (elements.titlePositionGroup)
          elements.titlePositionGroup.style.display = "none";
        if (elements.bulkTitleText)
          elements.bulkTitleText.style.display = "block";

        // Update the hint
        const titleHint = document.getElementById("title-hint");

        // Show the appropriate input group based on the selected action
        if (radio.value === "replace" && radio.checked) {
          elements.titleReplaceText.style.display = "block";
          if (titleHint)
            titleHint.textContent =
              "Text will replace all or part of each title";
        } else if (radio.value === "insert" && radio.checked) {
          elements.titlePositionOptions.style.display = "block";
          if (titleHint)
            titleHint.textContent =
              "Text will be inserted at the specified position";

          // Check if the current position type is 'custom' and show position input if it is
          const customPositionRadio = Array.from(
            elements.titlePositionRadios,
          ).find((r) => r.value === "custom" && r.checked);

          if (customPositionRadio) {
            elements.titlePositionGroup.style.display = "block";
          }
        } else if (radio.value === "from-description" && radio.checked) {
          if (elements.bulkTitleText)
            elements.bulkTitleText.style.display = "none";
          if (titleHint)
            titleHint.textContent =
              "Title will be updated using the description text";
        }
      });
    });
  }

  // Set up title position type radios
  if (elements.titlePositionRadios) {
    elements.titlePositionRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "custom" && radio.checked) {
          elements.titlePositionGroup.style.display = "block";
        } else {
          elements.titlePositionGroup.style.display = "none";
        }

        // Update hint based on position
        const titleHint = document.getElementById("title-hint");
        if (titleHint) {
          if (radio.value === "first") {
            titleHint.textContent =
              "Text will be inserted at the beginning of each title";
          } else if (radio.value === "last") {
            titleHint.textContent =
              "Text will be inserted at the end of each title";
          } else if (radio.value === "custom") {
            titleHint.textContent =
              "Text will be inserted at the specified word position";
          }
        }
      });
    });
  }

  // Set up description action radios
  if (elements.descriptionAction) {
    elements.descriptionAction.forEach((radio) => {
      radio.addEventListener("change", () => {
        // First hide all conditional input groups
        if (elements.descriptionReplaceText)
          elements.descriptionReplaceText.style.display = "none";
        if (elements.descriptionPositionOptions)
          elements.descriptionPositionOptions.style.display = "none";
        if (elements.descriptionPositionGroup)
          elements.descriptionPositionGroup.style.display = "none";
        if (elements.bulkDescriptionText)
          elements.bulkDescriptionText.style.display = "block";

        // Update the hint
        const descriptionHint = document.getElementById("description-hint");

        // Show the appropriate input group based on the selected action
        if (radio.value === "replace" && radio.checked) {
          elements.descriptionReplaceText.style.display = "block";
          if (descriptionHint)
            descriptionHint.textContent =
              "Text will replace all or part of each description";
        } else if (radio.value === "insert" && radio.checked) {
          elements.descriptionPositionOptions.style.display = "block";
          if (descriptionHint)
            descriptionHint.textContent =
              "Text will be inserted at the specified position";

          // Check if the current position type is 'custom' and show position input if it is
          const customPositionRadio = Array.from(
            elements.descriptionPositionRadios,
          ).find((r) => r.value === "custom" && r.checked);

          if (customPositionRadio) {
            elements.descriptionPositionGroup.style.display = "block";
          }
        } else if (radio.value === "from-title" && radio.checked) {
          if (elements.bulkDescriptionText)
            elements.bulkDescriptionText.style.display = "none";
          if (descriptionHint)
            descriptionHint.textContent =
              "Description will be updated using the title text";
        }
      });
    });
  }

  // Set up description position type radios
  if (elements.descriptionPositionRadios) {
    elements.descriptionPositionRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "custom" && radio.checked) {
          elements.descriptionPositionGroup.style.display = "block";
        } else {
          elements.descriptionPositionGroup.style.display = "none";
        }

        // Update hint based on position
        const descriptionHint = document.getElementById("description-hint");
        if (descriptionHint) {
          if (radio.value === "first") {
            descriptionHint.textContent =
              "Text will be inserted at the beginning of each description";
          } else if (radio.value === "last") {
            descriptionHint.textContent =
              "Text will be inserted at the end of each description";
          } else if (radio.value === "custom") {
            descriptionHint.textContent =
              "Text will be inserted at the specified word position";
          }
        }
      });
    });
  }

  // End of event listeners setup

  // Add event listeners for rename files dialog
  if (elements.renameFilesBtn) {
    elements.renameFilesBtn.addEventListener("click", openRenameDialog);
  }

  if (elements.closeRenameDialog) {
    elements.closeRenameDialog.addEventListener("click", closeRenameDialog);
  }

  if (elements.cancelRename) {
    elements.cancelRename.addEventListener("click", closeRenameDialog);
  }

  if (elements.applyRename) {
    elements.applyRename.addEventListener("click", renameFiles);
  }

  // Settings menu navigation
  const settingsMenuItems = document.querySelectorAll(".settings-menu-item");
  settingsMenuItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all menu items and sections
      document.querySelectorAll(".settings-menu-item").forEach((menuItem) => {
        menuItem.classList.remove("active");
      });

      document.querySelectorAll(".settings-section").forEach((section) => {
        section.classList.remove("active");
      });

      // Add active class to clicked menu item
      this.classList.add("active");

      // Show corresponding section
      const sectionId = this.getAttribute("data-section");
      document.getElementById(sectionId).classList.add("active");

      // Auto-detect Ghostscript when system configuration tab is opened
      if (
        sectionId === "system-section" &&
        typeof window.checkGhostscriptInstallation === "function"
      ) {
        setTimeout(() => {
          window.checkGhostscriptInstallation();
        }, 100);
      }
    });
  });

  // Advanced Settings Event Handlers
  const enableCustomPromptToggle = document.getElementById(
    "settings-enable-custom-prompt",
  );
  const customPromptContainer = document.getElementById(
    "custom-prompt-container",
  );

  if (enableCustomPromptToggle && customPromptContainer) {
    enableCustomPromptToggle.addEventListener("change", function () {
      if (this.checked) {
        customPromptContainer.style.display = "block";
        customPromptContainer.classList.add("show");
      } else {
        customPromptContainer.style.display = "none";
        customPromptContainer.classList.remove("show");
      }
    });
  }
}

// Function to retry all failed items
async function retryFailedItems() {
  if (!selectedPath || !outputDirectory) {
    showToastNotification(
      "No processing results available to retry",
      "warning",
    );
    return;
  }

  // Get all failed items from the results list
  const failedItems = document.querySelectorAll(
    ".result-item.error:not(.cancelled)",
  );
  if (!failedItems || failedItems.length === 0) {
    showToastNotification("No failed items to retry", "info");
    return;
  }

  // Collect the failed files
  const failedFiles = [];
  failedItems.forEach((item) => {
    const filenameElement = item.querySelector(".filename-display");
    if (filenameElement) {
      const filename = filenameElement.getAttribute("data-filename");
      if (filename) {
        // Use string concatenation instead of path.join
        const filePath =
          selectedPath +
          (selectedPath.endsWith("/") || selectedPath.endsWith("\\")
            ? ""
            : "\\") +
          filename;
        failedFiles.push({
          filename: filename,
          path: filePath,
        });
      }
    }
  });

  if (failedFiles.length === 0) {
    showToastNotification("Could not identify failed files to retry", "error");
    return;
  }

  try {
    const settings = await window.electronAPI.settings.load();
    if (!settings || (!settings.apiKey && (!settings.apiKeys || settings.apiKeys.length === 0))) {
      showToastNotification(
        "Please set your valid Gemini API key in settings first",
        "warning",
      );
      elements.settingsDialog.classList.add("active");
      return;
    }

    // Disable the retry button during processing
    elements.retryFailedBtn.disabled = true;
    elements.retryFailedBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Retrying...';

    // Store existing successful results
    const existingSuccessfulItems = document.querySelectorAll(
      ".result-item:not(.error):not(.cancelled)",
    );
    const existingSuccessfulResults = Array.from(existingSuccessfulItems).map(
      (item) => {
        // Save the DOM element reference for later restoration
        return { element: item.cloneNode(true) };
      },
    );

    // Set a global flag to indicate we're in retry mode
    window.isRetryMode = true;
    window.existingSuccessfulResults = existingSuccessfulResults;

    // Remove failed items from the results list
    failedItems.forEach((item) => item.remove());

    // Set up processing listeners for retry mode
    setupProcessingListeners();

    // Create a config with the selected path and failed files
    const config = {
      path: selectedPath,
      selectedFiles: failedFiles,
      retryMode: true, // Flag to indicate this is a retry operation
      outputDirectory: outputDirectory, // Use the same output directory
    };

    await window.electronAPI.processing.submit(config);
  } catch (error) {
    showToastNotification(
      `An error occurred while retrying failed items: ${error.message}`,
      "error",
    );
    // Re-enable the retry button
    elements.retryFailedBtn.disabled = false;
    elements.retryFailedBtn.innerHTML =
      '<i class="fas fa-redo"></i> Retry Failed';

    // Reset retry mode flag
    window.isRetryMode = false;
    window.existingSuccessfulResults = null;
  }
}

// Set up event listeners for processing events
function setupProcessingListeners() {
  window.electronAPI.cleanup.removeListeners();

  const listenerCleanupFunctions = [];

  // Set all buttons to processing state
  updateOutputButtons({
    isProcessing: true,
    hasResults: false,
    hasErrors: false,
    hasModifications: false,
  });

  // Premium plan - credits are unlimited, no tracking needed
  const creditUpdateRemover = window.electronAPI.processing.updateCredit(
    () => {},
  );
  listenerCleanupFunctions.push(creditUpdateRemover);

  const startRemover = window.electronAPI.processing.onStart((data) => {
    // Reset the Ghostscript error flag when starting new processing
    window.hasShownGhostscriptError = false;

    elements.initialState.classList.add("hidden");

    elements.progressContainer.classList.remove("hidden");
    elements.resultsSummary.classList.add("hidden");

    // Hide the "Home" button when processing starts
    if (elements.clearStateBtn) {
      elements.clearStateBtn.classList.add("hidden");
    }

    // Hide regenerate button when processing starts
    if (elements.regenerateBtn) {
      elements.regenerateBtn.classList.add("hidden");
    }

    elements.progressBar.style.width = "0%";
    elements.progressStatus.textContent = "Processing images...";
    elements.progressCount.textContent = `0/${data.total}`;

    // Only clear the results list if we're not in retry mode
    if (!window.isRetryMode) {
      elements.resultsList.innerHTML = "";
    } else {
      // In retry mode, only remove the failed items that we're retrying
      const failedItems = document.querySelectorAll(
        ".result-item.error:not(.cancelled)",
      );
      failedItems.forEach((item) => item.remove());
    }

    elements.noResults.classList.add("hidden");

    if (elements.initialGenerateBtn) {
      elements.initialGenerateBtn.disabled = true;
      elements.initialGenerateBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }

    if (elements.clearStateBtn) {
      elements.clearStateBtn.disabled = true;
    }

    if (elements.regenerateBtn) {
      elements.regenerateBtn.disabled = true;
    }

    if (elements.stopBtn) {
      elements.stopBtn.disabled = false;
      elements.stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }

    // Don't clear modified metadata in retry mode
    if (!window.isRetryMode) {
      modifiedMetadata.clear();
    }

    elements.resultsSummary.classList.remove("hidden");

    // In retry mode, we need to preserve the existing counts
    if (!window.isRetryMode) {
      const totalCount = data.total || 0;
      elements.totalCount.textContent = totalCount.toString();
      elements.successCount.textContent = "0";
      elements.failedCount.textContent = "0";
    } else {
      // In retry mode, update the total count but keep the success count
      const currentSuccessCount = parseInt(
        elements.successCount.textContent || "0",
      );
      const retryingCount = data.total || 0;

      // Keep existing success count and add the retrying count to total
      elements.totalCount.textContent = (
        currentSuccessCount + retryingCount
      ).toString();

      // Keep the existing success count
      // Reset the failed count since we're retrying all failed items
      elements.failedCount.textContent = "0";
    }

    // Update all output buttons to processing state
    updateOutputButtons({
      isProcessing: true,
      hasResults: false,
      hasErrors: false,
      hasModifications: false,
    });
  });
  listenerCleanupFunctions.push(startRemover);

  const progressRemover = window.electronAPI.processing.onProgress((data) => {
    elements.progressBar.style.width = `${data.percent}%`;
    elements.progressCount.textContent = `${data.current}/${data.total}`;

    if (data.successCount !== undefined && data.failedCount !== undefined) {
      if (!window.isRetryMode) {
        // Normal mode - just update the counts
        elements.successCount.textContent = data.successCount.toString();
        elements.failedCount.textContent = data.failedCount.toString();
      } else {
        // Retry mode - add to existing success count
        const existingSuccessCount = window.existingSuccessfulResults
          ? window.existingSuccessfulResults.length
          : 0;
        elements.successCount.textContent = (
          existingSuccessCount + data.successCount
        ).toString();
        elements.failedCount.textContent = data.failedCount.toString();
      }
    } else {
      // Fallback counting logic when success/failed counts aren't provided
      const totalProcessed = data.current;
      const successCount = parseInt(elements.successCount.textContent || "0");
      const failedCount = parseInt(elements.failedCount.textContent || "0");
      const currentlyDisplayedTotal = successCount + failedCount;

      if (currentlyDisplayedTotal < totalProcessed) {
        const successElements = document.querySelectorAll(
          ".result-item:not(.error):not(.cancelled)",
        ).length;
        const failedElements = document.querySelectorAll(
          ".result-item.error:not(.cancelled)",
        ).length;

        if (successElements + failedElements > 0) {
          if (!window.isRetryMode) {
            elements.successCount.textContent = successElements.toString();
          } else {
            const existingSuccessCount = window.existingSuccessfulResults
              ? window.existingSuccessfulResults.length
              : 0;
            elements.successCount.textContent = (
              existingSuccessCount + successElements
            ).toString();
          }
          elements.failedCount.textContent = failedElements.toString();
        }
      }
    }

    if (data.current === data.total) {
      elements.progressStatus.textContent = "Finalizing...";

      // Show the "Home" button when processing is complete
      setTimeout(() => {
        if (elements.clearStateBtn) {
          const successCount = elements.successCount
            ? parseInt(elements.successCount.textContent || "0")
            : 0;
          const failedCount = elements.failedCount
            ? parseInt(elements.failedCount.textContent || "0")
            : 0;
          const totalCount = elements.totalCount
            ? parseInt(elements.totalCount.textContent || "0")
            : 0;

          // Show the button if there are any results (successful or failed) or if total > 0
          if (successCount > 0 || failedCount > 0 || totalCount > 0) {
            elements.clearStateBtn.classList.remove("hidden");
            // Show regenerate button after processing completes
            if (elements.regenerateBtn) {
              elements.regenerateBtn.classList.remove("hidden");
            }
          }
        }
      }, 1000); // Small delay to let finalization complete
    }
  });
  listenerCleanupFunctions.push(progressRemover);

  const resultItemRemover = window.electronAPI.processing.onResultItem(
    (result) => {
      if (result.status === "cancelled") {
        return;
      }

      appendResultItem(result);

      // Show buttons as soon as we have any result (success or failure)
      if (elements.clearStateBtn && selectedPath) {
        elements.clearStateBtn.classList.remove("hidden");
      }
      if (elements.regenerateBtn) {
        elements.regenerateBtn.classList.remove("hidden");
      }

      // Update counts based on the new result
      const successCount = parseInt(elements.successCount.textContent || "0");
      const failedCount = parseInt(elements.failedCount.textContent || "0");
      const totalCount = parseInt(elements.totalCount.textContent || "0");

      let newSuccessCount = successCount;
      let newFailedCount = failedCount;

      if (result.error) {
        newFailedCount = failedCount + 1;
      } else {
        // In retry mode, we need to check if this is a new success
        if (!window.isRetryMode) {
          newSuccessCount = successCount + 1;
        } else {
          // In retry mode, always increment success count for newly processed items
          // since we're only processing failed items that are being retried
          newSuccessCount = successCount + 1;
        }
      }

      const newTotal = newSuccessCount + newFailedCount;
      if (newTotal <= totalCount) {
        elements.successCount.textContent = newSuccessCount.toString();
        elements.failedCount.textContent = newFailedCount.toString();
      }
    },
  );
  listenerCleanupFunctions.push(resultItemRemover);

  const resultsRemover = window.electronAPI.processing.onResults((results) => {
    // Store the output directory for later use in retries
    outputDirectory = results.outputDirectory;

    const isCancelled = results.status === "cancelled";

    // Reset retry mode flag
    window.isRetryMode = false;
    window.existingSuccessfulResults = null;

    if (!isCancelled) {
      elements.progressContainer.classList.add("hidden");
      elements.initialState.classList.add("hidden");

      // Ensure all failed items are displayed in the UI
      if (results.failed && results.failed.length > 0) {
        results.failed.forEach((failedItem) => {
          // Check if this item is already in the results list
          const existingItem = document.querySelector(
            `.result-item[data-filepath="${failedItem.originalPath}"]`,
          );

          if (!existingItem) {
            appendResultItem(failedItem);
          }
        });
      }

      // Only update counts if not in retry mode (since we're already tracking them)
      if (!window.isRetryMode) {
        const successfulCount = results.successful
          ? results.successful.length
          : 0;

        const failedCount = results.failed ? results.failed.length : 0;

        const totalCount = successfulCount + failedCount;

        elements.totalCount.textContent = totalCount.toString();
        elements.successCount.textContent = successfulCount.toString();
        elements.failedCount.textContent = failedCount.toString();
      } else {
        // In retry mode, just update the failed count from results
        // Success and total counts are already being tracked incrementally
        const failedCount = results.failed ? results.failed.length : 0;
        elements.failedCount.textContent = failedCount.toString();
      }
    }

    if (outputDirectory) {
      elements.outputDir.innerHTML = `<i class="fas fa-folder-open"></i> View Result`;
      elements.outputDir.classList.add("clickable");
      elements.outputDir.title = "Click to open output folder";

      elements.outputDir.addEventListener("click", async () => {
        try {
          const result =
            await window.electronAPI.files.openOutputDirectory(outputDirectory);
          if (!result.success) {
            showToastNotification(
              `Could not open the directory: ${result.message}`,
              "error",
            );
          }
        } catch {
          showToastNotification(
            "An error occurred while trying to open the directory.",
            "error",
          );
        }
      });
    } else {
      elements.outputDir.textContent = "Not available";
      elements.outputDir.classList.remove("clickable");
      elements.outputDir.title = "";
    }

    if (elements.initialGenerateBtn) {
      elements.initialGenerateBtn.disabled = false;
      elements.initialGenerateBtn.innerHTML =
        '<i class="fas fa-bolt"></i> Generate';
    }

    if (elements.clearStateBtn && selectedPath) {
      elements.clearStateBtn.disabled = false;
    }

    if (elements.regenerateBtn) {
      elements.regenerateBtn.disabled = false;
      elements.regenerateBtn.classList.remove("hidden");
    }

    if (elements.stopBtn) {
      elements.stopBtn.disabled = true;
      elements.stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }

    if (
      elements.exportCsvBtn &&
      document.querySelectorAll("textarea[data-filename]").length > 0
    ) {
      elements.exportCsvBtn.classList.remove("hidden");
    }

    if (
      elements.commonKeywordBtn &&
      document.querySelectorAll("textarea.metadata-keywords").length > 0
    ) {
      elements.commonKeywordBtn.classList.remove("hidden");
    }

    if (
      elements.renameFilesBtn &&
      document.querySelectorAll("textarea.metadata-title").length > 0
    ) {
      elements.renameFilesBtn.classList.remove("hidden");
    }

    if (elements.retryFailedBtn) {
      const failedCount = parseInt(elements.failedCount.textContent || "0");
      if (failedCount > 0) {
        elements.retryFailedBtn.classList.remove("hidden");
        elements.retryFailedBtn.disabled = false;
        elements.retryFailedBtn.innerHTML =
          '<i class="fas fa-redo"></i> Retry Failed';
      } else {
        elements.retryFailedBtn.classList.add("hidden");
      }
    }

    // Check for results and errors
    const hasResults =
      document.querySelectorAll("textarea[data-filename]").length > 0;
    const hasErrors = parseInt(elements.failedCount.textContent || "0") > 0;

    // Update button visibility and state
    updateOutputButtons({
      hasResults: hasResults,
      hasErrors: hasErrors,
      hasModifications: modifiedMetadata.size > 0,
      isProcessing: false,
    });

    cleanupListeners();
  });
  listenerCleanupFunctions.push(resultsRemover);

  const errorRemover = window.electronAPI.processing.onError((errorMessage) => {
    elements.progressContainer.classList.add("hidden");
    elements.initialState.classList.add("hidden");

    elements.resultsSummary.classList.remove("hidden");
    elements.totalCount.textContent = "0";
    elements.successCount.textContent = "0";
    elements.failedCount.textContent = "0";
    elements.outputDir.textContent = "Not available";

    const isExpiredError = errorMessage.includes("Your plan has expired");
    const isApiValidationError = errorMessage.includes("API validation");
    const isGhostscriptError = checkGhostscriptError(errorMessage);
    const isUpdateError = errorMessage.includes("Please update your app") || errorMessage.includes("new version is available");

    elements.resultsList.innerHTML = `
      <div class="result-item error">
        <div class="result-content">
          <div class="result-image-row">
            <div class="result-preview">
              ${generateErrorPreviewHTML(errorMessage)}
            </div>
          </div>

          <div class="metadata-details">
            <div class="filename-container">
              <div class="filename-display" title="${
                isApiValidationError
                  ? "API Validation Error"
                  : isGhostscriptError
                    ? "Ghostscript Error"
                    : isUpdateError
                      ? "Update Required"
                      : "Error"
              }">${
                isApiValidationError
                  ? "API Validation Error"
                  : isGhostscriptError
                    ? "Ghostscript Error"
                    : isUpdateError
                      ? "Update Required"
                      : "Error"
              }</div>
              <span class="status error">Failed</span>
            </div>
            <div class="result-message">
              ${errorMessage}
            </div>
            ${
              isApiValidationError
                ? `
            <div class="result-action">
              <button class="btn secondary open-settings-btn">
                <i class="fas fa-cog"></i> Open Settings
              </button>
            </div>
            `
                : isGhostscriptError
                  ? `
            <div class="result-action">
              <button class="btn secondary open-system-settings-btn">
                <i class="fas fa-tools"></i> Install EPS Plugin
              </button>
            </div>
            `
                  : isUpdateError
                    ? `
            <div class="result-action">
              <button class="btn primary download-update-btn">
                <i class="fas fa-download"></i> Download Update
              </button>
            </div>
            `
                      : ""
            }
          </div>
        </div>
      </div>
    `;

    if (isApiValidationError) {
      const openSettingsBtn =
        elements.resultsList.querySelector(".open-settings-btn");
      if (openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => {
          elements.settingsDialog.classList.add("active");
        });
      }

      showApiValidationErrorDialog(errorMessage);
    }

    if (isGhostscriptError) {
      const openSystemSettingsBtn = elements.resultsList.querySelector(
        ".open-system-settings-btn",
      );
      if (openSystemSettingsBtn) {
        openSystemSettingsBtn.addEventListener("click", () => {
          showSettingsWithTab("system-section");
        });
      }

      // Show a toast notification immediately when Ghostscript error occurs
      showToastNotification(
        "Ghostscript plugin is required to process EPS files. Click 'Install EPS Plugin' to set it up.",
        "warning",
        8000,
      );

      // No longer automatically open the settings dialog
    }

    if (isExpiredError) {
      // Premium plan - no upgrade prompts needed
    }

    // Handle download update button for update-related errors only
    if (isUpdateError) {
      const downloadUpdateBtn =
        elements.resultsList.querySelector(".download-update-btn");
      if (downloadUpdateBtn) {
        downloadUpdateBtn.addEventListener("click", async () => {
          const result = await window.electronAPI.openExternal("https://genmeta.app/download");
          if (!result.success) {
            showToastNotification("Could not open browser. Please check your default browser settings.", "error", 6000);
          }
        });
      }
    }

    elements.noResults.classList.add("hidden");

    if (elements.initialGenerateBtn) {
      elements.initialGenerateBtn.disabled = false;
      elements.initialGenerateBtn.innerHTML =
        '<i class="fas fa-bolt"></i> Generate';
    }

    if (elements.clearStateBtn && selectedPath) {
      elements.clearStateBtn.disabled = false;
      elements.clearStateBtn.classList.remove("hidden");
    }

    if (elements.regenerateBtn) {
      elements.regenerateBtn.disabled = false;
      elements.regenerateBtn.classList.remove("hidden");
    }

    if (elements.stopBtn) {
      elements.stopBtn.disabled = true;
      elements.stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }

    // Update button visibility and state - no results or modifications after error
    updateOutputButtons({
      hasResults: false,
      hasErrors: false,
      hasModifications: false,
      isProcessing: false,
    });

    cleanupListeners();
  });
  listenerCleanupFunctions.push(errorRemover);

  const stoppedRemover = window.electronAPI.processing.onStopped(() => {
    if (elements.stopBtn) {
      elements.stopBtn.disabled = true;
      elements.stopBtn.innerHTML = '<i class="fas fa-hourglass-half"></i>';
    }

    // Re-enable the generate button when processing is stopped
    if (elements.initialGenerateBtn) {
      elements.initialGenerateBtn.disabled = false;
      elements.initialGenerateBtn.innerHTML =
        '<i class="fas fa-bolt"></i> Generate';
    }

    // Show "Home" and "Regenerate" buttons when generation is stopped
    if (elements.clearStateBtn) {
      elements.clearStateBtn.classList.remove("hidden");
    }

    if (elements.regenerateBtn) {
      elements.regenerateBtn.disabled = false;
      elements.regenerateBtn.classList.remove("hidden");
    }
  });
  listenerCleanupFunctions.push(stoppedRemover);

  function cleanupListeners() {
    listenerCleanupFunctions.forEach((removeFunction) => {
      if (typeof removeFunction === "function") {
        removeFunction();
      }
    });
  }

  // Don't re-register onMessage handler since it's already set up elsewhere
}

// Helper function to append an individual result item to the results list
function appendResultItem(result) {
  if (!result) return;

  if (result.status === "cancelled") {
    return;
  }

  // Check if this exact result already exists in the DOM (prevent duplicates)
  const existingItems = document.querySelectorAll(
    `.result-item [data-filename="${result.filename}"]`,
  );

  if (existingItems.length > 0) {
    // Check if any existing item has the same status and error message
    for (const existingItem of existingItems) {
      const existingResultItem = existingItem.closest(".result-item");
      const isExistingError = existingResultItem.classList.contains("error");
      const isNewError = !!result.error;

      if (isExistingError === isNewError) {
        if (isNewError) {
          // Both are errors - check if error message is the same
          const existingErrorMsg =
            existingResultItem.querySelector(".result-message");
          if (
            existingErrorMsg &&
            existingErrorMsg.textContent.includes(result.error)
          ) {
            return;
          }
        } else {
          return;
        }
      }
    }
  }

  elements.noResults.classList.add("hidden");

  // In retry mode, check if this item already exists in the results list
  if (window.isRetryMode) {
    // Check if this file already has a successful result displayed
    const existingItem = document.querySelector(
      `.result-item:not(.error) [data-filename="${result.filename}"]`,
    );
    if (existingItem) {
      return;
    }
  }

  const isError = !!result.error;
  const resultItem = document.createElement("div");
  resultItem.className = `result-item ${isError ? "error" : ""}`;
  resultItem.setAttribute(
    "data-filepath",
    result.path || result.outputPath || "",
  );

  if (isError) {
    // Check if this is a Ghostscript error
    const isGsError = checkGhostscriptError(result.error);

    // If this is the first Ghostscript error we've encountered, show the toast notification
    if (isGsError && !window.hasShownGhostscriptError) {
      window.hasShownGhostscriptError = true;

      // Show a toast notification immediately
      showToastNotification(
        "Ghostscript plugin is required to process EPS files. Click 'Install EPS Plugin' to set it up.",
        "warning",
        8000,
      );

      // No longer automatically open the settings dialog
    }

    resultItem.innerHTML = `
      <div class="result-content">
        <div class="result-image-row">
          <div class="result-preview">
            ${generateErrorPreviewHTML(result)}
          </div>
        </div>

        <div class="metadata-details">
          <div class="filename-container">
            <div class="filename-display" data-filename="${
              result.filename
            }" title="${result.filename}">${result.filename}</div>
            <span class="status error">Failed</span>
          </div>
          <div class="result-message">
            Error: ${result.error}
          </div>
          ${
            isGsError
              ? `
          <div class="result-action">
            <button class="btn secondary open-system-settings-btn">
              <i class="fas fa-tools"></i> Install EPS Plugin
            </button>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Add event listener for Ghostscript configuration button if present
    if (isGsError) {
      setTimeout(() => {
        const configButton = resultItem.querySelector(
          ".open-system-settings-btn",
        );
        if (configButton) {
          configButton.addEventListener("click", () => {
            showSettingsWithTab("system-section");
          });
        }
      }, 0);
    }
  } else {
    let displayName = result.filename;

    let formattedKeywords = "";
    if (result.metadata?.keywords) {
      if (Array.isArray(result.metadata.keywords)) {
        formattedKeywords = result.metadata.keywords.join(", ");
      } else if (typeof result.metadata.keywords === "string") {
        formattedKeywords = result.metadata.keywords.replace(/,\s*/g, ", ");
      }
    }

    const title = result.metadata?.title || "";
    const description = result.metadata?.description || "";

    resultItem.innerHTML = `
      <div class="result-content">
        <div class="result-image-row">
          <div class="result-preview">
            ${generatePreviewHTML(result)}
          </div>
        </div>

        <div class="metadata-details">
          <div class="filename-container">
            <div class="filename-display" data-filename="${
              result.filename
            }" title="${result.filename}">${displayName}</div>
            <span class="status">Success</span>

            <div class="regenerate-buttons">
            <button class="regenerate-btn" data-filename="${
              result.filename
            }" data-filepath="${result.path || result.outputPath || ""}">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="regenerate-plus-btn regenerate-btn" data-filename="${
              result.filename
            }" data-filepath="${result.path || result.outputPath || ""}">
              <i class="fas fa-sync-alt"></i>+
            </button>
          </div>
          </div>

          <div class="metadata-field">
            <label>
              <span class="label-text"><i class="fa-solid fa-t"></i> Title</span>
              <span class="count-display">0 words | 0 chars</span>
              <button class="copy-btn" data-field="title" title="Copy to clipboard">
                <i class="fa-regular fa-copy"></i>
              </button>
              <button class="swap-title-desc-btn" title="Swap Title and Description">
                <i class="fas fa-exchange-alt"></i>
              </button>
            </label>
            <textarea class="metadata-title" data-filename="${
              result.filename
            }" data-filepath="${
              result.path || result.outputPath || ""
            }" data-field="title" data-original="${title}">${title}</textarea>
          </div>

          <div class="metadata-field">
            <label>
              <span class="label-text"><i class="fas fa-align-left"></i> Description</span>
              <span class="count-display">0 words | 0 chars</span>
              <button class="copy-btn" data-field="description" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </label>
            <textarea class="metadata-description" data-filename="${
              result.filename
            }" data-filepath="${
              result.path || result.outputPath || ""
            }" data-field="description" data-original="${description}">${description}</textarea>
          </div>

          <div class="metadata-field">
            <label>
              <span class="label-text"><i class="fas fa-tags"></i> Keywords</span>
              <span class="count-display">0 keywords</span>
              <button class="copy-btn" data-field="keywords" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </label>
            <textarea class="metadata-keywords" data-filename="${
              result.filename
            }" data-field="keywords" data-original="${
              result.metadata?.keywords || ""
            }">${formattedKeywords}</textarea>
          </div>

          ${
            result.metadata?.adobeCategory
              ? `
          <div class="metadata-field hidden">
            <label>
              <span class="label-text"><i class="fas fa-folder"></i> Adobe Category</span>
              <button class="copy-btn" data-field="adobeCategory" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </label>
            <input type="text" class="metadata-adobe-category" data-filename="${
              result.filename
            }" data-field="adobeCategory" data-original="${
              result.metadata?.adobeCategory || ""
            }" value="${result.metadata?.adobeCategory || ""}" readonly />
          </div>
          `
              : ""
          }

          ${
            result.metadata?.shutterstockCategories
              ? `
          <div class="metadata-field hidden">
            <label>
              <span class="label-text"><i class="fas fa-folder"></i> Shutterstock Categories</span>
              <button class="copy-btn" data-field="shutterstockCategories" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </label>
            <input type="text" class="metadata-shutterstock-categories" data-filename="${
              result.filename
            }" data-field="shutterstockCategories" data-original="${
              result.metadata?.shutterstockCategories || ""
            }" value="${result.metadata?.shutterstockCategories || ""}" readonly />
          </div>
          `
              : ""
          }

        </div>
      </div>
    `;

    setTimeout(() => {
      const textareas = resultItem.querySelectorAll("textarea");
      textareas.forEach((textarea) => {
        textarea.setAttribute(
          "data-filepath",
          result.outputPath || result.path,
        );

        textarea.addEventListener("click", (e) => {
          e.stopPropagation();
        });

        textarea.addEventListener("keydown", function (e) {
          if (e.key === "Backspace") {
            this.dataset.lastKey = "Backspace";
          }
        });

        textarea.addEventListener("input", function () {
          const filename = this.getAttribute("data-filename");
          const field = this.getAttribute("data-field");
          const id = `${filename}:${field}`;
          const original = this.getAttribute("data-original");

          this.style.height = "auto";
          this.style.height = this.scrollHeight + "px";

          updateCountDisplay(this);

          if (this.value.trim() !== original?.trim()) {
            modifiedMetadata.add(id);
            textarea.classList.add("metadata-modified");
          } else {
            modifiedMetadata.delete(id);
            textarea.classList.remove("metadata-modified");
          }

          updateSaveAllButton();
        });

        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
        updateCountDisplay(textarea);
      });

      // Add event listeners for copy buttons
      const copyButtons = resultItem.querySelectorAll(".copy-btn");
      copyButtons.forEach((copyBtn) => {
        copyBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          e.preventDefault();

          const field = this.getAttribute("data-field");
          const textarea = resultItem.querySelector(`.metadata-${field}`);

          if (textarea && textarea.value.trim()) {
            // Copy to clipboard
            navigator.clipboard
              .writeText(textarea.value.trim())
              .then(() => {
                // Show success state
                const icon = this.querySelector("i");
                const originalClass = icon.className;

                // Add copied class and change icon
                this.classList.add("copied");
                icon.className = "fas fa-check";

                // Reset after 2 seconds
                setTimeout(() => {
                  this.classList.remove("copied");
                  icon.className = originalClass;
                }, 2000);
              })
              .catch((err) => {
                console.error("Failed to copy text: ", err);
                // Fallback for older browsers
                textarea.select();
                document.execCommand("copy");

                // Show success state
                const icon = this.querySelector("i");
                const originalClass = icon.className;

                this.classList.add("copied");
                icon.className = "fas fa-check";

                setTimeout(() => {
                  this.classList.remove("copied");
                  icon.className = originalClass;
                }, 2000);
              });
          }
        });
      });

      // Add event listener for swap title/description button
      const swapBtn = resultItem.querySelector(".swap-title-desc-btn");
      if (swapBtn) {
        swapBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          e.preventDefault();

          const titleTextarea = resultItem.querySelector(".metadata-title");
          const descTextarea = resultItem.querySelector(".metadata-description");

          if (titleTextarea && descTextarea) {
            // Store current values
            const currentTitle = titleTextarea.value;
            const currentDesc = descTextarea.value;

            // Swap the values
            titleTextarea.value = currentDesc;
            descTextarea.value = currentTitle;

            // Dispatch input events to trigger change handlers and update counts
            const inputEvent = new Event("input", {
              bubbles: true,
              cancelable: true,
            });
            titleTextarea.dispatchEvent(inputEvent);
            descTextarea.dispatchEvent(inputEvent);

            // Visual feedback - animate the swap button
            const icon = this.querySelector("i");
            icon.style.transform = "rotate(180deg)";
            icon.style.transition = "transform 0.3s ease";

            setTimeout(() => {
              icon.style.transform = "rotate(0deg)";
            }, 300);

            // Show toast notification
            showToastNotification("Title and Description swapped", "success", 2000);
          }
        });
      }

      // Add event listeners for regenerate buttons
      const regenerateBtn = resultItem.querySelector(
        ".regenerate-btn:not(.regenerate-plus-btn)",
      );
      const regeneratePlusBtn = resultItem.querySelector(
        ".regenerate-plus-btn",
      );

      if (regenerateBtn) {
        regenerateBtn.addEventListener("click", function () {
          handleRegenerate(this, false);
        });
      }

      if (regeneratePlusBtn) {
        regeneratePlusBtn.addEventListener("click", function () {
          handleRegenerate(this, true);
        });
      }
    }, 0);
  }

  elements.resultsList.appendChild(resultItem);

  // Set up video event listeners if this is a video result
  const videoElement = resultItem.querySelector(".preview-video");
  if (videoElement) {
    setupVideoEventListeners(videoElement);
  }

  const hasErrors = document.querySelectorAll(".result-item.error").length > 0;
  const hasResults = document.querySelectorAll(".result-item").length > 0;

  updateOutputButtons({
    hasResults: hasResults,
    hasErrors: hasErrors,
    hasModifications: modifiedMetadata.size > 0,
    isProcessing: false,
  });
}

// Function to update the Save All button state
function updateSaveAllButton() {
  const hasModifications = modifiedMetadata.size > 0;
  const hasResults = document.querySelectorAll(".result-item").length > 0;
  const hasErrors = document.querySelectorAll(".result-item.error").length > 0;

  updateOutputButtons({
    hasResults: hasResults,
    hasErrors: hasErrors,
    hasModifications: hasModifications,
    isProcessing: false,
  });
}

// Function to manage output-dir-container buttons visibility and state
function updateOutputButtons(options = {}) {
  const {
    hasResults = false,
    hasErrors = false,
    hasModifications = false,
    isProcessing = false,
  } = options;

  // Save All button
  const saveAllBtn = document.getElementById("save-all-btn");
  if (saveAllBtn) {
    saveAllBtn.classList.toggle("hidden", !hasResults || isProcessing);
    saveAllBtn.disabled = !hasModifications;
  }

  // Export CSV button
  const exportCsvBtn = elements.exportCsvBtn;
  if (exportCsvBtn) {
    exportCsvBtn.classList.toggle("hidden", !hasResults || isProcessing);
  }

  // Bulk Edit button
  const commonKeywordBtn = elements.commonKeywordBtn;
  if (commonKeywordBtn) {
    commonKeywordBtn.classList.toggle("hidden", !hasResults || isProcessing);
  }

  // Rename Files button
  const renameFilesBtn = elements.renameFilesBtn;
  if (renameFilesBtn) {
    renameFilesBtn.classList.toggle("hidden", !hasResults || isProcessing);
  }

  // Retry Failed button
  const retryFailedBtn = elements.retryFailedBtn;
  if (retryFailedBtn) {
    retryFailedBtn.classList.toggle("hidden", !hasErrors || isProcessing);
    retryFailedBtn.disabled = isProcessing;
  }
}

// Function to save all modified metadata
async function saveAllMetadata() {
  const saveAllBtn = document.getElementById("save-all-btn");
  if (!saveAllBtn || modifiedMetadata.size === 0) return;

  try {
    saveAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveAllBtn.disabled = true;

    saveAllBtn.classList.remove("error", "warning", "success");

    const filePathMap = new Map();

    const modifiedFilenames = new Set();
    modifiedMetadata.forEach((id) => {
      const [filename] = id.split(":");
      modifiedFilenames.add(filename);
    });

    modifiedFilenames.forEach((filename) => {
      const textareas = document.querySelectorAll(
        `textarea[data-filename="${filename}"]`,
      );
      if (textareas.length > 0) {
        const filePath = textareas[0].getAttribute("data-filepath");

        if (!filePathMap.has(filePath)) {
          filePathMap.set(filePath, {
            filename,
            filePath,
            metadata: {
              title: "",
              description: "",
              keywords: "",
            },
            modified: true,
          });
        }

        textareas.forEach((element) => {
          const field = element.getAttribute("data-field");
          const fileData = filePathMap.get(filePath);
          fileData.metadata[field] = element.value.trim();
        });
      }
    });

    const saveRequests = Array.from(filePathMap.values());

    let errorCount = 0;

    for (const request of saveRequests) {
      try {
        const result = await window.electronAPI.processing.saveMetadata({
          filePath: request.filePath,
          metadata: request.metadata,
        });

        if (result.success) {
          document
            .querySelectorAll(`textarea[data-filename="${request.filename}"]`)
            .forEach((field) => {
              const fieldName = field.getAttribute("data-field");
              field.setAttribute("data-original", request.metadata[fieldName]);
              field.classList.remove("metadata-modified");

              const id = `${request.filename}:${fieldName}`;
              modifiedMetadata.delete(id);
            });
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      saveAllBtn.innerHTML = `<i class="fas fa-times"></i> ${errorCount} errors`;
      saveAllBtn.classList.add("error");

      saveAllBtn.disabled = false;

      setTimeout(() => {
        saveAllBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
        saveAllBtn.classList.remove("error");
        updateSaveAllButton();
      }, 3000);
    } else {
      saveAllBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
      saveAllBtn.classList.add("success");

      setTimeout(() => {
        saveAllBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
        saveAllBtn.classList.remove("success");
        updateSaveAllButton();
      }, 2000);
    }
  } catch {
    saveAllBtn.innerHTML = '<i class="fas fa-times"></i> Error';
    saveAllBtn.classList.add("error");
    saveAllBtn.disabled = false;
  }
}

// Function to handle regeneration of metadata for a single item
// Function to show custom prompt modal dialog
function showCustomPromptDialog(filename) {
  return new Promise((resolve, reject) => {
    // Create modal container
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.style.cssText =
      "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content custom-prompt-modal";
    modalContent.style.cssText =
      "background: var(--card-bg); border-radius: 8px; width: 90%; max-width: 600px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); animation: modalFadeIn 0.3s ease-out;";

    // Create modal header
    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.style.cssText =
      "padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;";

    const headerTitle = document.createElement("h3");
    headerTitle.innerHTML =
      '<i class="fas fa-magic"></i> Custom Regeneration Prompt';
    headerTitle.style.cssText =
      "margin: 0; color: var(--text-light); font-size: 18px; display: flex; align-items: center; gap: 8px;";
    modalHeader.appendChild(headerTitle);

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.className = "modal-close-btn";
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.style.cssText =
      "background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; font-size: 16px; transition: color 0.2s;";
    closeButton.addEventListener(
      "mouseover",
      () => (closeButton.style.color = "var(--text-light)"),
    );
    closeButton.addEventListener(
      "mouseout",
      () => (closeButton.style.color = "var(--text-secondary)"),
    );
    closeButton.addEventListener("click", () => {
      modalOverlay.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
        reject(new Error("Dialog closed"));
      }, 200);
    });

    modalHeader.appendChild(closeButton);
    modalContent.appendChild(modalHeader);

    // Create modal body
    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.cssText = "padding: 16px;";

    // Add instructions
    const instructions = document.createElement("p");
    instructions.textContent = `Provide custom instructions for regenerating metadata for "${filename}". This will guide the AI in generating more specific content.`;
    instructions.style.cssText =
      "margin: 0 0 16px 0; color: var(--text-secondary); font-size: 14px;";
    modalBody.appendChild(instructions);

    // Add textarea for custom prompt
    const promptTextarea = document.createElement("textarea");
    promptTextarea.className = "custom-prompt-textarea";
    promptTextarea.placeholder =
      "Example: Focus on technical aspects of the image. Include keywords related to technology and innovation.";
    promptTextarea.rows = 6;
    promptTextarea.style.cssText =
      "width: 100%; padding: 12px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-color); font-size: 14px; resize: vertical; margin-bottom: 8px;";
    modalBody.appendChild(promptTextarea);

    // Add character count
    const charCount = document.createElement("div");
    charCount.className = "char-count";
    charCount.textContent = "0 characters";
    charCount.style.cssText =
      "color: var(--text-secondary); font-size: 12px; text-align: right;";
    modalBody.appendChild(charCount);

    // Update character count as user types
    promptTextarea.addEventListener("input", () => {
      const count = promptTextarea.value.length;
      charCount.textContent = `${count} character${count !== 1 ? "s" : ""}`;
    });

    modalContent.appendChild(modalBody);

    // Create modal footer with buttons
    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalFooter.style.cssText =
      "padding: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 8px;";

    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary";
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText =
      "padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);";
    cancelButton.addEventListener("click", () => {
      modalOverlay.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
        reject(new Error("Dialog cancelled"));
      }, 200);
    });

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary";
    submitButton.textContent = "Regenerate";
    submitButton.style.cssText =
      "padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; background: var(--primary-color); color: var(--text-light); border: none;";
    submitButton.addEventListener("click", () => {
      const customPrompt = promptTextarea.value.trim();
      modalOverlay.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
        resolve(customPrompt);
      }, 200);
    });

    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(submitButton);
    modalContent.appendChild(modalFooter);

    // Add modal to body with fade-in animation
    modalOverlay.style.opacity = "0";
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Trigger fade-in
    requestAnimationFrame(() => {
      modalOverlay.style.opacity = "1";
      modalOverlay.style.transition = "opacity 0.2s ease-out";
    });

    // Focus the textarea
    promptTextarea.focus();

    // Add keydown event listener for Escape key
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        modalOverlay.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(modalOverlay);
          reject(new Error("Dialog closed"));
        }, 200);
      }
    };
    document.addEventListener("keydown", handleKeydown);

    // Clean up event listener when modal is closed
    modalOverlay.addEventListener("transitionend", () => {
      if (modalOverlay.style.opacity === "0") {
        document.removeEventListener("keydown", handleKeydown);
      }
    });
  });
}

async function handleRegenerate(button, isPlus) {
  const filename = button.getAttribute("data-filename");
  const filepath = button.getAttribute("data-filepath");

  if (!filename || !filepath) {
    showToastNotification("Missing file information for regeneration", "error");
    return;
  }

  // Find the result item container
  const resultItem = button.closest(".result-item");
  if (!resultItem) return;

  // For Regenerate+, show custom prompt dialog
  let customPrompt = null;
  if (isPlus) {
    try {
      customPrompt = await showCustomPromptDialog(filename);
    } catch {
      return; // User cancelled the dialog
    }
  }

  // Get all textareas in this result item
  const titleTextarea = resultItem.querySelector(".metadata-title");
  const descriptionTextarea = resultItem.querySelector(".metadata-description");
  const keywordsTextarea = resultItem.querySelector(".metadata-keywords");

  // Disable buttons during regeneration
  const allButtons = resultItem.querySelectorAll("button");
  allButtons.forEach((btn) => (btn.disabled = true));

  // Create overlays with skeleton animation instead of clearing content
  const createOverlay = (textarea) => {
    if (!textarea) return null;

    // Store original content to restore if needed
    textarea.dataset.originalContent = textarea.value;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "skeleton-loading textarea-overlay";
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
      border-radius: 4px;
    `;

    // Position the overlay
    const textareaContainer = textarea.parentElement;
    textareaContainer.style.position = "relative";

    // Add overlay to DOM
    textareaContainer.appendChild(overlay);
    textarea.disabled = true;

    return overlay;
  };

  // Create overlays for each textarea
  const titleOverlay = createOverlay(titleTextarea);
  const descriptionOverlay = createOverlay(descriptionTextarea);
  const keywordsOverlay = createOverlay(keywordsTextarea);

  // Store overlays for later removal
  const overlays = [titleOverlay, descriptionOverlay, keywordsOverlay].filter(
    Boolean,
  );

  // Update button text to show loading
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    // Create the regeneration config
    const config = {
      filePath: filepath,
      filename: filename,
      customPrompt: customPrompt,
      microstockSelection: getSelectedPlatform(),
    };

    // Send the regeneration request through IPC
    const result =
      await window.electronAPI.processing.regenerateMetadata(config);

    if (result && result.success && result.metadata) {
      // Update the textareas with new metadata
      if (titleTextarea && result.metadata.title) {
        titleTextarea.value = result.metadata.title;
        titleTextarea.setAttribute("data-original", result.metadata.title);
      }

      if (descriptionTextarea && result.metadata.description) {
        descriptionTextarea.value = result.metadata.description;
        descriptionTextarea.setAttribute(
          "data-original",
          result.metadata.description,
        );
      }

      if (keywordsTextarea && result.metadata.keywords) {
        let formattedKeywords = "";
        if (Array.isArray(result.metadata.keywords)) {
          formattedKeywords = result.metadata.keywords.join(", ");
        } else if (typeof result.metadata.keywords === "string") {
          formattedKeywords = result.metadata.keywords.replace(/,\s*/g, ", ");
        }
        keywordsTextarea.value = formattedKeywords;
        keywordsTextarea.setAttribute("data-original", formattedKeywords);
      }

      // showToastNotification(`Successfully regenerated metadata for ${filename}`, 'success');
    } else {
      throw new Error(result?.error || "Failed to regenerate metadata");
    }
  } catch (error) {
    console.error("Regeneration error:", error);
    showToastNotification(
      `Error regenerating metadata: ${error.message}`,
      "error",
    );
  } finally {
    // Remove overlays and re-enable textareas
    overlays.forEach((overlay) => {
      if (overlay && overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    });

    // Re-enable and resize textareas
    if (titleTextarea) {
      titleTextarea.disabled = false;
      titleTextarea.style.height = "auto";
      titleTextarea.style.height = titleTextarea.scrollHeight + "px";
      updateCountDisplay(titleTextarea);
    }

    if (descriptionTextarea) {
      descriptionTextarea.disabled = false;
      descriptionTextarea.style.height = "auto";
      descriptionTextarea.style.height =
        descriptionTextarea.scrollHeight + "px";
      updateCountDisplay(descriptionTextarea);
    }

    if (keywordsTextarea) {
      keywordsTextarea.disabled = false;
      keywordsTextarea.style.height = "auto";
      keywordsTextarea.style.height = keywordsTextarea.scrollHeight + "px";
      updateCountDisplay(keywordsTextarea);
    }

    // Re-enable buttons and restore original text
    allButtons.forEach((btn) => (btn.disabled = false));
    if (button.classList.contains("regenerate-plus-btn")) {
      button.innerHTML = '<i class="fas fa-sync-alt"></i>+';
    } else {
      button.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
  }
}

// Function to update character and word count display
function updateCountDisplay(textarea) {
  const countDisplay = textarea
    .closest(".metadata-field")
    .querySelector(".count-display");

  const field = textarea.getAttribute("data-field");
  let text = textarea.value.trim();

  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";

  if (field === "keywords") {
    if (text) {
      const isBackspaceEvent = textarea.dataset.lastKey === "Backspace";

      if (!isBackspaceEvent) {
        const formattedText = text.replace(/,\s*/g, ", ");

        if (formattedText !== text) {
          const cursorPos = textarea.selectionStart;
          const addedSpaces = formattedText.length - text.length;

          textarea.value = formattedText;

          textarea.setSelectionRange(
            cursorPos + addedSpaces,
            cursorPos + addedSpaces,
          );

          text = formattedText;
        }

        delete textarea.dataset.lastKey;
      }

      const keywordCount = text
        ? text.split(",").filter((k) => k.trim()).length
        : 0;
      countDisplay.textContent = `${keywordCount} keywords`;
    } else {
      countDisplay.textContent = `0 keywords`;
    }
  } else if (field === "title" || field === "description") {
    // Handle title and description fields
    const charCount = text.length;
    const wordCount = text === "" ? 0 : text.split(/\s+/).length;
    countDisplay.textContent = `${wordCount} words | ${charCount} chars`;
  }
}

// Function to export all metadata to CSV
// Combined Export Settings Modal (Marketplace + Extension)
async function showExportSettingsModal(currentExtension) {
  // Load settings first
  const settings = await window.electronAPI.settings.load();
  const csvExportMarkets = settings.csvExportMarkets || {};

  return new Promise((resolve) => {
    // Market definitions
    const markets = [
      { key: "general", name: "General", icon: "general.svg" },
      { key: "adobestock", name: "Adobe Stock", icon: "adobe-stock.svg" },
      { key: "freepik", name: "Freepik", icon: "freepik.svg" },
      { key: "shutterstock", name: "Shutterstock", icon: "shutterstock.svg" },
      { key: "istock", name: "iStock", icon: "istock.svg", hasSettings: true },
      { key: "pond5", name: "Pond5", icon: "pond5.webp", hasSettings: true },
      { key: "123rf", name: "123RF", icon: "123rf.svg", hasSettings: true },
      { key: "dreamstime", name: "Dreamstime", icon: "dreamstime.svg" },
      { key: "vecteezy", name: "Vecteezy", icon: "Vecteezy.png" },
    ];

    // Filter enabled markets
    const enabledMarkets = markets.filter(
      (m) => csvExportMarkets[m.key]?.enabled !== false,
    );

    if (enabledMarkets.length === 0) {
      showToastNotification(
        "No marketplaces enabled. Please enable at least one in settings.",
        "warning",
      );
      resolve(null);
      return;
    }

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.style.cssText =
      "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content export-settings-modal";
    modalContent.style.cssText =
      "background: var(--card-bg); border-radius: 8px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; padding: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);";

    // Build marketplace list HTML (compact version)
    let marketplaceListHTML = "";
    enabledMarkets.forEach((market) => {
      const config = csvExportMarkets[market.key] || {};
      let settingsHTML = "";

      if (market.key === "istock") {
        settingsHTML = `
          <label style="display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-color); cursor: pointer; white-space: nowrap; margin-bottom: 0;">
            <input type="checkbox" data-market="istock" data-field="editorial" ${config.editorial ? "checked" : ""} style="margin: 0; cursor: pointer;">
            <span>Editorial</span>
          </label>
          <label style="font-size: 10px; color: var(--text-secondary); white-space: nowrap;margin-bottom: 0;">Artist:</label>
          <input type="text" data-market="istock" data-field="artistName" value="${config.artistName || ""}" placeholder="Artist name" style="flex: 1; padding: 3px 6px; border: 1px solid var(--border-color); border-radius: 3px; background: var(--input-bg); color: var(--text-color); font-size: 10px; min-width: 100px;">
        `;
      } else if (market.key === "pond5") {
        settingsHTML = `
          <label style="display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-color); cursor: pointer; white-space: nowrap; margin-bottom: 0;">
            <input type="checkbox" data-market="pond5" data-field="editorial" ${config.editorial ? "checked" : ""} style="margin: 0; cursor: pointer;">
            <span>Editorial</span>
          </label>
        `;
      } else if (market.key === "123rf") {
        settingsHTML = `
          <label style="font-size: 10px; color: var(--text-secondary); white-space: nowrap;margin-bottom: 0;">Country:</label>
          <input type="text" data-market="123rf" data-field="country" value="${config.country || "US"}" placeholder="US" maxlength="2" style="width: 50px; padding: 3px 6px; border: 1px solid var(--border-color); border-radius: 3px; background: var(--input-bg); color: var(--text-color); font-size: 10px; text-transform: uppercase; text-align: center;">
        `;
      }

      marketplaceListHTML += `
        <div class="marketplace-item-compact" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--window-bg); border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 4px;">
          <img src="assets/icons/${market.icon}" alt="${market.name}" style="width: 18px; height: 18px; object-fit: contain; flex-shrink: 0;">
          <div style="font-weight: 500; font-size: 11px; color: var(--text-color); min-width: 80px;">${market.name}</div>
          ${settingsHTML ? `<div style="display: flex; align-items: center; gap: 8px; flex: 1;">${settingsHTML}</div>` : '<div style="flex: 1;"></div>'}
          <i class="fas fa-check-circle" style="color: var(--success-color); font-size: 13px; flex-shrink: 0;"></i>
        </div>
      `;
    });

    modalContent.innerHTML = `
      <div class="modal-header" style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
        <h3 style="margin: 0; color: var(--text-color); font-size: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-cog" style="color: var(--primary-color);"></i>
          Export Settings
        </h3>
      </div>
      <div class="modal-body" style="margin-bottom: 12px;">
        <!-- Marketplaces Section (First) -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label style="display: block; color: var(--text-color); font-size: 11px; font-weight: 500; margin: 0;">
              <i class="fas fa-store" style="margin-right: 4px; font-size: 10px;"></i>
              Enabled Marketplaces (${enabledMarkets.length})
            </label>
            <button id="customizeMarketsBtn" class="btn secondary" style="padding: 3px 8px; font-size: 10px; height: auto; display: flex; align-items: center; gap: 4px;">
              <i class="fas fa-cog"></i>
              Customize
            </button>
          </div>
          <div class="marketplace-list-compact" style="max-height: 240px; overflow-y: auto;">
            ${marketplaceListHTML}
          </div>
        </div>

        <!-- Extension Section (Second) -->
        ${
          currentExtension
            ? `
        <div>
          <label style="display: block; margin-bottom: 6px; color: var(--text-color); font-size: 11px; font-weight: 500;">
            <i class="fas fa-file" style="margin-right: 4px; font-size: 10px;"></i>
            File Extension
          </label>
          <select id="extensionPresetSelect" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color); font-size: 12px; margin-bottom: 6px;">
            <option value=".jpg" ${currentExtension === ".jpg" ? "selected" : ""}>JPG (.jpg)</option>
            <option value=".jpeg" ${currentExtension === ".jpeg" ? "selected" : ""}>JPEG (.jpeg)</option>
            <option value=".png" ${currentExtension === ".png" ? "selected" : ""}>PNG (.png)</option>
            <option value=".eps" ${currentExtension === ".eps" ? "selected" : ""}>EPS (.eps)</option>
            <option value=".ai" ${currentExtension === ".ai" ? "selected" : ""}>AI (.ai)</option>
            <option value=".svg" ${currentExtension === ".svg" ? "selected" : ""}>SVG (.svg)</option>
            <option value=".mp4" ${currentExtension === ".mp4" ? "selected" : ""}>MP4 (.mp4)</option>
            <option value=".mov" ${currentExtension === ".mov" ? "selected" : ""}>MOV (.mov)</option>
            <option value="custom">Custom</option>
          </select>
          <input type="text" id="newExtensionInput" value="${currentExtension || ""}" placeholder="e.g., .jpg" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color); font-size: 12px; display: none;">
          <p style="margin: 4px 0 0 0; font-size: 10px; color: var(--text-secondary); font-style: italic;">Select extension for exported files</p>
        </div>
        `
            : ""
        }
      </div>
      <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 10px; border-top: 1px solid var(--border-color);">
        <button id="cancelExportBtn" class="btn secondary" style="padding: 6px 12px; font-size: 12px;">Cancel</button>
        <button id="confirmExportBtn" class="btn primary" style="padding: 6px 12px; font-size: 12px;">
          <i class="fas fa-file-export"></i> Export
        </button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Get references to extension elements
    const extensionPresetSelect = modalContent.querySelector(
      "#extensionPresetSelect",
    );
    const extensionInput = modalContent.querySelector("#newExtensionInput");

    // Handle preset dropdown change
    if (extensionPresetSelect) {
      extensionPresetSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
          extensionInput.style.display = "block";
          extensionInput.focus();
          extensionInput.select();
        } else {
          extensionInput.style.display = "none";
          extensionInput.value = e.target.value;
        }
      });

      // Check if current extension is not in presets, show custom input
      const presetValues = [
        ".jpg",
        ".jpeg",
        ".png",
        ".eps",
        ".ai",
        ".svg",
        ".mp4",
        ".mov",
      ];
      if (
        currentExtension &&
        !presetValues.includes(currentExtension.toLowerCase())
      ) {
        extensionPresetSelect.value = "custom";
        extensionInput.style.display = "block";
      }
    }

    // Focus on extension input or select
    setTimeout(() => {
      if (extensionPresetSelect && extensionPresetSelect.value !== "custom") {
        extensionPresetSelect.focus();
      } else if (extensionInput) {
        extensionInput.focus();
        extensionInput.select();
      }
    }, 100);

    // Handle Customize button click
    modalContent
      .querySelector("#customizeMarketsBtn")
      .addEventListener("click", () => {
        // Close current modal
        document.body.removeChild(modalOverlay);

        // Open settings dialog and switch to CSV Export tab
        const settingsDialog = document.getElementById("settings-dialog");
        if (settingsDialog) {
          settingsDialog.classList.add("active");

          // Switch to CSV Export tab
          setTimeout(() => {
            const csvTab = document.querySelector('[data-tab="csv"]');
            if (csvTab) {
              csvTab.click();
            }
          }, 100);
        }

        // Resolve with null to cancel export
        resolve(null);
      });

    // Collect settings and save
    const collectSettings = async () => {
      const updatedMarkets = { ...csvExportMarkets };

      // Collect all marketplace settings from inputs
      modalContent.querySelectorAll("[data-market]").forEach((input) => {
        const marketKey = input.getAttribute("data-market");
        const field = input.getAttribute("data-field");
        let value;

        if (!updatedMarkets[marketKey]) {
          updatedMarkets[marketKey] = { enabled: true };
        }

        // Handle checkbox inputs
        if (input.type === "checkbox") {
          value = input.checked;
        } else {
          value = input.value;
        }

        updatedMarkets[marketKey][field] = value;
      });

      // Save updated settings
      settings.csvExportMarkets = updatedMarkets;
      await window.electronAPI.settings.save(settings);

      // Get extension value
      let newExt = "";
      if (extensionInput) {
        newExt = extensionInput.value.trim();
        if (newExt && !newExt.startsWith(".")) {
          newExt = "." + newExt;
        }
      }

      return {
        extension: newExt || undefined,
        markets: updatedMarkets,
      };
    };

    // Handle button clicks
    modalContent
      .querySelector("#cancelExportBtn")
      .addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve(null);
      });

    modalContent
      .querySelector("#confirmExportBtn")
      .addEventListener("click", async () => {
        const result = await collectSettings();
        document.body.removeChild(modalOverlay);
        resolve(result);
      });

    // Handle Enter key on extension input
    if (extensionInput) {
      extensionInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          const result = await collectSettings();
          document.body.removeChild(modalOverlay);
          resolve(result);
        } else if (e.key === "Escape") {
          document.body.removeChild(modalOverlay);
          resolve(null);
        }
      });
    }

    // Handle Enter key on extension preset select
    if (extensionPresetSelect) {
      extensionPresetSelect.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          const result = await collectSettings();
          document.body.removeChild(modalOverlay);
          resolve(result);
        } else if (e.key === "Escape") {
          document.body.removeChild(modalOverlay);
          resolve(null);
        }
      });
    }

    // Handle overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
        resolve(null);
      }
    });
  });
}

async function exportAllMetadata() {
  try {
    const originalText = elements.exportCsvBtn.innerHTML;
    elements.exportCsvBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    elements.exportCsvBtn.disabled = true;

    const metadataItems = [];
    const textareaGroups = {};

    // Collect data from textareas
    document.querySelectorAll("textarea[data-filename]").forEach((textarea) => {
      const filename = textarea.getAttribute("data-filename");
      const field = textarea.getAttribute("data-field");
      const filePath = textarea.getAttribute("data-filepath");

      if (!textareaGroups[filename]) {
        textareaGroups[filename] = {
          filename: filename,
          filePath: filePath, // Include the file path in the exported data
        };
      }

      textareaGroups[filename][field] = textarea.value.trim();
    });

    // Collect data from input fields (e.g., categories)
    document
      .querySelectorAll("input[data-filename][data-field]")
      .forEach((input) => {
        const filename = input.getAttribute("data-filename");
        const field = input.getAttribute("data-field");
        const filePath = input.getAttribute("data-filepath");

        if (!textareaGroups[filename]) {
          textareaGroups[filename] = {
            filename: filename,
            filePath: filePath,
          };
        }

        // Always include the field value, even if empty
        textareaGroups[filename][field] = input.value.trim();
      });

    // Only include entries that have at least title or description
    for (const filename in textareaGroups) {
      const item = textareaGroups[filename];
      // Only add items that have meaningful metadata (at least title or description)
      if (item.title || item.description || item.keywords) {
        metadataItems.push(item);
      }
    }

    if (metadataItems.length === 0) {
      showToastNotification("No metadata to export", "warning");
      elements.exportCsvBtn.innerHTML = originalText;
      elements.exportCsvBtn.disabled = false;
      return;
    }

    // Check if all files have the same extension
    const extensions = metadataItems
      .map((item) => {
        const filename = item.filename || "";
        const lastDotIndex = filename.lastIndexOf(".");
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
      })
      .filter((ext) => ext !== "");

    const uniqueExtensions = [...new Set(extensions)];
    const currentExtension =
      uniqueExtensions.length === 1 &&
      extensions.length === metadataItems.length
        ? uniqueExtensions[0]
        : "";

    // Show combined export settings modal (marketplace + extension)
    const exportSettings = await showExportSettingsModal(currentExtension);
    if (exportSettings === null) {
      // User canceled
      elements.exportCsvBtn.innerHTML = originalText;
      elements.exportCsvBtn.disabled = false;
      return;
    }

    const newExtension = exportSettings.extension;

    // Get the selected platform using the getSelectedPlatform function
    const selectedPlatform = getSelectedPlatform();

    const result = await window.electronAPI.files.exportCsv(
      metadataItems,
      outputDirectory,
      newExtension,
      selectedPlatform,
    );

    if (result.success) {
      elements.exportCsvBtn.innerHTML =
        '<i class="fas fa-check"></i> Exported!';
      elements.exportCsvBtn.classList.add("success");
      showToastNotification("Metadata successfully exported to CSV", "success");

      setTimeout(() => {
        elements.exportCsvBtn.innerHTML = originalText;
        elements.exportCsvBtn.disabled = false;
        elements.exportCsvBtn.classList.remove("success");
      }, 2000);
    } else {
      elements.exportCsvBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
      elements.exportCsvBtn.classList.add("error");

      setTimeout(() => {
        elements.exportCsvBtn.innerHTML =
          '<i class="fas fa-file-export"></i> Export CSV';
        elements.exportCsvBtn.disabled = false;
        elements.exportCsvBtn.classList.remove("error");
      }, 2000);
    }
  } catch {
    elements.exportCsvBtn.innerHTML = '<i class="fas fa-times"></i> Error';
    elements.exportCsvBtn.classList.add("error");

    setTimeout(() => {
      elements.exportCsvBtn.innerHTML =
        '<i class="fas fa-file-export"></i> Export CSV';
      elements.exportCsvBtn.disabled = false;
      elements.exportCsvBtn.classList.remove("error");
    }, 2000);
  }
}

// Set up auto-updater listeners
function setupUpdateListeners() {
  window.electronAPI.updates.onUpdateStatus((status) => {
    // Update the main update dialog
    if (status.status === "available") {
      elements.newVersionText.textContent = status.version || "New Version";
      elements.releaseNotes.innerHTML = status.releaseNotes || "";
      elements.updateDialog.classList.add("active");
      elements.downloadUpdateBtn.classList.remove("hidden");
      elements.installUpdateBtn.classList.add("hidden");
      elements.updateProgressContainer.classList.add("hidden");
    } else if (status.status === "downloading") {
      const percent = Math.round(status.percent || 0);
      elements.updateProgressBar.style.width = `${percent}%`;
      elements.updateProgressText.textContent = `Downloading: ${percent}%`;
      elements.updateProgressContainer.classList.remove("hidden");
      elements.downloadUpdateBtn.classList.add("hidden");
    } else if (status.status === "downloaded") {
      elements.updateProgressContainer.classList.add("hidden");
      elements.downloadUpdateBtn.classList.add("hidden");
      elements.installUpdateBtn.classList.remove("hidden");
      elements.updateDialog.classList.add("active");
    } else if (status.status === "not-available" && status.message) {
      if (document.activeElement === elements.checkUpdateBtn) {
        showToastNotification(status.message, "info");
      }
    }

    // Update the popup dialog
    if (
      elements.updateCheckPopup &&
      elements.updateCheckPopup.classList.contains("show")
    ) {
      if (elements.updateCheckLoading) {
        elements.updateCheckLoading.style.display = "none";
      }

      if (elements.updateCheckResult) {
        elements.updateCheckResult.style.display = "block";

        switch (status.status) {
          case "checking":
            elements.updateCheckResult.innerHTML = `
              <div class="update-check-status">
                <div class="spinner"></div>
                <span>Checking for updates...</span>
              </div>
            `;
            break;

          case "available":
            elements.updateCheckResult.innerHTML = `
              <div class="success-message">
                <i class="fas fa-info-circle"></i>
                New version available: ${status.version}
              </div>
              <p>Current version: ${status.currentVersion}</p>
              <p>Release date: ${new Date(
                status.releaseDate,
              ).toLocaleDateString()}</p>
            `;
            if (elements.updateCheckDownloadBtn) {
              elements.updateCheckDownloadBtn.classList.remove("hidden");
            }
            break;

          case "not-available":
            elements.updateCheckResult.innerHTML = `
              <div class="success-message">
                <i class="fas fa-check-circle"></i>
                You're using the latest version (${status.currentVersion})
              </div>
            `;
            break;

          case "downloading":
            elements.updateCheckResult.innerHTML = `
              <div class="update-check-status">
                <div class="spinner"></div>
                <span>Downloading update: ${Math.round(status.percent)}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${
                  status.percent
                }%"></div>
              </div>
            `;
            break;

          case "downloaded":
            elements.updateCheckResult.innerHTML = `
              <div class="success-message">
                <i class="fas fa-check-circle"></i>
                Update downloaded successfully!
              </div>
              <p>Version ${status.version} is ready to install</p>
            `;
            if (elements.updateCheckDownloadBtn) {
              elements.updateCheckDownloadBtn.classList.add("hidden");
            }
            if (elements.updateCheckInstallBtn) {
              elements.updateCheckInstallBtn.classList.remove("hidden");
            }
            break;

          case "error":
            elements.updateCheckResult.innerHTML = `
              <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Error: ${status.error || "Unknown error"}
              </div>
            `;
            break;
        }
      }
    }
  });

  if (elements.closeUpdateDialog) {
    elements.closeUpdateDialog.addEventListener("click", () => {
      elements.updateDialog.classList.remove("active");
    });
  }

  if (elements.laterUpdateBtn) {
    elements.laterUpdateBtn.addEventListener("click", () => {
      elements.updateDialog.classList.remove("active");
    });
  }

  if (elements.downloadUpdateBtn) {
    elements.downloadUpdateBtn.addEventListener("click", async () => {
      try {
        elements.downloadUpdateBtn.disabled = true;
        elements.downloadUpdateBtn.textContent = "Starting Download...";
        elements.updateProgressContainer.classList.remove("hidden");

        await window.electronAPI.updates.downloadUpdate();
      } catch {
        elements.downloadUpdateBtn.disabled = false;
        elements.downloadUpdateBtn.textContent = "Retry Download";
      }
    });
  }

  if (elements.installUpdateBtn) {
    elements.installUpdateBtn.addEventListener("click", async () => {
      try {
        elements.installUpdateBtn.disabled = true;
        elements.installUpdateBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Preparing for install...';

        await window.electronAPI.updates.installUpdate();
      } catch {
        elements.installUpdateBtn.disabled = false;
        elements.installUpdateBtn.innerHTML = "Install Update";
      }
    });
  }
}

// Function to apply a common keyword to all images
function applyCommonKeyword() {
  if (elements.applyKeyword) {
    const applyBtn = elements.applyKeyword;
    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
    applyBtn.disabled = true;
  }

  // Get active tab
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) {
    if (elements.applyKeyword) {
      elements.applyKeyword.innerHTML = "Apply";
      elements.applyKeyword.disabled = false;
    }
    return;
  }

  const tabId = activeTab.id;
  let modifiedCount = 0;
  let message = "";

  // Process based on active tab
  if (tabId === "keywords-tab") {
    // Process keywords
    const keyword = elements.commonKeyword.value.trim();

    if (!keyword) {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("Please enter a keyword to add", "warning");
      return;
    }

    let position = "first";
    elements.keywordPositionRadios.forEach((radio) => {
      if (radio.checked) {
        position = radio.value;
      }
    });

    let customPositionIndex = 1;
    if (position === "custom") {
      customPositionIndex = parseInt(elements.customPosition.value);
      if (isNaN(customPositionIndex) || customPositionIndex < 1) {
        customPositionIndex = 1;
      }
    }

    const keywordTextareas = document.querySelectorAll(
      "textarea.metadata-keywords",
    );

    if (keywordTextareas.length === 0) {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("No image metadata found to update", "warning");
      return;
    }

    const keywordsToAdd = keyword
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    keywordTextareas.forEach((textarea) => {
      let keywords = textarea.value.trim();
      let keywordArray = keywords
        ? keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [];

      let modified = false;

      keywordsToAdd.forEach((keywordToAdd) => {
        // Check if keyword exists in a case-insensitive way
        const keywordLower = keywordToAdd.toLowerCase();
        const existingKeywordIndex = keywordArray.findIndex(
          (k) => k.toLowerCase() === keywordLower,
        );

        if (existingKeywordIndex !== -1) {
          // Remove the existing keyword (regardless of case)
          keywordArray.splice(existingKeywordIndex, 1);
          modified = true;
        }

        // Add the keyword in the specified position
        if (position === "first") {
          keywordArray.unshift(keywordToAdd);
          modified = true;
        } else if (position === "last") {
          keywordArray.push(keywordToAdd);
          modified = true;
        } else if (position === "custom") {
          const insertIndex = Math.min(
            customPositionIndex - 1,
            keywordArray.length,
          );
          keywordArray.splice(insertIndex, 0, keywordToAdd);
          modified = true;
        }
      });

      if (modified) {
        const newKeywords = keywordArray.join(", ");

        if (newKeywords !== textarea.value) {
          textarea.value = newKeywords;

          const inputEvent = new Event("input", {
            bubbles: true,
            cancelable: true,
          });
          textarea.dispatchEvent(inputEvent);

          modifiedCount++;
        }
      }
    });

    message =
      modifiedCount > 0
        ? `Added keyword(s) "${keyword}" to ${modifiedCount} image${
            modifiedCount > 1 ? "s" : ""
          }.`
        : "No images were modified. The keyword might already be present in all images.";

    // Reset form fields
    elements.commonKeyword.value = "";
    elements.keywordPositionRadios[0].checked = true;
    elements.customPositionGroup.style.display = "none";
  } else if (tabId === "title-tab") {
    // Process titles
    const titleText = elements.bulkTitleText.value.trim();

    let action = "insert";
    elements.titleAction.forEach((radio) => {
      if (radio.checked) {
        action = radio.value;
      }
    });

    if (!titleText && action !== "from-description") {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("Please enter text to add to titles", "warning");
      return;
    }

    const titleInputs = document.querySelectorAll("textarea.metadata-title");

    if (titleInputs.length === 0) {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("No title fields found to update", "warning");
      return;
    }

    const searchText =
      action === "replace" ? elements.titleSearchText.value.trim() : "";

    // Get position setting for insert action
    let position = "first";
    if (action === "insert") {
      elements.titlePositionRadios.forEach((radio) => {
        if (radio.checked) {
          position = radio.value;
        }
      });
    }

    // Get custom position index if needed
    let customPositionIndex = 1;
    if (position === "custom") {
      customPositionIndex = parseInt(elements.titlePosition.value);
      if (isNaN(customPositionIndex) || customPositionIndex < 1) {
        customPositionIndex = 1;
      }
    }

    titleInputs.forEach((input) => {
      const currentTitle = input.value.trim();
      let newTitle = currentTitle;
      let modified = false;

      if (action === "insert") {
        if (currentTitle) {
          const words = currentTitle.split(/\s+/);

          // Determine insert position based on the position setting
          let insertPos = 0;
          if (position === "first") {
            insertPos = 0;
          } else if (position === "last") {
            insertPos = words.length;
          } else if (position === "custom") {
            // Ensure position is within valid range (0-based index)
            insertPos = Math.min(
              Math.max(customPositionIndex - 1, 0),
              words.length,
            );
          }

          // Insert the new text at the specified word position
          words.splice(insertPos, 0, titleText);
          newTitle = words.join(" ");
          modified = true;
        } else {
          // If there's no current title, just use the new text
          newTitle = titleText;
          modified = true;
        }
      } else if (action === "replace") {
        if (searchText) {
          // Case insensitive search and replace
          const regex = new RegExp(
            searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "gi",
          );
          if (regex.test(currentTitle)) {
            newTitle = currentTitle.replace(regex, titleText);
            modified = true;
          }
        } else {
          // If search text is empty, do nothing instead of replacing the entire title
          // This prevents unintended replacement of all text
          modified = false;
        }
      } else if (action === "from-description") {
        // Update title from description
        const descriptionTextarea = input
          .closest(".result-item")
          .querySelector("textarea.metadata-description");
        if (descriptionTextarea && descriptionTextarea.value.trim()) {
          newTitle = descriptionTextarea.value.trim();
          modified = true;
        }
      }

      if (modified && newTitle !== currentTitle) {
        input.value = newTitle;

        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(inputEvent);

        modifiedCount++;
      }
    });

    const actionVerb =
      action === "insert"
        ? "inserted into"
        : action === "replace" && searchText
          ? "replaced in"
          : action === "from-description"
            ? "updated from description in"
            : "replaced";

    message =
      modifiedCount > 0
        ? `${
            actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)
          } ${modifiedCount} title${modifiedCount > 1 ? "s" : ""}.`
        : "No titles were modified.";

    // Reset form fields
    elements.bulkTitleText.value = "";
    elements.titleSearchText.value = "";
    elements.titlePosition.value = "1";
    elements.titleAction[0].checked = true;
    elements.titleReplaceText.style.display = "none";
    elements.titlePositionGroup.style.display = "none";
    elements.titlePositionOptions.style.display = "block";
  } else if (tabId === "description-tab") {
    // Process descriptions
    const descText = elements.bulkDescriptionText.value.trim();

    let action = "insert";
    elements.descriptionAction.forEach((radio) => {
      if (radio.checked) {
        action = radio.value;
      }
    });

    if (!descText && action !== "from-title") {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification(
        "Please enter text to add to descriptions",
        "warning",
      );
      return;
    }

    const descTextareas = document.querySelectorAll(
      "textarea.metadata-description",
    );

    if (descTextareas.length === 0) {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("No description fields found to update", "warning");
      return;
    }

    const searchText =
      action === "replace" ? elements.descriptionSearchText.value.trim() : "";

    // Get position setting for insert action
    let position = "first";
    if (action === "insert") {
      elements.descriptionPositionRadios.forEach((radio) => {
        if (radio.checked) {
          position = radio.value;
        }
      });
    }

    // Get custom position index if needed
    let customPositionIndex = 1;
    if (position === "custom") {
      customPositionIndex = parseInt(elements.descriptionPosition.value);
      if (isNaN(customPositionIndex) || customPositionIndex < 1) {
        customPositionIndex = 1;
      }
    }

    descTextareas.forEach((textarea) => {
      const currentDesc = textarea.value.trim();
      let newDesc = currentDesc;
      let modified = false;

      if (action === "insert") {
        if (currentDesc) {
          const words = currentDesc.split(/\s+/);

          // Determine insert position based on the position setting
          let insertPos = 0;
          if (position === "first") {
            insertPos = 0;
          } else if (position === "last") {
            insertPos = words.length;
          } else if (position === "custom") {
            // Ensure position is within valid range (0-based index)
            insertPos = Math.min(
              Math.max(customPositionIndex - 1, 0),
              words.length,
            );
          }

          // Insert the new text at the specified word position
          words.splice(insertPos, 0, descText);
          newDesc = words.join(" ");
          modified = true;
        } else {
          // If there's no current description, just use the new text
          newDesc = descText;
          modified = true;
        }
      } else if (action === "replace") {
        if (searchText) {
          // Case insensitive search and replace
          const regex = new RegExp(
            searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "gi",
          );
          if (regex.test(currentDesc)) {
            newDesc = currentDesc.replace(regex, descText);
            modified = true;
          }
        } else {
          // If search text is empty, do nothing instead of replacing the entire description
          // This prevents unintended replacement of all text
          modified = false;
        }
      } else if (action === "from-title") {
        // Update description from title
        const titleTextarea = textarea
          .closest(".result-item")
          .querySelector("textarea.metadata-title");
        if (titleTextarea && titleTextarea.value.trim()) {
          newDesc = titleTextarea.value.trim();
          modified = true;
        }
      }

      if (modified && newDesc !== currentDesc) {
        textarea.value = newDesc;

        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        textarea.dispatchEvent(inputEvent);

        modifiedCount++;
      }
    });

    const actionVerb =
      action === "insert"
        ? "inserted into"
        : action === "replace" && searchText
          ? "replaced in"
          : action === "from-title"
            ? "updated from title in"
            : "replaced";

    message =
      modifiedCount > 0
        ? `${
            actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)
          } ${modifiedCount} description${modifiedCount > 1 ? "s" : ""}.`
        : "No descriptions were modified.";

    // Reset form fields
    elements.bulkDescriptionText.value = "";
    elements.descriptionSearchText.value = "";
    elements.descriptionPosition.value = "1";
    elements.descriptionAction[0].checked = true;
    elements.descriptionReplaceText.style.display = "none";
    elements.descriptionPositionGroup.style.display = "none";
    elements.descriptionPositionOptions.style.display = "block";
  } else if (tabId === "swap-tab") {
    // Process swap - exchange title and description
    const titleInputs = document.querySelectorAll("textarea.metadata-title");
    const descTextareas = document.querySelectorAll("textarea.metadata-description");

    if (titleInputs.length === 0 || descTextareas.length === 0) {
      if (elements.applyKeyword) {
        elements.applyKeyword.innerHTML = "Apply";
        elements.applyKeyword.disabled = false;
      }
      showToastNotification("No title or description fields found to swap", "warning");
      return;
    }

    // Iterate through all result items and swap title with description
    const resultItems = document.querySelectorAll(".result-item");

    resultItems.forEach((item) => {
      const titleTextarea = item.querySelector("textarea.metadata-title");
      const descTextarea = item.querySelector("textarea.metadata-description");

      if (titleTextarea && descTextarea) {
        const currentTitle = titleTextarea.value.trim();
        const currentDesc = descTextarea.value.trim();

        // Swap the values
        titleTextarea.value = currentDesc;
        descTextarea.value = currentTitle;

        // Dispatch input events to trigger any change handlers
        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        titleTextarea.dispatchEvent(inputEvent);
        descTextarea.dispatchEvent(inputEvent);

        modifiedCount++;
      }
    });

    message =
      modifiedCount > 0
        ? `Swapped title and description for ${modifiedCount} image${modifiedCount > 1 ? "s" : ""}.`
        : "No fields were swapped.";
  }

  elements.commonKeywordDialog.classList.remove("active");

  // Reset form fields directly - consolidated reset logic
  resetBulkEditForm();

  if (elements.applyKeyword) {
    elements.applyKeyword.innerHTML = "Apply";
    elements.applyKeyword.disabled = false;
  }

  showToastNotification(message);
}

// Helper function to reset the bulk edit form - update to handle the hints too
function resetBulkEditForm() {
  // Reset keywords tab
  if (elements.commonKeyword) elements.commonKeyword.value = "";
  if (elements.keywordPositionRadios)
    elements.keywordPositionRadios[0].checked = true;
  if (elements.customPositionGroup)
    elements.customPositionGroup.style.display = "none";

  // Reset title tab
  if (elements.bulkTitleText) {
    elements.bulkTitleText.value = "";
    elements.bulkTitleText.style.display = "block";
  }
  if (elements.titleSearchText) elements.titleSearchText.value = "";
  if (elements.titleAction && elements.titleAction[0])
    elements.titleAction[0].checked = true;
  if (elements.titleReplaceText)
    elements.titleReplaceText.style.display = "none";
  if (elements.titlePositionOptions)
    elements.titlePositionOptions.style.display = "block";
  if (elements.titlePositionGroup)
    elements.titlePositionGroup.style.display = "none";
  if (elements.titlePositionRadios && elements.titlePositionRadios[0])
    elements.titlePositionRadios[0].checked = true;
  if (elements.titlePosition) elements.titlePosition.value = "1";

  // Reset title hint
  const titleHint = document.getElementById("title-hint");
  if (titleHint)
    titleHint.textContent =
      "Text will be inserted at the beginning of each title";

  // Reset description tab
  if (elements.bulkDescriptionText) {
    elements.bulkDescriptionText.value = "";
    elements.bulkDescriptionText.style.display = "block";
  }
  if (elements.descriptionSearchText) elements.descriptionSearchText.value = "";
  if (elements.descriptionAction && elements.descriptionAction[0])
    elements.descriptionAction[0].checked = true;
  if (elements.descriptionReplaceText)
    elements.descriptionReplaceText.style.display = "none";
  if (elements.descriptionPositionOptions)
    elements.descriptionPositionOptions.style.display = "block";
  if (elements.descriptionPositionGroup)
    elements.descriptionPositionGroup.style.display = "none";
  if (
    elements.descriptionPositionRadios &&
    elements.descriptionPositionRadios[0]
  )
    elements.descriptionPositionRadios[0].checked = true;
  if (elements.descriptionPosition) elements.descriptionPosition.value = "1";

  // Reset description hint
  const descriptionHint = document.getElementById("description-hint");
  if (descriptionHint)
    descriptionHint.textContent =
      "Text will be inserted at the beginning of each description";
}

// Function to get the selected platform from modal or initial state
function getSelectedPlatform() {
  const modalMicrostockSelect = document.getElementById(
    "modal-microstock-select",
  );
  const initialMicrostockSelect = document.getElementById(
    "initial-microstock-select",
  );

  // Prefer modal select if available, otherwise use initial state select
  if (modalMicrostockSelect) {
    return modalMicrostockSelect.value;
  } else if (initialMicrostockSelect) {
    return initialMicrostockSelect.value;
  }

  return "general";
}

// Function to show a professional toast notification
function showToastNotification(message, type = "info", duration = 3000) {
  // Remove any existing toast
  const existingToast = document.getElementById("toast-notification");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast container
  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.className = `toast-notification ${type}`;

  // Set icon based on notification type
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case "info":
    default:
      icon = '<i class="fas fa-info-circle"></i>';
      break;
  }

  // Create toast content
  toast.innerHTML = `
    ${icon}
    <div class="toast-content">${message}</div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  // Add to document
  document.body.appendChild(toast);

  // Show the toast (with slight delay for transition effect)
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Add close button functionality
  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeToast(toast);
    });
  }

  // Auto-close after duration
  const timeoutId = setTimeout(() => {
    closeToast(toast);
  }, duration);

  // Store timeout ID on the element
  toast.dataset.timeoutId = timeoutId;

  // Return the toast element (useful if we want to manually close it)
  return toast;
}

// Helper function to close toast with animation
function closeToast(toast) {
  // Clear any existing timeout
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId));
  }

  // Remove show class to trigger transition
  toast.classList.remove("show");

  // Remove element after transition completes
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Update status bar for guest user - full premium access
function updateStatusBarForGuest() {
  if (elements.apiStatus) {
    elements.apiStatus.textContent = "Active";
    elements.apiStatus.className = "status-active";
  }
  if (elements.apiPlan) {
    elements.apiPlan.textContent = "Premium";
    elements.apiPlan.className = "status-premium";
  }
  if (elements.apiCredits) {
    elements.apiCredits.textContent = "Unlimited";
    elements.apiCredits.className = "status-active";
  }
  if (elements.apiExpires) {
    elements.apiExpires.textContent = "N/A";
    elements.apiExpires.className = "status-unknown";
  }
  // Show credit status
  if (document.getElementById("credit-status")) {
    document.getElementById("credit-status").style.display = "flex";
  }
  // Hide expiry section
  if (document.getElementById("expiry-status")) {
    document.getElementById("expiry-status").style.display = "none";
  }
  // Hide upgrade button
  if (document.getElementById("upgrade-btn-container")) {
    document.getElementById("upgrade-btn-container").style.display = "none";
  }
}

// Function to clear API status display when not logged in
function clearApiStatusDisplay() {
  if (elements.apiStatus) {
    elements.apiStatus.textContent = "Login required";
    elements.apiStatus.className = "status-unknown";
  }

  if (elements.apiExpires) {
    elements.apiExpires.textContent = "N/A";
    elements.apiExpires.className = "status-unknown";
  }

  if (elements.apiPlan) {
    elements.apiPlan.textContent = "N/A";
    elements.apiPlan.className = "status-unknown";
  }

  if (elements.apiCredits) {
    elements.apiCredits.textContent = "N/A";
    elements.apiCredits.className = "status-unknown";
  }

  // Hide expiry section
  if (document.getElementById("expiry-status")) {
    document.getElementById("expiry-status").style.display = "none";
  }

  // Show credit-status even when not logged in
  if (document.getElementById("credit-status")) {
    document.getElementById("credit-status").style.display = "flex";
  }

  // Hide upgrade button
  if (document.getElementById("upgrade-btn-container")) {
    document.getElementById("upgrade-btn-container").style.display = "none";
  }

  // Clear profile dropdown
  if (elements.profileName) {
    elements.profileName.textContent = "Not logged in";
  }
  if (elements.profileEmail) {
    elements.profileEmail.textContent = "Please log in";
  }
  if (elements.profilePlan) {
    elements.profilePlan.textContent = "N/A";
    elements.profilePlan.className = "profile-detail-value";
  }
  if (elements.profileExpiry) {
    elements.profileExpiry.textContent = "N/A";
    elements.profileExpiry.className = "profile-detail-value";
  }
  if (elements.profileCredits) {
    elements.profileCredits.textContent = "N/A";
    elements.profileCredits.className = "profile-detail-value";
  }

  // Hide both expiry and credits items in profile
  if (elements.profileExpiryItem) {
    elements.profileExpiryItem.style.display = "none";
  }
  if (elements.profileCreditsItem) {
    elements.profileCreditsItem.style.display = "none";
  }
}

// Profile dropdown functions
function toggleProfileDropdown() {
  if (elements.profileDropdown) {
    elements.profileDropdown.classList.toggle("active");
  }
}

function closeProfileDropdown() {
  if (elements.profileDropdown) {
    elements.profileDropdown.classList.remove("active");
  }
}

function updateProfileDropdown(status) {
  if (!status) return;

  // Update name and email
  if (elements.profileName) {
    elements.profileName.textContent = status.name || "Premium User";
  }

  if (elements.profileEmail) {
    elements.profileEmail.textContent =
      status.email || status.username || "premium@genmeta.app";
  }

  // Always show Premium plan
  if (elements.profilePlan) {
    elements.profilePlan.textContent = "Premium";
    elements.profilePlan.className = "profile-detail-value plan-premium";
  }

  // Premium plan: hide expiry and credits
  if (elements.profileExpiryItem) {
    elements.profileExpiryItem.style.display = "none";
  }
  if (elements.profileCreditsItem) {
    elements.profileCreditsItem.style.display = "none";
  }

  // Reset expiry text
  if (elements.profileExpiry) {
    elements.profileExpiry.textContent = "N/A";
    elements.profileExpiry.className = "profile-detail-value";
  }

  // Always show Unlimited credits
  if (elements.profileCredits) {
    elements.profileCredits.textContent = "Unlimited";
    elements.profileCredits.className = "profile-detail-value status-active";
  }
}

// Update profile dropdown for guest user - full premium access
function updateProfileDropdownForGuest(guestData) {
  if (!guestData) return;

  // Update name and email for guest
  if (elements.profileName) {
    elements.profileName.textContent = guestData.guestName || "Guest User";
  }

  if (elements.profileEmail) {
    elements.profileEmail.textContent = guestData.guestEmail || "guest@genmeta.local";
  }

  // Show Premium plan for guest (full access)
  if (elements.profilePlan) {
    elements.profilePlan.textContent = "Premium";
    elements.profilePlan.className = "profile-detail-value plan-premium";
  }

  // Show Unlimited credits for guest
  if (elements.profileCredits) {
    elements.profileCredits.textContent = "Unlimited";
    elements.profileCredits.className = "profile-detail-value status-active";
  }

  // Hide expiry for guest (like premium)
  if (elements.profileExpiryItem) {
    elements.profileExpiryItem.style.display = "none";
  }
  if (elements.profileCreditsItem) {
    elements.profileCreditsItem.style.display = "none";
  }
}

// Function to update the API status display elements
function updateApiStatusDisplay(status) {
  if (!status) return;

  // Update profile dropdown with the same data
  updateProfileDropdown(status);

  currentPlanName = "Premium";

  // Hide legacy sections
  if (document.getElementById("expiry-status")) {
    document.getElementById("expiry-status").style.display = "none";
  }

  // Show credit-status for Premium users
  if (document.getElementById("credit-status")) {
    document.getElementById("credit-status").style.display = "flex";
  }

  if (elements.apiStatus) {
    if (status.status === "error") {
      elements.apiStatus.textContent = "Error";
      elements.apiStatus.className = "status-error";
    } else {
      let statusText = "";
      let statusClass = "";

      switch (status.status) {
        case "active":
          statusText = "Active";
          statusClass = "status-active";
          break;
        case "suspended":
          statusText = "Suspended";
          statusClass = "status-warning";
          break;
        case "expired":
          statusText = "Active";
          statusClass = "status-active";
          break;
        default:
          statusText = status.status || "Active";
          statusClass = "status-active";
      }

      elements.apiStatus.textContent = statusText;
      elements.apiStatus.className = statusClass;
    }
  }

  if (elements.apiPlan) {
    if (status.status === "error") {
      elements.apiPlan.textContent = "Premium";
      elements.apiPlan.className = "status-premium";
    } else {
      elements.apiPlan.textContent = "Premium";
      elements.apiPlan.className = "status-premium";
    }
  }

  // Credits display - always show Unlimited
  if (elements.apiCredits) {
    elements.apiCredits.textContent = "Unlimited";
    elements.apiCredits.className = "status-active";
  }

  // Expiry display - always hidden for Premium
  if (elements.apiExpires) {
    elements.apiExpires.textContent = "N/A";
    elements.apiExpires.className = "status-unknown";
  }

  // Always hide upgrade button for Premium users
  if (document.getElementById("upgrade-btn-container")) {
    document.getElementById("upgrade-btn-container").style.display = "none";
  }

  // Ensure Gemini API key group is always visible
  if (elements.aiApiKeyGroup && elements.geminiApiKeyGroup) {
    elements.geminiApiKeyGroup.style.display = "block";
    elements.aiApiKeyGroup.style.display = "none";
  }

  // Ensure Gemini model dropdown is always enabled
  const geminiModelDropdown = document.getElementById(
    "initial-gemini-model-dropdown",
  );
  if (geminiModelDropdown) {
    geminiModelDropdown.classList.remove("disabled");
  }
}

// Function to check API status
let lastApiStatusCheckTime = 0;
let isApiStatusCheckInProgress = false;
const API_STATUS_CHECK_INTERVAL = 10000; // 10 seconds
const FORCE_CHECK_MIN_INTERVAL = 2000; // 2 seconds minimum between forced checks

async function checkApiStatus(forceCheck = false) {
  try {
    const now = Date.now();

    // If a check is already in progress, wait for it to complete
    if (isApiStatusCheckInProgress) {
      return;
    }

    // Implement debounce for both normal and forced checks
    const minInterval = forceCheck
      ? FORCE_CHECK_MIN_INTERVAL
      : API_STATUS_CHECK_INTERVAL;
    if (now - lastApiStatusCheckTime < minInterval) {
      return;
    }

    lastApiStatusCheckTime = now;
    isApiStatusCheckInProgress = true;

    // Set loading state
    if (elements.apiStatus) {
      elements.apiStatus.textContent = "checking...";
      elements.apiStatus.className = "status-unknown";
    }
    if (elements.apiPlan) {
      elements.apiPlan.textContent = "checking...";
      elements.apiPlan.className = "status-unknown";
    }
    if (elements.apiCredits) {
      elements.apiCredits.textContent = "checking...";
      elements.apiCredits.className = "status-unknown";
    }
    if (elements.apiExpires) {
      elements.apiExpires.textContent = "checking...";
      elements.apiExpires.className = "status-unknown";
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API status check timeout")), 15000); // 15 second timeout
    });

    await Promise.race([
      window.electronAPI.app.checkApiStatus(),
      timeoutPromise,
    ]);

    // Reset the progress flag on success
    isApiStatusCheckInProgress = false;
  } catch (error) {
    console.error("Error checking API status:", error);

    // Reset the progress flag on error
    isApiStatusCheckInProgress = false;

    // Show specific error messages instead of clearing display
    if (elements.apiStatus) {
      if (error.message.includes("timeout")) {
        elements.apiStatus.textContent = "Connection timeout";
      } else if (
        error.message.includes("network") ||
        error.message.includes("request failed")
      ) {
        elements.apiStatus.textContent = "Network error";
      } else {
        elements.apiStatus.textContent = "Error";
      }
      elements.apiStatus.className = "status-error";
    }

    if (elements.apiPlan) {
      elements.apiPlan.textContent = "Error";
      elements.apiPlan.className = "status-error";
    }

    if (elements.apiCredits) {
      elements.apiCredits.textContent = "Error";
      elements.apiCredits.className = "status-error";
    }

    // Show retry button when there's an error
    const retryBtn = document.getElementById("retry-status-btn");
    if (retryBtn) {
      retryBtn.style.display = "inline-block";
    }

    // Auto-retry after 5 seconds if this wasn't already a retry
    if (!forceCheck) {
      setTimeout(async () => {
        try {
          await checkApiStatus(true);
        } catch (retryError) {
          console.error("Auto-retry failed:", retryError);
        }
      }, 5000);
    }
  }
}

// Function to reset application state between generations
function resetAppState() {
  // Check if we're in retry mode
  const isRetryMode = window.isRetryMode === true;

  // Only reset counts if not in retry mode
  if (!isRetryMode) {
    if (elements.totalCount) elements.totalCount.textContent = "0";
    if (elements.successCount) elements.successCount.textContent = "0";
    if (elements.failedCount) elements.failedCount.textContent = "0";

    if (elements.resultsList) elements.resultsList.innerHTML = "";
  } else {
    // In retry mode, only remove failed items
    if (elements.resultsList) {
      const failedItems = elements.resultsList.querySelectorAll(
        ".result-item.error:not(.cancelled)",
      );
      failedItems.forEach((item) => item.remove());
    }

    // Reset only the failed count in retry mode
    if (elements.failedCount) elements.failedCount.textContent = "0";
  }

  if (elements.progressBar) elements.progressBar.style.width = "0%";
  if (elements.progressStatus)
    elements.progressStatus.textContent = "Processing images...";
  if (elements.progressCount) elements.progressCount.textContent = "0/0";

  if (elements.progressContainer)
    elements.progressContainer.classList.add("hidden");

  if (elements.initialState) elements.initialState.classList.remove("hidden");

  if (elements.resultsSummary) elements.resultsSummary.classList.add("hidden");

  if (elements.noResults) elements.noResults.classList.add("hidden");

  // Hide the "Home" button when resetting
  if (elements.clearStateBtn) {
    elements.clearStateBtn.classList.add("hidden");
  }
  if (elements.regenerateBtn) {
    elements.regenerateBtn.classList.add("hidden");
  }

  // In retry mode, don't reset the output directory
  if (!isRetryMode) {
    outputDirectory = null;
  }

  if (elements.outputDir) {
    if (!isRetryMode) {
      elements.outputDir.textContent = "-";
      elements.outputDir.classList.remove("clickable");
      elements.outputDir.title = "";

      elements.outputDir.replaceWith(elements.outputDir.cloneNode(true));
      elements.outputDir = document.getElementById("output-dir");
    }
  }

  // Don't clear modified metadata in retry mode
  if (!isRetryMode) {
    modifiedMetadata.clear();
  }

  // Update all output buttons state
  updateOutputButtons({
    hasResults: false,
    hasErrors: false,
    hasModifications: false,
    isProcessing: false,
  });

  window.electronAPI.cleanup.removeListeners();
}

// Initialize the app on load
document.addEventListener("DOMContentLoaded", initApp);

// Handle external links - make all <a> tags open externally
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("a");
    if (target && target.href) {
      // Check if it's an external link (http/https)
      if (
        target.href.startsWith("http://") ||
        target.href.startsWith("https://")
      ) {
        event.preventDefault();
        const result = await window.electronAPI.openExternal(target.href);
        if (!result.success) {
          showToastNotification("Could not open external link. Please check your default browser settings.", "error", 6000);
        }
      }
    }
  });
});

// Handle Ctrl+R keyboard shortcut
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "r") {
    event.preventDefault();
    // Store a flag to indicate this is a manual reload
    sessionStorage.setItem("manualReload", "true");
    // Reload the application
    window.location.reload();
  }
});

// Function to open and close rename files dialog
function openRenameDialog() {
  if (elements.renameFilesDialog) {
    elements.renameFilesDialog.classList.add("active");
  }
}

function closeRenameDialog() {
  if (elements.renameFilesDialog) {
    elements.renameFilesDialog.classList.remove("active");
  }
}

// Handle rename files operation
async function renameFiles() {
  if (elements.applyRename) {
    const applyBtn = elements.applyRename;
    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Renaming...';
    applyBtn.disabled = true;
  }

  try {
    // Get rename type from radio buttons
    let renameType = "title"; // Default value
    elements.renameTypeRadios.forEach((radio) => {
      if (radio.checked) {
        renameType = radio.value;
      }
    });

    // Get prefix option
    const prefixIndex = elements.renameAddPrefix.checked;

    // Collect file information
    const files = [];
    const textareaGroups = {};

    // First get all metadata from textareas
    document.querySelectorAll("textarea[data-filename]").forEach((textarea) => {
      const filename = textarea.getAttribute("data-filename");
      const field = textarea.getAttribute("data-field");
      const filePath = textarea.getAttribute("data-filepath");

      if (!textareaGroups[filename]) {
        textareaGroups[filename] = {
          filename: filename,
          filePath: filePath,
        };
      }

      textareaGroups[filename][field] = textarea.value.trim();
    });

    // Convert to array of files for renaming
    for (const filename in textareaGroups) {
      files.push(textareaGroups[filename]);
    }

    if (files.length === 0) {
      showToastNotification("No files available to rename", "warning");
      if (elements.applyRename) {
        elements.applyRename.innerHTML = "Rename Files";
        elements.applyRename.disabled = false;
      }
      return;
    }

    // Call the rename-files handler
    const result = await window.electronAPI.processing.renameFiles({
      files,
      renameType,
      prefixIndex,
    });

    if (result.success) {
      // Update UI with new filenames
      updateUIAfterRename(result.renamedFiles);

      // Show detailed message
      let message = `Renamed ${result.renamedFiles.length} file${result.renamedFiles.length !== 1 ? "s" : ""} successfully`;

      if (result.errors && result.errors.length > 0) {
        message += `\n\nSkipped ${result.errors.length} file${result.errors.length !== 1 ? "s" : ""}:`;
        result.errors.forEach((error, index) => {
          if (index < 5) {
            // Show first 5 errors
            message += `\nâ€¢ ${error.originalName || "Unknown"}: ${error.message}`;
          }
        });
        if (result.errors.length > 5) {
          message += `\nâ€¢ ... and ${result.errors.length - 5} more`;
        }
      }

      showToastNotification(
        message,
        result.errors && result.errors.length > 0 ? "warning" : "success",
      );
      closeRenameDialog();
    } else {
      let errorMessage = result.message || "Error renaming files";

      if (result.errors && result.errors.length > 0) {
        errorMessage += "\n\nErrors:";
        result.errors.forEach((error, index) => {
          if (index < 5) {
            // Show first 5 errors
            errorMessage += `\nâ€¢ ${error.originalName || "Unknown"}: ${error.message}`;
          }
        });
        if (result.errors.length > 5) {
          errorMessage += `\nâ€¢ ... and ${result.errors.length - 5} more`;
        }
      }

      showToastNotification(errorMessage, "error");
    }
  } catch (error) {
    console.error("Error in rename files:", error);
    showToastNotification(
      `Error: ${error.message || "Failed to rename files"}`,
      "error",
    );
  } finally {
    if (elements.applyRename) {
      elements.applyRename.innerHTML = "Rename Files";
      elements.applyRename.disabled = false;
    }
  }
}

// Helper function to update the UI after renaming files
function updateUIAfterRename(renamedFiles) {
  if (!renamedFiles || renamedFiles.length === 0) return;

  // Update each result item in the UI
  renamedFiles.forEach((fileInfo) => {
    if (!fileInfo.renamed) return; // Skip files that weren't actually renamed

    // Find all elements related to this file and update them
    const resultItem = document.querySelector(
      `.result-item[data-filepath="${fileInfo.originalPath}"]`,
    );

    if (resultItem) {
      // Update the result-item data attribute
      resultItem.setAttribute("data-filepath", fileInfo.newPath);

      // Find and update the displayed filename
      const filenameDisplay = resultItem.querySelector(".filename-display");
      if (filenameDisplay) {
        filenameDisplay.textContent = fileInfo.newName;
        filenameDisplay.setAttribute("title", fileInfo.newName);
        filenameDisplay.setAttribute("data-filename", fileInfo.newName);
      }

      // Update all textareas within this result item
      const textareas = resultItem.querySelectorAll("textarea");
      textareas.forEach((textarea) => {
        // Update the filepath attribute
        textarea.setAttribute("data-filepath", fileInfo.newPath);
        // Update the filename attribute
        textarea.setAttribute("data-filename", fileInfo.newName);
      });

      // Update any other elements with filepath or filename attributes
      const elementsWithFilepath =
        resultItem.querySelectorAll("[data-filepath]");
      elementsWithFilepath.forEach((el) => {
        el.setAttribute("data-filepath", fileInfo.newPath);
      });

      const elementsWithFilename =
        resultItem.querySelectorAll("[data-filename]");
      elementsWithFilename.forEach((el) => {
        el.setAttribute("data-filename", fileInfo.newName);
      });

      // If there's a save button in the result item, update its data attributes too
      const saveButton = resultItem.querySelector(".save-btn");
      if (saveButton) {
        saveButton.setAttribute("data-filepath", fileInfo.newPath);
        saveButton.setAttribute("data-filename", fileInfo.newName);
      }

      // Update all input fields (like categories) within this result item
      const inputs = resultItem.querySelectorAll("input[data-filename]");
      inputs.forEach((input) => {
        input.setAttribute("data-filepath", fileInfo.newPath);
        input.setAttribute("data-filename", fileInfo.newName);
      });
    } else {
      // If we couldn't find the result item by filepath, try finding all elements by filename
      // Extract the filename from the path without using path.basename
      const pathSeparator = fileInfo.originalPath.includes("\\") ? "\\" : "/";
      const pathParts = fileInfo.originalPath.split(pathSeparator);
      const oldFilename = pathParts[pathParts.length - 1];

      // Update all textareas with this filename
      document
        .querySelectorAll(`textarea[data-filename="${oldFilename}"]`)
        .forEach((textarea) => {
          textarea.setAttribute("data-filepath", fileInfo.newPath);
          textarea.setAttribute("data-filename", fileInfo.newName);

          // Find and update the parent result item if possible
          const parentItem = textarea.closest(".result-item");
          if (parentItem) {
            parentItem.setAttribute("data-filepath", fileInfo.newPath);

            // Update filename display in this parent
            const filenameDisplay =
              parentItem.querySelector(".filename-display");
            if (filenameDisplay) {
              filenameDisplay.textContent = fileInfo.newName;
              filenameDisplay.setAttribute("title", fileInfo.newName);
              filenameDisplay.setAttribute("data-filename", fileInfo.newName);
            }
          }
        });

      // Update all input fields (like categories) with this filename
      document
        .querySelectorAll(`input[data-filename="${oldFilename}"]`)
        .forEach((input) => {
          input.setAttribute("data-filepath", fileInfo.newPath);
          input.setAttribute("data-filename", fileInfo.newName);

          // Find and update the parent result item if possible
          const parentItem = input.closest(".result-item");
          if (parentItem) {
            parentItem.setAttribute("data-filepath", fileInfo.newPath);
          }
        });
    }

    // Update the internal modifiedMetadata Map if it's being used
    if (modifiedMetadata.has(fileInfo.originalPath)) {
      const data = modifiedMetadata.get(fileInfo.originalPath);
      modifiedMetadata.delete(fileInfo.originalPath);
      modifiedMetadata.set(fileInfo.newPath, data);
    }
  });

  // After updating all UI elements, update the save button status
  updateSaveAllButton();
}

// Remove the duplicate code at the end of the file
document.addEventListener("DOMContentLoaded", function () {
  // Settings menu navigation
  const settingsMenuItems = document.querySelectorAll(".settings-menu-item");

  settingsMenuItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all menu items and sections
      document.querySelectorAll(".settings-menu-item").forEach((menuItem) => {
        menuItem.classList.remove("active");
      });

      document.querySelectorAll(".settings-section").forEach((section) => {
        section.classList.remove("active");
      });

      // Add active class to clicked menu item
      this.classList.add("active");

      // Show corresponding section
      const sectionId = this.getAttribute("data-section");
      document.getElementById(sectionId).classList.add("active");

      // Auto-detect Ghostscript when system configuration tab is opened
      if (
        sectionId === "system-section" &&
        typeof window.checkGhostscriptInstallation === "function"
      ) {
        setTimeout(() => {
          window.checkGhostscriptInstallation();
        }, 100);
      }
    });
  });

  // Advanced Settings Event Handlers
  const enableCustomPromptToggle = document.getElementById(
    "settings-enable-custom-prompt",
  );
  const customPromptContainer = document.getElementById(
    "custom-prompt-container",
  );

  // Toggle custom prompt container visibility
  if (enableCustomPromptToggle && customPromptContainer) {
    enableCustomPromptToggle.addEventListener("change", function () {
      if (this.checked) {
        customPromptContainer.style.display = "block";
        customPromptContainer.classList.add("show");
      } else {
        customPromptContainer.style.display = "none";
        customPromptContainer.classList.remove("show");
      }
    });
  }
});

// Function to show the settings dialog with a specific tab active
function showSettingsWithTab(tabId) {
  if (elements.settingsDialog) {
    // Show dialog immediately for better UX
    elements.settingsDialog.classList.add("active");

    // Handle redirects for consolidated sections
    if (tabId === "api-section" || tabId === "file-section") {
      // Redirect to system-section instead
      tabId = "system-section";
    }

    // Find all menu items and remove active class
    const menuItems = document.querySelectorAll(".settings-menu-item");
    menuItems.forEach((item) => {
      item.classList.remove("active");

      // If this menu item corresponds to the requested tab, activate it
      if (item.getAttribute("data-section") === tabId) {
        item.classList.add("active");
      }
    });

    // Hide all sections and show the requested one
    document.querySelectorAll(".settings-section").forEach((section) => {
      section.classList.remove("active");
    });

    const targetSection = document.getElementById(tabId);
    if (targetSection) {
      targetSection.classList.add("active");

      // Auto-detect Ghostscript when system configuration tab is opened
      if (
        tabId === "system-section" &&
        typeof window.checkGhostscriptInstallation === "function"
      ) {
        setTimeout(() => {
          window.checkGhostscriptInstallation();
        }, 100);
      }
    }

    // Load settings and sync with initial state asynchronously after dialog is shown
    setTimeout(async () => {
      await loadSettings();
      // Also sync settings dialog with current initial state values
      syncSettingsWithInitialState();
    }, 0);
  }
}

// Function to add a keyword tag to a container
function addKeywordTag(keyword, container, options = {}) {
  if (!container) return null;

  // Check if the keyword already exists
  const existingTags = container.querySelectorAll(".keyword-tag");
  for (const tag of existingTags) {
    if (
      tag
        .querySelector(".keyword-tag-text")
        .textContent.trim()
        .toLowerCase() === keyword.toLowerCase()
    ) {
      // Keyword already exists, don't add it again
      return null;
    }
  }

  const tag = document.createElement("div");
  tag.className = "keyword-tag";

  // Check if this is for positive keywords container
  const isPositive = container === elements.positiveKeywordsContainer;

  if (isPositive) {
    // Extract options
    const target = options.target || "keywords";
    const filetypes = options.filetypes || ["jpg", "png", "eps"];

    // Format file types for display
    const filetypesText = filetypes.join(", ").toUpperCase();

    // Create tag with info display instead of toggleable options
    tag.innerHTML = `
      <span class="keyword-tag-text">${keyword}</span>
      <span class="keyword-tag-info">
        <i class="fas fa-tag"></i> ${
          target === "all" ? "All content" : "Keywords only"
        }
        <span class="file-types">${filetypesText}</span>
      </span>
      <span class="keyword-tag-remove"><i class="fas fa-times"></i></span>
    `;

    // Store options as data attributes for later retrieval
    tag.dataset.target = target;
    tag.dataset.filetypes = JSON.stringify(filetypes);
  } else {
    // For negative keywords, keep the original simple structure
    tag.innerHTML = `
      <span class="keyword-tag-text">${keyword}</span>
      <span class="keyword-tag-remove"><i class="fas fa-times"></i></span>
    `;
  }

  // Add remove event listener
  const removeBtn = tag.querySelector(".keyword-tag-remove");
  removeBtn.addEventListener("click", () => {
    tag.remove();
    updateKeywordsHiddenInput();
  });

  container.appendChild(tag);

  // Return the created tag so we can set options if needed
  return tag;
}

// Function to update the hidden input fields with the current keywords
function updateKeywordsHiddenInput() {
  // Update positive keywords
  if (elements.positiveKeywordsContainer && elements.settingsPositiveKeywords) {
    const positiveKeywords = [];
    const tags =
      elements.positiveKeywordsContainer.querySelectorAll(".keyword-tag");

    tags.forEach((tag) => {
      const keywordText = tag
        .querySelector(".keyword-tag-text")
        .textContent.trim();

      // Get target and filetypes from data attributes
      const target = tag.dataset.target || "keywords";
      let filetypes = [];

      try {
        if (tag.dataset.filetypes) {
          filetypes = JSON.parse(tag.dataset.filetypes);
        }
      } catch (error) {
        console.warn("Failed to parse filetypes data attribute", error);
        filetypes = ["jpg", "png", "eps"]; // Default fallback
      }

      // Create keyword object with options
      const keywordObj = {
        text: keywordText,
        target: target,
        filetypes: filetypes,
      };

      positiveKeywords.push(keywordObj);
    });

    // Store as JSON string
    elements.settingsPositiveKeywords.value = JSON.stringify(positiveKeywords);
  }

  // Update negative keywords (unchanged)
  if (elements.negativeKeywordsContainer && elements.settingsNegativeKeywords) {
    const negativeKeywords = [];
    const tags =
      elements.negativeKeywordsContainer.querySelectorAll(".keyword-tag-text");
    tags.forEach((tag) => {
      negativeKeywords.push(tag.textContent.trim());
    });
    elements.settingsNegativeKeywords.value = negativeKeywords.join(",");
  }

  // Update keyword preview in initial state
  const currentSettings = {
    positiveKeywords: elements.settingsPositiveKeywords
      ? elements.settingsPositiveKeywords.value
      : "",
    negativeKeywords: elements.settingsNegativeKeywords
      ? elements.settingsNegativeKeywords.value
      : "",
  };
  updateKeywordPreview(currentSettings);
}

