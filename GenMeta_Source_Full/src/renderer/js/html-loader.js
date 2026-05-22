(function () {
  "use strict";

  /**
   * Map of partial names to their HTML file paths.
   */
  var partials = {
    "drag-drop-overlay": "html/partials/drag-drop-overlay.html",
    "api-key-banner": "html/partials/api-key-banner.html",
    navbar: "html/components/navbar.html",
    "progress-panel": "html/components/progress-panel.html",
    "results-panel": "html/components/results-panel.html",
    "status-bar": "html/components/status-bar.html",
    "initial-state": "html/sections/initial-state.html",
    "settings-dialog": "html/modals/settings-dialog.html",
    "settings-system-section": "html/partials/settings-system-section.html",
    "settings-ai-section": "html/partials/settings-ai-section.html",
    "settings-advanced-section": "html/partials/settings-advanced-section.html",
    "settings-csv-section": "html/partials/settings-csv-section.html",
    "settings-appearance-section": "html/partials/settings-appearance-section.html",
    "settings-123rf-dialog": "html/modals/settings-123rf-dialog.html",
    "settings-pond5-dialog": "html/modals/settings-pond5-dialog.html",
    "settings-istock-dialog": "html/modals/settings-istock-dialog.html",
    "help-dialog": "html/modals/help-dialog.html",
    "update-dialog": "html/modals/update-dialog.html",
    "bulk-edit-dialog": "html/modals/bulk-edit-dialog.html",
    "login-dialog": "html/modals/login-dialog.html",
    "api-validation-dialog": "html/modals/api-validation-dialog.html",
    "rename-files-dialog": "html/modals/rename-files-dialog.html",
    "gs-manual-install-modal": "html/modals/gs-manual-install-modal.html",
    "profile-dropdown": "html/components/profile-dropdown.html",
    "api-key-modal": "html/modals/api-key-modal.html",
    "docs-panel": "html/modals/docs-panel.html",
  };

  /**
   * Fetch an HTML partial synchronously via XHR.
   * @param {string} name - The partial name key.
   * @returns {string} The HTML content, or empty string on failure.
   */
  function fetchPartial(name) {
    var path = partials[name];
    if (!path) return "";

    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", path, false);
      xhr.send();

      if (xhr.status === 200 || xhr.status === 0) {
        return xhr.responseText;
      }

      console.error(
        "[html-loader] Failed to load " + path + ": HTTP " + xhr.status
      );
      return "";
    } catch (err) {
      console.error("[html-loader] Failed to load " + path + ":", err);
      return "";
    }
  }

  /**
   * Load all partials into the DOM, replacing placeholder elements.
   */
  function loadAll() {
    for (var name in partials) {
      if (!Object.prototype.hasOwnProperty.call(partials, name)) continue;

      var el = document.getElementById("__partial-" + name);
      if (!el) continue;

      var html = fetchPartial(name);
      if (!html) continue;

      // Parse HTML and insert nodes before the placeholder
      var wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();

      while (wrapper.firstChild) {
        el.parentNode.insertBefore(wrapper.firstChild, el);
      }

      el.remove();
    }
  }

  loadAll();
})();
