document.addEventListener("DOMContentLoaded", () => {
  // ============ 1. SELECTORS ============
  const selectAllCheckbox = document.getElementById("selectAll");
  const bulkBar = document.getElementById("bulkActionBar");
  const selectedCountSpan = document.getElementById("selectedCount");
  const bulkIdsInputs = document.querySelectorAll(".bulk-ids");

  // Filter & Search Elements
  const limitSelect = document.getElementById("limit");
  const limitForm = document.getElementById("limitForm");
  const filterCategorySelect = document.getElementById("filterCategory");
  const filterForm = document.getElementById("filterForm");
  const searchInput = document.getElementById("searchInput");

  // Elements to update via AJAX
  const tableBody = document.querySelector(".products-table tbody");
  const mobileView = document.querySelector(".mobile-products-view");
  const paginationContainer = document.querySelector(".pagination-wrapper");

  // ============ 2. LISTENERS ============

  // Auto-Submit Limit
  if (limitSelect && limitForm) {
    limitSelect.addEventListener("change", () => limitForm.submit());
  }

  // Auto-Submit Category
  if (filterCategorySelect && filterForm) {
    filterCategorySelect.addEventListener("change", () => {
      const pageInput = filterForm.querySelector('input[name="page"]');
      if (pageInput) pageInput.value = 1;
      filterForm.submit();
    });
  }

  // Filter Panel Toggle (MOVED OUTSIDE selectAllCheckbox block)
  const filterToggleBtn = document.querySelector(
    '[onclick*="advancedFilters"]'
  );
  const filterPanel = document.getElementById("advancedFilters");

  if (filterToggleBtn && filterPanel) {
    // Remove inline onclick and use proper event listener
    filterToggleBtn.removeAttribute("onclick");

    filterToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      filterPanel.classList.toggle("show");

      // Optional: Update button text/icon to indicate state
      const isOpen = filterPanel.classList.contains("show");
      console.log("Filter panel toggled:", isOpen);
    });
  }

  // ============ 3. LIVE SEARCH LOGIC ============
  let searchTimeout = null;

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value;
      if (searchTimeout) clearTimeout(searchTimeout);

      // Debounce: Wait 400ms after typing stops
      searchTimeout = setTimeout(() => performLiveSearch(searchTerm), 400);
    });
  }

  async function performLiveSearch(term) {
    try {
      // 1. Base Params
      const params = new URLSearchParams();
      params.append("search", term);
      params.append("page", "1");

      // 2. Add Limit
      if (limitSelect) {
        params.append("limit", limitSelect.value);
      }

      // 3. Add Advanced Filters
      if (filterForm) {
        const formData = new FormData(filterForm);
        for (const [key, value] of formData.entries()) {
          if (
            !["search", "limit", "page"].includes(key) &&
            value.trim() !== ""
          ) {
            params.append(key, value);
          }
        }
      }

      // 4. Fetch
      const url = `/products?${params.toString()}`;

      if (tableBody) tableBody.style.opacity = "0.5";
      if (mobileView) mobileView.style.opacity = "0.5";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      // 5. Swap DOM Elements
      const newTableBody = doc.querySelector(".products-table tbody");
      const newMobileView = doc.querySelector(".mobile-products-view");
      const newPagination = doc.querySelector(".pagination-wrapper");
      const newNoProducts = doc.querySelector(".no-products");

      // Handle Table View
      if (tableBody) {
        if (newTableBody) {
          tableBody.innerHTML = newTableBody.innerHTML;
        } else if (newNoProducts) {
          tableBody.innerHTML = "";
        }
        tableBody.style.opacity = "1";
      }

      // Handle Mobile View
      if (mobileView) {
        if (newMobileView) {
          mobileView.innerHTML = newMobileView.innerHTML;
        } else {
          mobileView.innerHTML = "";
        }
        mobileView.style.opacity = "1";
      }

      // Handle Pagination
      if (paginationContainer) {
        paginationContainer.innerHTML = newPagination
          ? newPagination.innerHTML
          : "";
      }

      // 6. Re-Initialize Dynamic Listeners
      attachDynamicListeners();

      // Reset Bulk Bar
      if (bulkBar) bulkBar.classList.remove("show");
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    } catch (error) {
      console.error("Live search error:", error);
      if (tableBody) tableBody.style.opacity = "1";
      if (mobileView) mobileView.style.opacity = "1";
    }
  }

  // ============ 4. BULK & HELPER FUNCTIONS ============

  function attachDynamicListeners() {
    // Re-attach individual checkbox listeners
    document.querySelectorAll(".item-checkbox").forEach((checkbox) => {
      checkbox.removeEventListener("change", updateBulkBar);
      checkbox.addEventListener("change", updateBulkBar);
    });

    // Re-attach individual delete confirmations
    document.querySelectorAll(".delete-form").forEach((form) => {
      form.removeEventListener("submit", handleDeleteSubmit);
      form.addEventListener("submit", handleDeleteSubmit);
    });
  }

  function updateBulkBar() {
    // TODO: Add your updateBulkBar logic here
  }

  function handleDeleteSubmit(e) {
    // TODO: Add your delete submit logic here
  }

  // Initialize
  attachDynamicListeners();
  updateBulkBar();

  // Desktop Select All Logic
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const itemCheckboxes = document.querySelectorAll(
        ".desktop-table-view .item-checkbox"
      );
      itemCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      updateBulkBar();
    });
  }
});
