/**
 * Important Notes Documentation Panel
 * Manages the docs overlay with English/Bengali language toggle.
 */
(function () {
  const importantNotesBtn = document.getElementById("important-notes-btn");
  const docsOverlay = document.getElementById("docs-panel-overlay");
  const docsCloseBtn = document.getElementById("docs-close-btn");
  const langToggleBtns = document.querySelectorAll(".lang-toggle-btn");
  const docsContentEn = document.getElementById("docs-content-en");
  const docsContentBn = document.getElementById("docs-content-bn");

  /**
   * Open the documentation panel overlay.
   */
  function openDocsPanel() {
    docsOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  /**
   * Close the documentation panel overlay.
   */
  function closeDocsPanel() {
    docsOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  /**
   * Switch the displayed language content.
   * @param {string} lang - Language code: "en" or "bn".
   */
  function switchLanguage(lang) {
    // Update toggle button active states
    langToggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Show/hide content panels based on selected language
    if (lang === "en") {
      docsContentEn.classList.remove("hidden");
      docsContentEn.style.display = "block";
      docsContentBn.classList.add("hidden");
      docsContentBn.style.display = "none";
    } else {
      docsContentEn.classList.add("hidden");
      docsContentEn.style.display = "none";
      docsContentBn.classList.remove("hidden");
      docsContentBn.style.display = "block";
    }
  }

  // Event listeners
  if (importantNotesBtn) {
    importantNotesBtn.addEventListener("click", openDocsPanel);
  }

  if (docsCloseBtn) {
    docsCloseBtn.addEventListener("click", closeDocsPanel);
  }

  // Close when clicking on the overlay background
  if (docsOverlay) {
    docsOverlay.addEventListener("click", (e) => {
      if (e.target === docsOverlay) {
        closeDocsPanel();
      }
    });
  }

  // Language toggle buttons
  langToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchLanguage(btn.dataset.lang);
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && docsOverlay.classList.contains("active")) {
      closeDocsPanel();
    }
  });

  // Initialize with English content
  switchLanguage("en");
})();
