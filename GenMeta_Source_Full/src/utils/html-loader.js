/**
 * HTML partial loader for Electron renderer process.
 * Fetches HTML partials synchronously and injects them into placeholder elements.
 */
(function () {
  "use strict";

  /**
   * Mapping of partial names to their file paths.
   * @type {Object<string, string>}
   */
  var partials = {
    "drag-drop-overlay": "partials/drag-drop-overlay.html",
    "api-key-banner": "partials/api-key-banner.html",
    navbar: "components/navbar.html",
    "progress-panel": "components/progress-panel.html",
    "results-panel": "components/results-panel.html",
    "status-bar": "components/status-bar.html",
    "initial-state": "sections/initial-state.html",
    "settings-dialog": "modals/settings-dialog.html",
    "settings-system-section": "partials/settings-system-section.html",
    "settings-ai-section": "partials/settings-ai-section.html",
    "settings-advanced-section": "partials/settings-advanced-section.html",
    "settings-csv-section": "partials/settings-csv-section.html",
    "settings-appearance-section": "partials/settings-appearance-section.html",
    "settings-123rf-dialog": "modals/settings-123rf-dialog.html",
    "settings-pond5-dialog": "modals/settings-pond5-dialog.html",
    "settings-istock-dialog": "modals/settings-istock-dialog.html",
    "help-dialog": "modals/help-dialog.html",
    "update-dialog": "modals/update-dialog.html",
    "bulk-edit-dialog": "modals/bulk-edit-dialog.html",
    "login-dialog": "modals/login-dialog.html",
    "api-validation-dialog": "modals/api-validation-dialog.html",
    "rename-files-dialog": "modals/rename-files-dialog.html",
    "gs-manual-install-modal": "modals/gs-manual-install-modal.html",
    "profile-dropdown": "components/profile-dropdown.html",
    "api-key-modal": "modals/api-key-modal.html",
    "docs-panel": "modals/docs-panel.html",
  };

  /**
   * Fetches an HTML partial synchronously via XMLHttpRequest.
   *
   * @param {string} name - The partial name to fetch.
   * @returns {string} The HTML content or empty string on failure.
   */
  function fetchPartial(name) {
    var filePath = partials[name];
    if (!filePath) return "";

    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", filePath, false);
      xhr.send();

      if (xhr.status === 200 || xhr.status === 0) {
        return xhr.responseText;
      }

      console.error(
        "[html-loader] Failed to load " + filePath + ": HTTP " + xhr.status
      );
      return "";
    } catch (err) {
      console.error("[html-loader] Failed to load " + filePath + ":", err);
      return "";
    }
  }

  /**
   * Loads all HTML partials by finding placeholder elements and replacing them.
   */
  function loadAll() {
    for (var name in partials) {
      if (!Object.prototype.hasOwnProperty.call(partials, name)) continue;

      var el = document.getElementById("__partial-" + name);
      if (!el) continue;

      var html = fetchPartial(name);
      if (html) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        // Insert all child nodes before the placeholder
        while (wrapper.firstChild) {
          el.parentNode.insertBefore(wrapper.firstChild, el);
        }
      }

      // Remove the placeholder element
      el.remove();
    }
  }

  loadAll();
})();
