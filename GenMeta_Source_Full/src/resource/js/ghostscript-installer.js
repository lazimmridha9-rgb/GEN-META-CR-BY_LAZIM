/**
 * Ghostscript Installer UI Handler
 * Manages the UI for automatic Ghostscript installation
 */

// Elements for Ghostscript installation UI
const gsElements = {
  // Installation elements - these will be created dynamically
  installGsButton: null,

  installationProgress: null,
  downloadProgress: null,
  gsPathValidationMessage: null,
  gsInstallerContainer: null,
};

// Flag to track if installation is in progress
let isGsInstallationInProgress = false;

// Store listener removers
let currentDownloadProgressRemover = null;

// Initialize the Ghostscript installer UI
async function initGhostscriptInstaller() {
  // Create installation UI elements
  createGhostscriptInstallerUI();

  // Set up event listeners
  setupGhostscriptEventListeners();

  // Set up IPC listeners for installation detection
  setupInstallDetectionListener();

  // Set up system configuration tab listener for auto-detection
  setupSystemConfigTabListener();
}

// Set up the IPC listener for installation detection
function setupInstallDetectionListener() {
  // Listen for installation detection events from main process
  if (window.electronAPI && window.electronAPI.settings) {
    window.electronAPI.settings.onGhostscriptInstallDetected((installInfo) => {

      // Update the UI to show the detected installation
      if (installInfo.installed) {
        // Clean up any active progress listeners
        if (currentDownloadProgressRemover) {
          currentDownloadProgressRemover();
          currentDownloadProgressRemover = null;
        }

        // Update status message
        if (gsElements.gsPathValidationMessage) {
          gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-check-circle" style="color: #4CAF50;"></i> EPS plugin already installed Ghostscript ${installInfo.version}`;
          gsElements.gsPathValidationMessage.style.color = "var(--text-color)";
        }

        // Hide progress container after detection
        const progressContainer = document.querySelector(
          ".gs-installer-progress"
        );
        if (progressContainer) {
          progressContainer.style.display = "none";
        }

        // Disable install button
        if (gsElements.installGsButton) {
          gsElements.installGsButton.disabled = true;
          gsElements.installGsButton.title = "Ghostscript is already installed";
        }

        // Re-enable auto-detect button

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

        // Always save the path to settings
        try {
          window.electronAPI.settings.load().then((settings) => {
            // Always update the gsPath when Ghostscript is detected
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
      }
    });
  }
}

// Create the Ghostscript installer UI elements
function createGhostscriptInstallerUI() {
  // Get the system configuration section element
  const systemSection = document.getElementById("system-section");
  if (!systemSection) {
    console.error("System configuration section not found");
    return;
  }

  // Create container for Ghostscript installer
  const gsContainer = document.createElement("div");
  gsContainer.className = "form-group gs-installer-container";
  gsElements.gsInstallerContainer = gsContainer;

  // Create header for Ghostscript section
  const gsHeader = document.createElement("h5");
  gsHeader.className = "settings-subsection-title";
  gsHeader.innerHTML =
    '<i class="fas fa-file"></i> Install EPS plugin Ghostscript';
  gsContainer.appendChild(gsHeader);

  // Create info message
  const gsInfo = document.createElement("p");
  gsInfo.className = "setting-hint";
  gsInfo.innerHTML =
    "Ghostscript is required to process EPS files. The application will automatically detect or install it.";
  gsContainer.appendChild(gsInfo);

  // Create status message
  const gsStatus = document.createElement("div");
  gsStatus.className = "gs-status-message";
  gsStatus.textContent = "Checking Ghostscript installation...";
  gsElements.gsPathValidationMessage = gsStatus;
  gsContainer.appendChild(gsStatus);

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "gs-installer-buttons";

  // Create install button (auto-detect button removed)
  gsElements.installGsButton = document.createElement("button");
  gsElements.installGsButton.type = "button";
  gsElements.installGsButton.className = "btn primary btn-sm";
  gsElements.installGsButton.innerHTML =
    '<i class="fas fa-download"></i> Install EPS plugin Ghostscript';
  gsElements.installGsButton.title =
    "Download and install Ghostscript automatically";
  gsElements.installGsButton.disabled = true; // Initially disabled until detection
  buttonContainer.appendChild(gsElements.installGsButton);

  // Add button container to main container
  gsContainer.appendChild(buttonContainer);

  // Create progress container (only for download progress)
  const progressContainer = document.createElement("div");
  progressContainer.className = "gs-installer-progress";
  progressContainer.style.display = "none";

  // Create download progress element with minimal design
  gsElements.downloadProgress = document.createElement("div");
  gsElements.downloadProgress.className = "download-progress";
  gsElements.downloadProgress.innerHTML = `<div class="progress-info"><span class="progress-label">Downloading</span><span class="progress-percentage">0%</span></div><div class="download-progress-container"><div class="progress-fill" style="width: 0%"></div></div>`;
  progressContainer.appendChild(gsElements.downloadProgress);

  // Add progress container to main container
  gsContainer.appendChild(progressContainer);

  // Add the container to the system section
  systemSection.appendChild(gsContainer);

  // Create File Options section below Ghostscript configuration
  createFileOptionsSection(systemSection);

  // CSS classes are now defined in styles.css
}

// Check if Ghostscript is already installed
async function checkGhostscriptInstallation() {
  try {
    gsElements.gsPathValidationMessage.textContent =
      "Checking Ghostscript installation...";
    gsElements.gsPathValidationMessage.style.color = "#aaa";

    const result = await window.electronAPI.settings.checkGsInstalled();

    if (result.installed) {
      gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success-color);"></i> EPS plugin already installed Ghostscript ${result.version}`;
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      // Disable install button but keep auto-detect enabled
      if (gsElements.installGsButton) {
        gsElements.installGsButton.disabled = true;
        gsElements.installGsButton.title = "Ghostscript is already installed";
      }
    } else {
      gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--warning-color);"></i> Ghostscript not installed, please install to process EPS files`;
      gsElements.gsPathValidationMessage.style.color = "#ddd";

      // Enable install button when not found
      if (gsElements.installGsButton) {
        gsElements.installGsButton.disabled = false;
        gsElements.installGsButton.title =
          "Download and install Ghostscript automatically";
      }
    }
  } catch (error) {
    console.error("Error checking Ghostscript installation:", error);
    gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i> Error checking installation`;
    gsElements.gsPathValidationMessage.style.color = "#ff6b6b";
  }
}

// Set up event listeners for Ghostscript installer
function setupGhostscriptEventListeners() {
  // Auto-detect functionality removed - now handled automatically when tab is opened

  // Install button
  if (gsElements.installGsButton) {
    gsElements.installGsButton.addEventListener("click", async () => {
      // Prevent multiple installations
      if (isGsInstallationInProgress) return;
      isGsInstallationInProgress = true;

      try {
        // Show progress container
        const progressContainer = document.querySelector(
          ".gs-installer-progress"
        );
        if (progressContainer) {
          progressContainer.style.display = "block";
        }

        // Disable install button during installation
        gsElements.installGsButton.disabled = true;

        // Update status
        gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: var(--primary-color);"></i> Starting installation...`;
        gsElements.gsPathValidationMessage.style.color = "#ddd";

        // Set up progress listeners
        currentDownloadProgressRemover =
          window.electronAPI.settings.onGhostscriptDownloadProgress((data) => {
            updateDownloadProgress(data.progress);
          });

        // Start installation
        const result = await window.electronAPI.settings.installGhostscript();

        // Handle installation result
        if (result.installed || result.alreadyInstalled) {
          gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success-color);"></i> Ghostscript installed successfully`;
          gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

          // Hide progress container after completion
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

          // Keep the install button disabled
          gsElements.installGsButton.disabled = true;
          gsElements.installGsButton.title = "Ghostscript is already installed";

          // Now it's safe to remove the progress listeners
          if (currentDownloadProgressRemover) {
            currentDownloadProgressRemover();
            currentDownloadProgressRemover = null;
          }
        } else if (result.installing || result.manual) {
          gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: var(--primary-color);"></i> Installing Ghostscript...`;
          gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

          // Show notification
          if (typeof window.showToastNotification === "function") {
            window.showToastNotification(
              "Ghostscript installer opened. Please complete the installation.",
              "info",
              8000
            );
          }

          // Keep buttons disabled during installation
          gsElements.installGsButton.disabled = true;

          // DO NOT remove listeners here as we need them for installation progress updates
        } else {
          gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-times-circle" style="color: var(--error-color);"></i> Installation failed`;
          gsElements.gsPathValidationMessage.style.color = "var(--text-color)";

          // Hide progress container on failure
          const progressContainer = document.querySelector(
            ".gs-installer-progress"
          );
          if (progressContainer) {
            progressContainer.style.display = "none";
          }

          // Re-enable buttons
          gsElements.installGsButton.disabled = false;

          // Show manual installation modal
          showManualInstallModal();

          // Remove listeners on failure
          if (currentDownloadProgressRemover) {
            currentDownloadProgressRemover();
            currentDownloadProgressRemover = null;
          }
        }
      } catch (error) {
        console.error("Error installing Ghostscript:", error);
        gsElements.gsPathValidationMessage.innerHTML = `<i class="fas fa-times-circle" style="color: var(--error-color);"></i> Installation error`;
        gsElements.gsPathValidationMessage.style.color = "#ddd";

        // Hide progress container on error
        const progressContainer = document.querySelector(
          ".gs-installer-progress"
        );
        if (progressContainer) {
          progressContainer.style.display = "none";
        }

        // Re-enable buttons
        gsElements.installGsButton.disabled = false;

        // Remove listeners on error
        if (currentDownloadProgressRemover) {
          currentDownloadProgressRemover();
          currentDownloadProgressRemover = null;
        }
      } finally {
        // Reset installation in progress flag
        isGsInstallationInProgress = false;
      }
    });
  }
}

// Update download progress UI
function updateDownloadProgress(progress) {
  if (!gsElements.downloadProgress) return;

  const progressFill =
    gsElements.downloadProgress.querySelector(".progress-fill");
  const progressPercentage = gsElements.downloadProgress.querySelector(
    ".progress-percentage"
  );

  if (progressFill && progressPercentage) {
    progressFill.style.width = `${progress}%`;
    progressPercentage.textContent = `${Math.round(progress)}%`;
  }
}

// Create File Options section
function createFileOptionsSection(systemSection) {
  // Create container for File Options
  const fileOptionsContainer = document.createElement("div");
  fileOptionsContainer.className = "form-group file-options-container";

  // Create header for File Options section
  const fileOptionsHeader = document.createElement("h5");
  fileOptionsHeader.className = "settings-subsection-title";
  fileOptionsHeader.innerHTML = '<i class="fas fa-file-alt"></i> File Options';
  fileOptionsContainer.appendChild(fileOptionsHeader);

  // Create toggle for JPG copy option
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

  // Create hint text for JPG
  const hintTextJpg = document.createElement("p");
  hintTextJpg.className = "setting-hint";
  hintTextJpg.textContent =
    "When enabled, a JPG copy with the same metadata will be created alongside each EPS file";
  fileOptionsContainer.appendChild(hintTextJpg);

  // Create toggle for PNG copy option
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

  // Create hint text for PNG
  const hintTextPng = document.createElement("p");
  hintTextPng.className = "setting-hint";
  hintTextPng.textContent =
    "When enabled, a PNG copy with the same metadata will be created alongside each EPS file";
  fileOptionsContainer.appendChild(hintTextPng);

  // Add the container to the system section
  systemSection.appendChild(fileOptionsContainer);

  // Update the elements object to reference the newly created toggles
  // This ensures the settings can be loaded and saved properly
  if (typeof window.elements !== "undefined") {
    window.elements.settingsCreateJpgCopy = toggleInputJpg;
    window.elements.settingsCreatePngCopy = toggleInputPng;
  }
}

// Set up system configuration tab listener for auto-detection
function setupSystemConfigTabListener() {
  // Listen for when the system configuration tab is clicked
  const systemConfigMenuItem = document.querySelector(
    '.settings-menu-item[data-section="system-section"]'
  );

  if (systemConfigMenuItem) {
    systemConfigMenuItem.addEventListener("click", () => {
      // Automatically check Ghostscript installation when tab is opened
      setTimeout(() => {
        checkGhostscriptInstallation();
      }, 100); // Small delay to ensure UI is ready
    });
  }
}

// Manual installation modal functions
function showManualInstallModal() {
  const modal = document.getElementById("gs-manual-install-modal");
  if (modal) {
    modal.classList.add("show");
  }
}

function hideManualInstallModal() {
  const modal = document.getElementById("gs-manual-install-modal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// Initialize manual installation modal event listeners
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

  const openGhostscriptWebsite = () => {
    if (
      typeof window.electronAPI !== "undefined" &&
      window.electronAPI.openExternal
    ) {
      window.electronAPI.openExternal(
        "https://www.ghostscript.com/releases/gsdnld.html"
      );
    } else {
      window.open("https://www.ghostscript.com/releases/gsdnld.html", "_blank");
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
  // Initialize manual installation modal
  initManualInstallModal();

  // We'll call this from the main script.js to ensure all elements are loaded
  // initGhostscriptInstaller();
});

// Export the initialization function and checkGhostscriptInstallation
window.initGhostscriptInstaller = initGhostscriptInstaller;
window.checkGhostscriptInstallation = checkGhostscriptInstallation;
