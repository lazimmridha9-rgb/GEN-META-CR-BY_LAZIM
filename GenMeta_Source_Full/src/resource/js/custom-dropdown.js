// Enhanced Custom Dropdown Functionality with Keyboard Navigation
function initializeCustomDropdowns() {
  const dropdowns = document.querySelectorAll(".custom-dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".dropdown-menu");
    const items = dropdown.querySelectorAll(".dropdown-item-model");
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    const selectedDiv = dropdown.querySelector(".dropdown-selected");

    if (!toggle || !menu || !items.length || !hiddenInput || !selectedDiv)
      return;

    let currentFocusIndex = -1;

    // Toggle dropdown
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close other dropdowns
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove("open");
        }
      });

      dropdown.classList.toggle("open");

      if (dropdown.classList.contains("open")) {
        // Focus on selected item or first item
        const selectedItem = dropdown.querySelector(
          ".dropdown-item-model.selected"
        );
        currentFocusIndex = selectedItem
          ? Array.from(items).indexOf(selectedItem)
          : 0;
        updateKeyboardFocus();
      }
    });

    // Keyboard navigation
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
          currentFocusIndex = Math.min(currentFocusIndex + 1, items.length - 1);
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

    function updateKeyboardFocus() {
      items.forEach((item, index) => {
        item.classList.toggle("keyboard-focused", index === currentFocusIndex);
      });
    }

    function selectItem(item) {
      const value = item.dataset.value;
      const title = item.querySelector(".dropdown-title").textContent;
      const subtitle = item.querySelector(".dropdown-subtitle").textContent;

      // Update selected state
      items.forEach((i) => i.classList.remove("selected"));
      item.classList.add("selected");

      // Update toggle display
      selectedDiv.querySelector(".dropdown-title").textContent = title;
      selectedDiv.querySelector(".dropdown-subtitle").textContent = subtitle;

      // Update hidden input
      hiddenInput.value = value;

      // Trigger change event for compatibility with existing code
      const changeEvent = new Event("change", { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);

      // Close dropdown
      dropdown.classList.remove("open");
      toggle.focus();
    }

    // Handle item selection
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

  // Global escape key handler
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
