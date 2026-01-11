document.addEventListener("DOMContentLoaded", () => {
  // ============ 1. GLOBAL VARIABLES ============
  const selectAllCheckbox = document.getElementById("selectAll");
  const bulkBar = document.getElementById("bulkActionBar");
  const selectedCountSpan = document.getElementById("selectedCount");
  const bulkIdsInputs = document.querySelectorAll(".bulk-ids");

  const limitSelect = document.getElementById("limit");
  const limitForm = document.getElementById("limitForm");
  const categorySelect = document.getElementById("category");
  const categoryForm = document.getElementById("categoryForm");

  // ============ 2. HELPER FUNCTIONS ============

  // Helper: Update the Bulk Bar UI based on checked boxes
  function updateBulkBar() {
    const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
    const count = checkedBoxes.length;

    // A. Update Counter Text
    if (selectedCountSpan) selectedCountSpan.textContent = count;

    // B. Handle Buttons & Inputs (Disable if 0 selected)
    const deleteBtn = document.querySelector("#bulkDeleteForm button");
    const moveBtn = document.querySelector("#bulkCatForm button");
    const qtyBtn = document.querySelector("#bulkQtyForm button");
    const inputs = document.querySelectorAll(".bulk-select, .bulk-input");

    const isDisabled = count === 0;

    if (deleteBtn) deleteBtn.disabled = isDisabled;
    if (moveBtn) moveBtn.disabled = isDisabled;
    if (qtyBtn) qtyBtn.disabled = isDisabled;

    // Disable inputs too so user can't type while 0 selected
    inputs.forEach((input) => (input.disabled = isDisabled));

    // C. Show/Hide Bar & Update Hidden IDs
    if (bulkBar) {
      if (count > 0) {
        bulkBar.classList.add("show");

        // Update Hidden Inputs in the Bulk Forms with IDs string (e.g., "1,5,9")
        const ids = Array.from(checkedBoxes)
          .map((cb) => cb.value)
          .join(",");
        bulkIdsInputs.forEach((input) => {
          input.value = ids;
        });
      } else {
        bulkBar.classList.remove("show");
      }
    }

    // D. Update "Select All" Checkbox State (Indeterminate logic)
    if (selectAllCheckbox) {
      const allCheckboxes = document.querySelectorAll(".item-checkbox");
      if (allCheckboxes.length > 0) {
        const allChecked = Array.from(allCheckboxes).every((cb) => cb.checked);
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = count > 0 && !allChecked;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    }
  }

  // Helper: Attach Listeners to dynamic elements (Checkboxes & Delete Buttons)
  // We call this on Load AND after Live Search updates the table.
  function attachDynamicListeners() {
    // A. Individual Delete Confirmation
    document.querySelectorAll(".delete-form").forEach((form) => {
      form.removeEventListener("submit", handleDeleteSubmit);
      form.addEventListener("submit", handleDeleteSubmit);
    });

    // B. Individual Checkboxes
    document.querySelectorAll(".item-checkbox").forEach((checkbox) => {
      // Remove old listener to avoid duplicates
      checkbox.removeEventListener("change", updateBulkBar);
      checkbox.addEventListener("change", updateBulkBar);
    });
  }

  // Handler for Single Delete Submit
  function handleDeleteSubmit(e) {
    const name = this.dataset.name || "this item";
    const ok = confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (!ok) {
      e.preventDefault();
      return;
    }

    // Visual Loading State
    const deleteBtn = this.querySelector('button[type="submit"]');
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
      deleteBtn.style.opacity = "0.6";
    }
  }

  // ============ 3. INITIALIZATION ============

  // Attach listeners immediately on page load
  attachDynamicListeners();

  // Initialize bulk bar state (in case browser cached checkbox state)
  updateBulkBar();

  // "Select All" Listener (Static)
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const itemCheckboxes = document.querySelectorAll(".item-checkbox");
      itemCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      updateBulkBar();
    });
  }

  // Auto-Submit Limit Selector (Items per page)
  if (limitSelect && limitForm) {
    limitSelect.addEventListener("change", () => limitForm.submit());
  }

  // Auto-Submit Category Filter
  if (categorySelect && categoryForm) {
    categorySelect.addEventListener("change", () => categoryForm.submit());
  }

  // ============ 4. BULK OPERATIONS LOGIC ============

  const getSelectedCount = () =>
    document.querySelectorAll(".item-checkbox:checked").length;

  // A. Confirm Category Move
  const bulkCatForm = document.getElementById("bulkCatForm");
  if (bulkCatForm) {
    bulkCatForm.addEventListener("submit", (e) => {
      const count = getSelectedCount();
      if (count === 0) {
        e.preventDefault();
        return;
      }

      const select = bulkCatForm.querySelector("select");
      const catName = select.options[select.selectedIndex].text;

      const ok = confirm(
        `Are you sure you want to move ${count} products to "${catName}"?`
      );
      if (!ok) e.preventDefault();
    });
  }

  // B. Confirm Quantity Update
  const bulkQtyForm = document.getElementById("bulkQtyForm");
  if (bulkQtyForm) {
    bulkQtyForm.addEventListener("submit", (e) => {
      const count = getSelectedCount();
      if (count === 0) {
        e.preventDefault();
        return;
      }

      const qtyInput = bulkQtyForm.querySelector("input[name='quantity']");
      const newQty = qtyInput.value;

      const ok = confirm(
        `Are you sure you want to set the quantity to "${newQty}" for ${count} products?`
      );
      if (!ok) e.preventDefault();
    });
  }

  // C. Confirm Bulk Delete
  const bulkDeleteForm = document.getElementById("bulkDeleteForm");
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener("submit", (e) => {
      const count = getSelectedCount();
      if (count === 0) {
        e.preventDefault();
        return;
      }

      const ok = confirm(
        `⚠️ WARNING: Are you sure you want to DELETE ${count} products?\n\nThis action cannot be undone.`
      );
      if (!ok) e.preventDefault();
    });
  }

  // ============ 5. LIVE SEARCH LOGIC ============

  const searchInput = document.getElementById("searchInput");
  // If searchInput doesn't exist by ID, try finding by class inside search form
  const inputEl = searchInput || document.querySelector(".search-input");

  const tableBody = document.querySelector(".products-table tbody");
  const paginationContainer = document.querySelector(".pagination-wrapper");
  let searchTimeout = null;

  if (inputEl) {
    inputEl.addEventListener("input", function (e) {
      const searchTerm = e.target.value;
      if (searchTimeout) clearTimeout(searchTimeout);

      // Debounce 500ms
      searchTimeout = setTimeout(() => performLiveSearch(searchTerm), 500);
    });
  }

  async function performLiveSearch(term) {
    try {
      // Build URL with current params to keep context
      const currentLimit = limitSelect ? limitSelect.value : 10;
      const currentCategory = categorySelect ? categorySelect.value : "";

      const url = `/products?search=${encodeURIComponent(
        term
      )}&limit=${currentLimit}&category=${encodeURIComponent(
        currentCategory
      )}&page=1`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      // Swap Table Body
      const newTableBody = doc.querySelector(".products-table tbody");
      if (newTableBody && tableBody) {
        tableBody.innerHTML = newTableBody.innerHTML;
      }

      // Swap Pagination
      const newPagination = doc.querySelector(".pagination-wrapper");
      if (paginationContainer) {
        paginationContainer.innerHTML = newPagination
          ? newPagination.innerHTML
          : "";
      }

      // CRITICAL: Re-attach listeners to the new elements (checkboxes/buttons)
      attachDynamicListeners();

      // Reset Bulk Bar (Selection is lost on table replace)
      if (bulkBar) bulkBar.classList.remove("show");
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    } catch (error) {
      console.error("Live search error:", error);
    }
  }
});
