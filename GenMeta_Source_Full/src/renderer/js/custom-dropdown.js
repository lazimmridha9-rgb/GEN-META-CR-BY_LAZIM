/**
 * Enhanced Custom Dropdown Functionality with Keyboard Navigation
 * Provides accessible dropdown behavior with arrow key support.
 */

/**
 * Initialize all custom dropdowns on the page.
 */
function initializeCustomDropdowns() {
  const dropdowns = document.querySelectorAll(".custom-dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".dropdown-menu");
    const items = dropdown.querySelectorAll(".dropdown-item-model");
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    const selectedDiv = dropdown.querySelector(".dropdown-selected");

    // Skip if required elements are missing
    if (!toggle || !menu || !items.length || !hiddenInput || !selectedDiv) {
      return;
    }

    let currentFocusIndex = -1;

    /**
     * Update keyboard focus visual state on items.
     */
    function updateKeyboardFocus() {
      items.forEach((item, index) => {
        item.classList.toggle("keyboard-focused", index === currentFocusIndex);
      });
    }

    /**
     * Select a dropdown item and update all related UI/state.
     * @param {HTMLElement} item - The dropdown item to select.
     */
    function selectItem(item) {
      const value = item.dataset.value;
      const title = item.querySelector(".dropdown-title").textContent;
      const subtitle = item.querySelector(".dropdown-subtitle").textContent;

      // Update selected state on items
      items.forEach((i) => i.classList.remove("selected"));
      item.classList.add("selected");

      // Update the visible toggle display
      selectedDiv.querySelector(".dropdown-title").textContent = title;
      selectedDiv.querySelector(".dropdown-subtitle").textContent = subtitle;

      // Update hidden input value
      hiddenInput.value = value;

      // Dispatch change event for compatibility with existing code
      const changeEvent = new Event("change", { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);

      // Close dropdown and return focus to toggle
      dropdown.classList.remove("open");
      toggle.focus();
    }

    // Toggle dropdown open/close on click
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close other open dropdowns
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove("open");
        }
      });

      dropdown.classList.toggle("open");

      if (dropdown.classList.contains("open")) {
        // Focus on the currently selected item, or first item
        const selectedItem = dropdown.querySelector(
          ".dropdown-item-model.selected"
        );
        currentFocusIndex = selectedItem
          ? Array.from(items).indexOf(selectedItem)
          : 0;
        updateKeyboardFocus();
      }
    });

    // Keyboard navigation on the toggle element
    toggle.addEventListener("keydown", (e) => {
      if (!dropdown.classList.contains("open")) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          dropdown.classList.add("open");
          currentFocusIndex = 0;
          updateKeyboardFocus();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          currentFocusIndex = Math.min(
            currentFocusIndex + 1,
            items.length - 1
          );
          updateKeyboardFocus();
          break;
        case "ArrowUp":
          e.preventDefault();
          currentFocusIndex = Math.max(currentFocusIndex - 1, 0);
          updateKeyboardFocus();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (currentFocusIndex >= 0 && currentFocusIndex < items.length) {
            selectItem(items[currentFocusIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          dropdown.classList.remove("open");
          toggle.focus();
          break;
      }
    });

    // Handle item selection via click
    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectItem(item);
      });

      // Make items focusable for accessibility
      item.setAttribute("tabindex", "-1");
    });

    // Make toggle focusable
    toggle.setAttribute("tabindex", "0");
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-dropdown")) {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    }
  });

  // Global Escape key handler to close all dropdowns
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    }
  });
}

// Initialize custom dropdowns when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeCustomDropdowns();
});
