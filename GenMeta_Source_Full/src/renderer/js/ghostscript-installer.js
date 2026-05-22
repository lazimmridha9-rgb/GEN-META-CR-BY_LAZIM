/**
 * Ghostscript Installer UI Handler
 * Manages the UI for automatic Ghostscript installation and file options.
 * @module ghostscript-installer
 */

// Elements for Ghostscript installation UI
const gsElements = {
  installGsButton: null,
  installationProgress: null,
  downloadProgress: null,
  gsPathValidationMessage: null,
  gsInstallerContainer: null,
};

// Track whether an installation is currently in progress
let isGsInstallationInProgress = false;

// Store the active download progress listener remover
let currentDownloadProgressRemover = null;

/**
 * Initialize the Ghostscript installer UI.
 * Creates dynamic elements, sets up event listeners, and configures IPC listeners.
 */
async function initGhostscriptInstaller() {
  createGhostscriptInstallerUI();
  setupGhostscriptEventListeners();
  setupInstallDetectionListener();
  setupSystemConfigTabListener();
}

/**
 * Set up IPC listener for installation detection events from the main process.
 */
function setupInstallDetectionListener() {
  if (!window.electronAPI || !window.electronAPI.settings) return;

  window.electronAPI.settings.onGhostscriptInstallDetected((installInfo) => {
    if (!installInfo.installed) return;

    // Clean up any active progress listeners
    if (currentDownloadProgressRemover) {
      currentDownloadProgressRemover();
      currentDownloadProgressRemover = null;
    }

    // Update status message
    if (gsElements.gsPathValidationMessage) {
      gsElements.gsPathValidationMessage.innerHTML =
        '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> EPS plugin already installed Ghostscript ' +
        installInfo.version;
      gsElements.gsPathValidationMessage.style.color = "var(--text-color)";
    }

    // Hide progress container
    const progressContainer = document.querySelector(".gs-installer-progress");
    if (progressContainer) {
      progressContainer.style.display = "none";
    }

    // Disable install button
    if (gsElements.installGsButton) {
      gsElements.installGsButton.disabled = true;
      gsElements.installGsButton.title = "Ghostscript is already installed";
    }

    // Reset installation in progress flag
    isGsInstallationInProgress = false;

    // Show success notification
    if (typeof window.showToastNotification === "function") {
      window.showToastNotification(
        "Ghostscript installation complete! You can now process EPS files.",
        "success",
        5000
      );
    }

    // Save the detected path to settings
    try {
      window.electronAPI.settings.load().then((settings) => {
        if (installInfo.path) {
          settings.gsPath = installInfo.path;
          window.electronAPI.settings.save(settings).then(() => {
            console.log(
              "Saved Ghostscript path to settings:",
              installInfo.path
            );
          });
        }
      });
    } catch (error) {
      console.error("Error saving Ghostscript path to settings:", error);
    }
  });
}

/**
 * Create the Ghostscript installer UI elements dynamically.
 */
function createGhostscriptInstallerUI() {
  const systemSection = document.getElementById("system-section");
  if (!systemSection) {
    console.error("System configuration section not found");
    return;
  }

  // Main container
  const gsContainer = document.createElement("div");
  gsContainer.className = "form-group gs-installer-container";
  gsElements.gsInstallerContainer = gsContainer;

  // Header
  const gsHeader = document.createElement("h5");
  gsHeader.className = "settings-subsection-title";
  gsHeader.innerHTML =
    '<i class="fas fa-file"></i> Install EPS plugin Ghostscript';
  gsContainer.appendChild(gsHeader);

  // Info message
  const gsInfo = document.createElement("p");
  gsInfo.className = "setting-hint";
  gsInfo.textContent =
    "Ghostscript is required to process EPS files. The application will automatically detect or install it.";
  gsContainer.appendChild(gsInfo);

  // Status message
  const gsStatus = document.createElement("div");
  gsStatus.className = "gs-status-message";
  gsStatus.textContent = "Checking Ghostscript installation...";
  gsElements.gsPathValidationMessage = gsStatus;
  gsContainer.appendChild(gsStatus);

  // Button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "gs-installer-buttons";

  // Install button
  gsElements.installGsButton = document.createElement("button");
  gsElements.installGsButton.type = "button";
  gsElements.installGsButton.className = "btn primary btn-sm";
  gsElements.installGsButton.innerHTML =
    '<i class="fas fa-download"></i> Install EPS plugin Ghostscript';
  gsElements.installGsButton.title =
    "Download and install Ghostscript automatically";
  gsElements.installGsButton.disabled = true; // Disabled until detection completes
  buttonContainer.appendChild(gsElements.installGsButton);

  gsContainer.appendChild(buttonContainer);

  // Progress container (hidden by default)
  const progressContainer = document.createElement("div");
  progressContainer.className = "gs-installer-progress";
  progressContainer.style.display = "none";

  // Download progress element
  gsElements.downloadProgress = document.createElement("div");
  gsElements.downloadProgress.className = "download-progress";
  gsElements.downloadProgress.innerHTML =
    '<div class="progress-info"><span class="progress-label">Downloading</span><span class="progress-percentage">0%</span></div><div class="download-progress-container"><div class="progress-fill" style="width: 0%"></div></div>';
  progressContainer.appendChild(gsElements.downloadProgress);

  gsContainer.appendChild(progressContainer);

  // Add to system section
  systemSection.appendChild(gsContainer);

  // Create File Options section below Ghostscript
  createFileOptionsSection(systemSection);

  // CSS classes are defined in styles.css
}

/**
 * Check Ghostscript installation status via the main process.
 */
async function checkGhostscriptInstallation() {
  try {
    gsElements.gsPathValidationMessage.textContent =
      "Checking Ghostscript installation...";
    gsElements.gsPathValidationMessage.style.color = "#aaa";

    const result = await window.electronAPI.settings.checkGsInstalled();

    if (result.installed) {
      gsElements.gsPathValidationMessage.innerHTML =
        '<i class="fas fa-check-circle" style="color: var(--success-color);"></i> EPS plugin already installed Ghostscript ' +
        result.version;
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      if (gsElements.installGsButton) {
        gsElements.installGsButton.disabled = true;
        gsElements.installGsButton.title = "Ghostscript is already installed";
      }
    } else {
      gsElements.gsPathValidationMessage.innerHTML =
        '<i class="fas fa-exclamation-circle" style="color: var(--warning-color);"></i> Ghostscript not installed, please install to process EPS files';
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      if (gsElements.installGsButton) {
        gsElements.installGsButton.disabled = false;
        gsElements.installGsButton.title =
          "Download and install Ghostscript automatically";
      }
    }
  } catch (error) {
    console.error("Error checking Ghostscript installation:", error);
    gsElements.gsPathValidationMessage.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i> Error checking installation';
    gsElements.gsPathValidationMessage.style.color = "#ff6b6b";
  }
}

/**
 * Set up event listeners for the Ghostscript installer UI.
 */
function setupGhostscriptEventListeners() {
  if (!gsElements.installGsButton) return;

  gsElements.installGsButton.addEventListener("click", async () => {
    // Prevent multiple simultaneous installations
    if (isGsInstallationInProgress) return;
    isGsInstallationInProgress = true;

    try {
      // Show progress container
      const progressContainer = document.querySelector(".gs-installer-progress");
      if (progressContainer) {
        progressContainer.style.display = "block";
      }

      // Disable install button
      gsElements.installGsButton.disabled = true;

      // Update status
      gsElements.gsPathValidationMessage.innerHTML =
        '<i class="fas fa-spinner fa-spin" style="color: var(--primary-color);"></i> Starting installation...';
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      // Set up progress listener
      currentDownloadProgressRemover =
        window.electronAPI.settings.onGhostscriptDownloadProgress((data) => {
          updateDownloadProgress(data.progress);
        });

      // Start installation
      const result = await window.electronAPI.settings.installGhostscript();

      // Handle installation result
      if (result.installed || result.alreadyInstalled) {
        gsElements.gsPathValidationMessage.innerHTML =
          '<i class="fas fa-check-circle" style="color: var(--success-color);"></i> Ghostscript installed successfully';
        gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

        // Hide progress container
        const progressContainer = document.querySelector(
          ".gs-installer-progress"
        );
        if (progressContainer) {
          progressContainer.style.display = "none";
        }

        // Show success notification
        if (typeof window.showToastNotification === "function") {
          window.showToastNotification(
            "Ghostscript installed successfully! You can now process EPS files.",
            "success",
            5000
          );
        }

        gsElements.installGsButton.disabled = true;
        gsElements.installGsButton.title = "Ghostscript is already installed";

        // Clean up progress listener
        if (currentDownloadProgressRemover) {
          currentDownloadProgressRemover();
          currentDownloadProgressRemover = null;
        }
      } else if (result.installing || result.manual) {
        gsElements.gsPathValidationMessage.innerHTML =
          '<i class="fas fa-spinner fa-spin" style="color: var(--primary-color);"></i> Installing Ghostscript...';
        gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

        if (typeof window.showToastNotification === "function") {
          window.showToastNotification(
            "Ghostscript installer opened. Please complete the installation.",
            "info",
            8000
          );
        }

        gsElements.installGsButton.disabled = true;
        // Keep listeners active for installation progress updates
      } else {
        // Installation failed — show manual install modal
        gsElements.gsPathValidationMessage.innerHTML =
          '<i class="fas fa-times-circle" style="color: var(--error-color);"></i> Installation failed';
        gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

        const progressContainer = document.querySelector(
          ".gs-installer-progress"
        );
        if (progressContainer) {
          progressContainer.style.display = "none";
        }

        gsElements.installGsButton.disabled = false;
        showManualInstallModal();

        if (currentDownloadProgressRemover) {
          currentDownloadProgressRemover();
          currentDownloadProgressRemover = null;
        }
      }
    } catch (error) {
      console.error("Error installing Ghostscript:", error);
      gsElements.gsPathValidationMessage.innerHTML =
        '<i class="fas fa-times-circle" style="color: var(--error-color);"></i> Installation error';
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      const progressContainer = document.querySelector(".gs-installer-progress");
      if (progressContainer) {
        progressContainer.style.display = "none";
      }

      gsElements.installGsButton.disabled = false;

      if (currentDownloadProgressRemover) {
        currentDownloadProgressRemover();
        currentDownloadProgressRemover = null;
      }
    } finally {
      isGsInstallationInProgress = false;
    }
  });
}

/**
 * Update the download progress bar UI.
 * @param {number} progress - Progress percentage (0-100).
 */
function updateDownloadProgress(progress) {
  if (!gsElements.downloadProgress) return;

  const progressFill = gsElements.downloadProgress.querySelector(
    ".progress-fill"
  );
  const progressPercentage = gsElements.downloadProgress.querySelector(
    ".progress-percentage"
  );

  if (progressFill && progressPercentage) {
    progressFill.style.width = progress + "%";
    progressPercentage.textContent = Math.round(progress) + "%";
  }
}

/**
 * Create the File Options section (JPG/PNG copy toggles).
 * @param {HTMLElement} systemSection - The parent section element.
 */
function createFileOptionsSection(systemSection) {
  const fileOptionsContainer = document.createElement("div");
  fileOptionsContainer.className = "form-group file-options-container";

  // Header
  const fileOptionsHeader = document.createElement("h5");
  fileOptionsHeader.className = "settings-subsection-title";
  fileOptionsHeader.innerHTML =
    '<i class="fas fa-file-alt"></i> File Options';
  fileOptionsContainer.appendChild(fileOptionsHeader);

  // JPG copy toggle
  const toggleLabelJpg = document.createElement("label");
  toggleLabelJpg.className = "toggle";

  const toggleInputJpg = document.createElement("input");
  toggleInputJpg.type = "checkbox";
  toggleInputJpg.id = "settings-create-jpg-copy";

  const toggleSliderJpg = document.createElement("span");
  toggleSliderJpg.className = "toggle-slider";

  const toggleLabelTextJpg = document.createElement("span");
  toggleLabelTextJpg.className = "toggle-label";
  toggleLabelTextJpg.textContent = "Create JPG Copy of EPS Files";

  toggleLabelJpg.appendChild(toggleInputJpg);
  toggleLabelJpg.appendChild(toggleSliderJpg);
  toggleLabelJpg.appendChild(toggleLabelTextJpg);

  fileOptionsContainer.appendChild(toggleLabelJpg);

  const hintTextJpg = document.createElement("p");
  hintTextJpg.className = "setting-hint";
  hintTextJpg.textContent =
    "When enabled, a JPG copy with the same metadata will be created alongside each EPS file";
  fileOptionsContainer.appendChild(hintTextJpg);

  // PNG copy toggle
  const toggleLabelPng = document.createElement("label");
  toggleLabelPng.className = "toggle";

  const toggleInputPng = document.createElement("input");
  toggleInputPng.type = "checkbox";
  toggleInputPng.id = "settings-create-png-copy";

  const toggleSliderPng = document.createElement("span");
  toggleSliderPng.className = "toggle-slider";

  const toggleLabelTextPng = document.createElement("span");
  toggleLabelTextPng.className = "toggle-label";
  toggleLabelTextPng.textContent = "Create PNG Copy of EPS Files";

  toggleLabelPng.appendChild(toggleInputPng);
  toggleLabelPng.appendChild(toggleSliderPng);
  toggleLabelPng.appendChild(toggleLabelTextPng);

  fileOptionsContainer.appendChild(toggleLabelPng);

  const hintTextPng = document.createElement("p");
  hintTextPng.className = "setting-hint";
  hintTextPng.textContent =
    "When enabled, a PNG copy with the same metadata will be created alongside each EPS file";
  fileOptionsContainer.appendChild(hintTextPng);

  // Add to system section
  systemSection.appendChild(fileOptionsContainer);

  // Update the global elements object to reference the newly created toggles
  if (typeof window.elements !== "undefined") {
    window.elements.settingsCreateJpgCopy = toggleInputJpg;
    window.elements.settingsCreatePngCopy = toggleInputPng;
  }
}

/**
 * Set up listener to auto-detect Ghostscript when the system config tab is opened.
 */
function setupSystemConfigTabListener() {
  const systemConfigMenuItem = document.querySelector(
    '.settings-menu-item[data-section="system-section"]'
  );

  if (systemConfigMenuItem) {
    systemConfigMenuItem.addEventListener("click", () => {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        checkGhostscriptInstallation();
      }, 100);
    });
  }
}

/**
 * Show the manual installation modal.
 */
function showManualInstallModal() {
  const modal = document.getElementById("gs-manual-install-modal");
  if (modal) {
    modal.classList.add("show");
  }
}

/**
 * Hide the manual installation modal.
 */
function hideManualInstallModal() {
  const modal = document.getElementById("gs-manual-install-modal");
  if (modal) {
    modal.classList.remove("show");
  }
}

/**
 * Initialize event listeners for the manual installation modal.
 */
function initManualInstallModal() {
  // Close modal buttons
  const closeBtn = document.getElementById("close-gs-manual-modal");
  const closeBtnFooter = document.getElementById("close-gs-manual-modal-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", hideManualInstallModal);
  }
  if (closeBtnFooter) {
    closeBtnFooter.addEventListener("click", hideManualInstallModal);
  }

  // Open website button
  const openWebsiteBtn = document.getElementById("open-gs-website-btn");
  const websiteLink = document.getElementById("gs-website-link");

  const openGhostscriptWebsite = async () => {
    const url = "https://www.ghostscript.com/releases/gsdnld.html";
    if (
      typeof window.electronAPI !== "undefined" &&
      window.electronAPI.openExternal
    ) {
      const result = await window.electronAPI.openExternal(url);
      if (!result.success) {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  };

  if (openWebsiteBtn) {
    openWebsiteBtn.addEventListener("click", openGhostscriptWebsite);
  }
  if (websiteLink) {
    websiteLink.addEventListener("click", (e) => {
      e.preventDefault();
      openGhostscriptWebsite();
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById("gs-manual-install-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideManualInstallModal();
      }
    });
  }
}

// Initialize when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  initManualInstallModal();
  // initGhostscriptInstaller() is called from main script.js
});

// Export functions to the global window object
window.initGhostscriptInstaller = initGhostscriptInstaller;
window.checkGhostscriptInstallation = checkGhostscriptInstallation;
