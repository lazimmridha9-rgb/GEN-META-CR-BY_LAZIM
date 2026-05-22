// Important Notes Documentation Panel
(function () {
  const importantNotesBtn = document.getElementById("important-notes-btn");
  const docsOverlay = document.getElementById("docs-panel-overlay");
  const docsCloseBtn = document.getElementById("docs-close-btn");
  const langToggleBtns = document.querySelectorAll(".lang-toggle-btn");
  const docsContentEn = document.getElementById("docs-content-en");
  const docsContentBn = document.getElementById("docs-content-bn");

  // Open documentation panel
  function openDocsPanel() {
    docsOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Close documentation panel
  function closeDocsPanel() {
    docsOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Switch language
  function switchLanguage(lang) {
    // Update toggle buttons
    langToggleBtns.forEach((btn) => {
      if (btn.dataset.lang === lang) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Show/hide content
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

  // Close on overlay click
  if (docsOverlay) {
    docsOverlay.addEventListener("click", (e) => {
      if (e.target === docsOverlay) {
        closeDocsPanel();
      }
    });
  }

  // Language toggle
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

  // Initialize with English
  switchLanguage("en");
})();
