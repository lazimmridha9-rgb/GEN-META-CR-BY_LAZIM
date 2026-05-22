/**
 * Settings Synchronization Module
 *
 * This module handles real-time synchronization between:
 * 1. Initial state controls (right column in main view)
 * 2. Settings dialog controls
 * 3. Model settings modal
 * 4. Persistent storage
 *
 * Features:
 * - Bi-directional sync between all UI elements
 * - Auto-save with debouncing for performance
 * - Real-time keyword preview updates
 * - Visual feedback for save operations
 */

// Auto-save indicator functions
function showAutoSaveIndicator() {
    let indicator = document.getElementById('auto-save-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'auto-save-indicator';
        indicator.innerHTML = '<i class="fas fa-save"></i> Auto-saving...';
        document.body.appendChild(indicator);

        // Add CSS if not already present
        if (!document.getElementById('auto-save-styles')) {
            const style = document.createElement('style');
            style.id = 'auto-save-styles';
            style.textContent = `
        .auto-save-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10000;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .auto-save-indicator.show {
          opacity: 1;
          transform: translateY(0);
        }

        .auto-save-indicator.success {
          background: rgba(34, 197, 94, 0.9);
        }

        .auto-save-indicator.error {
          background: rgba(239, 68, 68, 0.9);
        }
      `;
            document.head.appendChild(style);
        }
    }

    indicator.className = 'auto-save-indicator show';
    indicator.innerHTML = '<i class="fas fa-save"></i> Auto-saving...';
}

function showAutoSaveSuccess() {
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
        indicator.className = 'auto-save-indicator show success';
        indicator.innerHTML = '<i class="fas fa-check"></i> Saved';

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }
}

function showAutoSaveError() {
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
        indicator.className = 'auto-save-indicator show error';
        indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Save failed';

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }
}

// Enhanced auto-save function with visual feedback
async function autoSaveSettings(settingsUpdate, showIndicator = true) {
    try {
        if (showIndicator) {
            showAutoSaveIndicator();
        }

        const settings = await window.electronAPI.settings.load();
        Object.assign(settings, settingsUpdate);
        const result = await window.electronAPI.settings.save(settings);

        if (result && showIndicator) {
            showAutoSaveSuccess();
        } else if (showIndicator) {
            showAutoSaveError();
        }

        return result;
    } catch (error) {
        console.error("Error in autoSaveSettings:", error);
        if (showIndicator) {
            showAutoSaveError();
        }
        return false;
    }
}

// Debounced auto-save function
function createDebouncedAutoSave(key, delay = 500) {
    let timeout;

    return function (value, showIndicator = true) {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const update = {};
            update[key] = value;
            await autoSaveSettings(update, showIndicator);
        }, delay);
    };
}

// Export functions for use in main script
window.settingsSync = {
    showAutoSaveIndicator,
    showAutoSaveSuccess,
    showAutoSaveError,
    autoSaveSettings,
    createDebouncedAutoSave
};

console.log('Settings synchronization module loaded');