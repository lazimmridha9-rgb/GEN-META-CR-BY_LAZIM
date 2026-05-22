// API Key Manager
/* global showToastNotification */
(function () {
  let geminiApiKeys = [];
  let isAddingInline = false; // prevent multiple inline rows

  // Load API keys from settings
  async function loadApiKeys() {
    try {
      const settings = await window.electronAPI.settings.load();

      if (settings.apiKeys && Array.isArray(settings.apiKeys)) {
        geminiApiKeys = settings.apiKeys.filter((key) => key && key.trim());
      } else {
        geminiApiKeys = [];
      }

      renderApiKeysList();
    } catch (error) {
      console.error("Error loading API keys:", error);
      geminiApiKeys = [];
      renderApiKeysList();
    }
  }

  // Save API keys to settings
  async function saveApiKeys() {
    try {
      const currentSettings = await window.electronAPI.settings.load();
      currentSettings.apiKeys = geminiApiKeys.filter(
        (key) => key && key.trim(),
      );
      await window.electronAPI.settings.save(currentSettings);
    } catch (error) {
      console.error("Error saving API keys:", error);
      showToastNotification(
        "Failed to save API keys. Please try again.",
        "error",
      );
    }
  }

  // Render API keys list
  function renderApiKeysList() {
    const apiKeysList = document.getElementById("api-keys-list");
    const emptyState = document.getElementById("api-keys-empty");

    if (!apiKeysList || !emptyState) return;

    isAddingInline = false;

    // Remove all key items (keep empty state element)
    apiKeysList.querySelectorAll(".api-key-item, .api-key-inline-row").forEach((item) => item.remove());

    if (geminiApiKeys.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";
    geminiApiKeys.forEach((key, index) => {
      const item = createApiKeyItem(key, index);
      apiKeysList.appendChild(item);
    });
  }

  // Create API key list item
  function createApiKeyItem(key, index) {
    const item = document.createElement("div");
    item.className = "api-key-item";
    item.dataset.index = index;

    const maskedKey = maskApiKey(key);

    item.innerHTML = `
      <div class="api-key-icon">
        <i class="fas fa-key"></i>
      </div>
      <div class="api-key-content">
        <div class="api-key-label">Gemini API Key #${index + 1}</div>
        <div class="api-key-value" data-masked="true">${maskedKey}</div>
      </div>
      <div class="api-key-actions">
        <button type="button" class="api-key-btn toggle" title="Show/Hide API Key">
          <i class="fas fa-eye"></i>
        </button>
        <button type="button" class="api-key-btn edit" title="Edit API Key">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="api-key-btn delete" title="Delete API Key">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Toggle visibility
    const toggleBtn = item.querySelector(".toggle");
    const valueEl = item.querySelector(".api-key-value");
    toggleBtn.addEventListener("click", () => {
      const isMasked = valueEl.dataset.masked === "true";
      if (isMasked) {
        valueEl.textContent = key;
        valueEl.dataset.masked = "false";
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        valueEl.textContent = maskedKey;
        valueEl.dataset.masked = "true";
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });

    // Edit button — replace item with inline edit row
    const editBtn = item.querySelector(".edit");
    editBtn.addEventListener("click", () => {
      if (isAddingInline) return;
      showInlineRow(index, key, item);
    });

    // Delete button
    const deleteBtn = item.querySelector(".delete");
    deleteBtn.addEventListener("click", () => {
      geminiApiKeys.splice(index, 1);
      saveApiKeys();
      renderApiKeysList();
    });

    return item;
  }

  // Show inline input row for add or edit
  function showInlineRow(editIndex = null, existingValue = "", referenceEl = null) {
    if (isAddingInline) return;
    isAddingInline = true;

    const apiKeysList = document.getElementById("api-keys-list");
    const emptyState = document.getElementById("api-keys-empty");

    const row = document.createElement("div");
    row.className = "api-key-inline-row";

    row.innerHTML = `
      <div class="api-key-inline-input-wrap">
        <input
          type="password"
          class="api-key-inline-input"
          placeholder="Paste your Gemini API key here"
          value="${existingValue}"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="button" class="api-key-btn toggle-inline" title="Show/Hide">
          <i class="fas fa-eye"></i>
        </button>
      </div>
      <div class="api-key-inline-actions">
        <button type="button" class="btn primary btn-sm save-inline-btn">
          <i class="fas fa-check"></i> Save
        </button>
        <button type="button" class="btn secondary btn-sm cancel-inline-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Toggle visibility of inline input
    const inlineInput = row.querySelector(".api-key-inline-input");
    const toggleInlineBtn = row.querySelector(".toggle-inline");
    toggleInlineBtn.addEventListener("click", () => {
      const isPassword = inlineInput.type === "password";
      inlineInput.type = isPassword ? "text" : "password";
      toggleInlineBtn.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });

    // Save
    const saveInline = () => {
      const key = inlineInput.value.trim();
      if (!key) {
        showToastNotification("Please enter an API key", "warning");
        return;
      }
      if (editIndex !== null) {
        geminiApiKeys[editIndex] = key;
      } else {
        geminiApiKeys.push(key);
      }
      saveApiKeys();
      renderApiKeysList();
    };

    row.querySelector(".save-inline-btn").addEventListener("click", saveInline);

    // Cancel
    row.querySelector(".cancel-inline-btn").addEventListener("click", () => {
      renderApiKeysList();
    });

    // Enter to save
    inlineInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveInline();
      if (e.key === "Escape") renderApiKeysList();
    });

    if (referenceEl) {
      // Replace the existing item with the inline row
      referenceEl.replaceWith(row);
    } else {
      // Adding new — append after existing items
      emptyState.style.display = "none";
      apiKeysList.appendChild(row);
    }

    inlineInput.focus();
    // Place cursor at end
    inlineInput.setSelectionRange(inlineInput.value.length, inlineInput.value.length);
  }

  // Mask API key for display
  function maskApiKey(key) {
    if (!key || key.length < 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  }

  // Wire up the Add API Key button
  function initializeAddButton() {
    const addBtn = document.getElementById("add-api-key-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        showInlineRow(null, "", null);
      });
    }
  }

  // Wire up the Get API Key button
  function initializeGetKeyButton() {
    const getBtn = document.getElementById("get-api-key-btn");
    if (getBtn) {
      getBtn.addEventListener("click", () => {
        window.electronAPI.openExternal("https://aistudio.google.com/app/apikey");
      });
    }
  }

  // Initialize
  function initialize() {
    initializeAddButton();
    initializeGetKeyButton();
    loadApiKeys();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  // Expose reload function for external use
  window.reloadApiKeys = loadApiKeys;
})();
