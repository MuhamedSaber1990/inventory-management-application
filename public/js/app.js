document.addEventListener("DOMContentLoaded", () => {
  // ============ 1. GLOBAL SELECTORS ============
  const selectAllCheckbox = document.getElementById("selectAll");
  const bulkBar = document.getElementById("bulkActionBar");
  const selectedCountSpan = document.getElementById("selectedCount");
  const bulkIdsInputs = document.querySelectorAll(".bulk-ids");

  // Filter & Search Elements
  const limitSelect = document.getElementById("limit");
  const limitForm = document.getElementById("limitForm");
  const categorySelect = document.getElementById("category"); // Used in Add/Edit Product AND Filter
  const filterCategorySelect = document.querySelector(
    ".category-filter select",
  );
  const filterForm = document.getElementById("categoryForm");
  const searchInput = document.getElementById("searchInput");

  // AI Elements
  const aiSearchBtn = document.getElementById("aiSearchBtn"); // Products Page
  const aiDescBtn = document.getElementById("aiBtn"); // Add/Edit Page
  const aiCatBtn = document.getElementById("aiCatBtn"); // Add/Edit Page

  // DOM Elements to update via AJAX
  const tableBody = document.querySelector(".products-table tbody");
  const mobileView = document.querySelector(".mobile-products-view");
  const paginationContainer = document.querySelector(".pagination-wrapper");

  // ============ 2. HELPER FUNCTIONS ============

  // Update bulk action bar visibility, count, and hidden inputs
  function updateBulkBar() {
    const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
    const count = checkedBoxes.length;

    // 1. Update Text
    if (selectedCountSpan) {
      selectedCountSpan.textContent = count;
    }

    // 2. Show/Hide Bar & Fill Data
    if (bulkBar) {
      if (count > 0) {
        bulkBar.classList.add("show");

        // Update all hidden ID inputs with comma-separated string
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

    // 3. Update "Select All" Indeterminate State
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

    // 4. Disable buttons if 0 selected (Safety)
    const bulkBtns = document.querySelectorAll(".bulk-btn, .bulk-btn-danger");
    bulkBtns.forEach((btn) => (btn.disabled = count === 0));
  }

  // Handle Individual Delete Confirmation
  function handleDeleteSubmit(e) {
    const name = this.dataset.name || "this item";
    const ok = confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    );

    if (!ok) {
      e.preventDefault();
      return;
    }

    // Add loading state
    const deleteBtn = this.querySelector('button[type="submit"]');
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
      deleteBtn.style.opacity = "0.6";
    }
  }

  // Attach listeners to dynamic elements (Checkboxes & Delete Forms)
  function attachDynamicListeners() {
    // Checkboxes
    document.querySelectorAll(".item-checkbox").forEach((checkbox) => {
      checkbox.removeEventListener("change", updateBulkBar);
      checkbox.addEventListener("change", updateBulkBar);
    });

    // Delete Forms
    document.querySelectorAll(".delete-form").forEach((form) => {
      form.removeEventListener("submit", handleDeleteSubmit);
      form.addEventListener("submit", handleDeleteSubmit);
    });
  }

  // ============ 3. INITIALIZATION & STATIC LISTENERS ============

  // Run on load
  attachDynamicListeners();
  updateBulkBar();

  // Auto-Submit Limit
  if (limitSelect && limitForm) {
    limitSelect.addEventListener("change", () => limitForm.submit());
  }

  // Auto-Submit Category Filter (Products Page)
  if (filterCategorySelect && filterForm) {
    filterCategorySelect.addEventListener("change", () => {
      // Reset to page 1 when filtering
      const pageInput = filterForm.querySelector('input[name="page"]');
      if (pageInput) pageInput.value = 1;
      filterForm.submit();
    });
  }

  // "Select All" Logic
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const itemCheckboxes = document.querySelectorAll(".item-checkbox");
      itemCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      updateBulkBar();
    });
  }

  // Filter Panel Toggle
  const filterToggleBtn = document.querySelector(
    '[onclick*="advancedFilters"]',
  );
  const filterPanel = document.getElementById("advancedFilters");

  if (filterToggleBtn && filterPanel) {
    filterToggleBtn.removeAttribute("onclick"); // Clean inline JS
    filterToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      filterPanel.classList.toggle("show");
    });
  }

  // ============ 4. BULK CONFIRMATION LOGIC ============

  const getSelectedCount = () =>
    document.querySelectorAll(".item-checkbox:checked").length;

  // Confirm Category Move
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
        `Are you sure you want to move ${count} products to "${catName}"?`,
      );
      if (!ok) e.preventDefault();
    });
  }

  // Confirm Quantity Update
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
        `Are you sure you want to set the quantity to "${newQty}" for ${count} products?`,
      );
      if (!ok) e.preventDefault();
    });
  }

  // Confirm Bulk Delete
  const bulkDeleteForm = document.getElementById("bulkDeleteForm");
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener("submit", (e) => {
      const count = getSelectedCount();
      if (count === 0) {
        e.preventDefault();
        return;
      }

      const ok = confirm(
        `⚠️ WARNING: Are you sure you want to DELETE ${count} products?\n\nThis action cannot be undone.`,
      );
      if (!ok) e.preventDefault();
    });
  }

  // ============ 5. LIVE SEARCH LOGIC ============
  let searchTimeout = null;

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value;
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => performLiveSearch(searchTerm), 400);
    });
  }

  async function performLiveSearch(term) {
    try {
      const params = new URLSearchParams();
      params.append("search", term);
      params.append("page", "1");

      if (limitSelect) params.append("limit", limitSelect.value);
      if (filterCategorySelect)
        params.append("category", filterCategorySelect.value);

      // Add Advanced Filters if present
      const advForm = document.querySelector(".filter-grid");
      if (advForm) {
        const formData = new FormData(advForm);
        for (const [key, value] of formData.entries()) {
          if (
            !["search", "limit", "category"].includes(key) &&
            value.trim() !== ""
          ) {
            params.append(key, value);
          }
        }
      }

      const url = `/products?${params.toString()}`;

      if (tableBody) tableBody.style.opacity = "0.5";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const newTableBody = doc.querySelector(".products-table tbody");
      const newPagination = doc.querySelector(".pagination-wrapper");
      const newNoProducts = doc.querySelector(".no-products");

      if (tableBody) {
        if (newTableBody) {
          tableBody.innerHTML = newTableBody.innerHTML;
        } else if (newNoProducts) {
          tableBody.innerHTML = "";
        }
        tableBody.style.opacity = "1";
      }

      if (paginationContainer) {
        paginationContainer.innerHTML = newPagination
          ? newPagination.innerHTML
          : "";
      }

      // CRITICAL: Re-attach listeners because we replaced the HTML
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
    }
  }

  // ============ 6. AI DESCRIPTION GENERATOR ============
  if (aiDescBtn) {
    const nameInput = document.getElementById("name");
    const descInput = document.getElementById("description");
    // Reuse categorySelect from global selector

    aiDescBtn.addEventListener("click", async () => {
      const productName = nameInput.value;

      if (!productName) {
        alert("Please enter a Product Name first!");
        nameInput.focus();
        return;
      }

      let categoryName = "General";
      if (categorySelect && categorySelect.selectedIndex >= 0) {
        categoryName =
          categorySelect.options[categorySelect.selectedIndex].text;
      }

      const originalText = aiDescBtn.innerHTML;
      aiDescBtn.disabled = true;
      aiDescBtn.innerHTML = `Generating...`;

      try {
        const response = await fetch("/api/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName, category: categoryName }),
        });

        const data = await response.json();

        if (data.success) {
          descInput.value = data.description;
          descInput.style.borderColor = "#6366f1";
          setTimeout(() => (descInput.style.borderColor = ""), 1000);
        } else {
          alert("AI Error: " + data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to connect to AI service.");
      } finally {
        aiDescBtn.disabled = false;
        aiDescBtn.innerHTML = originalText;
      }
    });
  }

  if (aiCatBtn) {
    // Select elements specifically for this action
    const nameInput = document.getElementById("name");
    const catSelect = document.getElementById("category");

    aiCatBtn.addEventListener("click", async () => {
      const productName = nameInput.value;
      console.log("Requesting category for:", productName);

      if (!productName) {
        alert("Please enter a Product Name first!");
        nameInput.focus();
        return;
      }

      const originalText = aiCatBtn.innerHTML;
      aiCatBtn.disabled = true;
      aiCatBtn.innerHTML = `Thinking...`;
      aiCatBtn.style.cursor = "wait";

      try {
        const response = await fetch("/api/suggest-category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName }),
        });

        const data = await response.json();
        console.log("AI Response:", data);

        if (data.success && data.categoryId) {
          // Update Dropdown
          catSelect.value = data.categoryId;

          // Visual Feedback
          catSelect.style.borderColor = "#4ade80";
          catSelect.style.boxShadow = "0 0 0 4px rgba(74, 222, 128, 0.2)";
          setTimeout(() => {
            catSelect.style.borderColor = "";
            catSelect.style.boxShadow = "";
          }, 1500);
        } else {
          alert("Could not determine category. Please select manually.");
        }
      } catch (error) {
        console.error("AI Category Error:", error);
        alert("Failed to suggest category.");
      } finally {
        aiCatBtn.disabled = false;
        aiCatBtn.innerHTML = originalText;
        aiCatBtn.style.cursor = "pointer";
      }
    });
  }

  // ============ 8. AI SMART SEARCH ============
  if (aiSearchBtn && searchInput) {
    aiSearchBtn.addEventListener("click", async () => {
      const query = searchInput.value.trim();

      if (!query) {
        alert(
          "Please type a request first.\nExample: 'Show me low stock electronics under $50'",
        );
        return;
      }

      const originalText = aiSearchBtn.innerHTML;
      aiSearchBtn.disabled = true;
      aiSearchBtn.innerHTML = `Running...`;
      document.body.style.cursor = "wait";

      try {
        const response = await fetch("/api/search-natural", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.success) {
          const params = new URLSearchParams(data.filters);
          if (limitSelect) params.append("limit", limitSelect.value);
          window.location.href = `/products?${params.toString()}`;
        } else {
          console.error("AI Error:", data.error);
          alert("Could not understand query. Try being more specific.");
        }
      } catch (error) {
        console.error(error);
        alert("AI Search failed.");
      } finally {
        aiSearchBtn.disabled = false;
        aiSearchBtn.innerHTML = originalText;
        document.body.style.cursor = "default";
      }
    });
  }
});
