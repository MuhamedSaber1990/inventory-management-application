document.addEventListener("DOMContentLoaded", () => {
  // ============ DELETE CONFIRMATION ============
  document.querySelectorAll(".delete-form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const name = this.dataset.name || "this item";
      const ok = confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      );

      if (!ok) {
        e.preventDefault();
        return;
      }

      // Add loading state to delete button
      const deleteBtn = this.querySelector('button[type="submit"]');
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = "Deleting...";
        deleteBtn.style.opacity = "0.6";
      }
    });
  });

  // ============ LIMIT SELECTOR AUTO-SUBMIT ============
  const limitSelect = document.getElementById("limit");
  const limitForm = document.getElementById("limitForm");

  if (limitSelect && limitForm) {
    limitSelect.addEventListener("change", () => {
      limitForm.submit();
    });
  }

  // ============ CATEGORY FILTER AUTO-SUBMIT ============
  const categorySelect = document.getElementById("category");
  const categoryForm = document.getElementById("categoryForm");

  if (categorySelect && categoryForm) {
    categorySelect.addEventListener("change", () => {
      categoryForm.submit();
    });
  }

  // ============ FORM LOADING STATES ============
  document.querySelectorAll("form").forEach((form) => {
    // Skip delete forms (already handled above)
    if (form.classList.contains("delete-form")) {
      return;
    }

    // Skip bulk forms (handled separately)
    if (form.classList.contains("inline-form")) {
      return;
    }

    form.addEventListener("submit", function (e) {
      const submitBtn = this.querySelector('button[type="submit"]');

      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Processing...";

        // Re-enable after 5 seconds as safety fallback
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 5000);
      }
    });
  });

  // ============ SEARCH FORM LOADING ============
  const searchForm = document.querySelector(".search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function () {
      const searchBtn = this.querySelector(".search-btn");
      if (searchBtn) {
        searchBtn.style.opacity = "0.5";
        searchBtn.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="spinner">
            <circle cx="12" cy="12" r="10" stroke-width="2" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
      }
    });
  }

  // ============ BULK DELETE OPERATIONS LOGIC ============
  const selectAll = document.getElementById("selectAll");
  const itemCheckboxes = document.querySelectorAll(".item-checkbox");
  const bulkBar = document.getElementById("bulkActionBar");
  const selectedCountSpan = document.getElementById("selectedCount");
  const bulkIdsInput = document.getElementById("bulkIdsInput");

  function updateBulkUI() {
    // 1. Get checked items
    const checked = Array.from(itemCheckboxes).filter((cb) => cb.checked);

    // 2. Create ID string "1,5,9"
    const ids = checked.map((cb) => cb.value).join(",");

    // 3. Put IDs into hidden input
    if (bulkIdsInput) {
      bulkIdsInput.value = ids;
    }

    // 4. Update selected count text
    if (selectedCountSpan) {
      selectedCountSpan.textContent = checked.length;
    }

    // 5. Show/Hide bulk action bar
    if (bulkBar) {
      if (checked.length > 0) {
        bulkBar.classList.add("visible");
      } else {
        bulkBar.classList.remove("visible");
      }
    }

    // 6. Update "Select All" checkbox state
    if (selectAll && itemCheckboxes.length > 0) {
      const allChecked = checked.length === itemCheckboxes.length;
      const someChecked =
        checked.length > 0 && checked.length < itemCheckboxes.length;

      selectAll.checked = allChecked;
      selectAll.indeterminate = someChecked;
    }
  }

  // Handle "Select All" checkbox
  if (selectAll) {
    selectAll.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      itemCheckboxes.forEach((cb) => {
        cb.checked = isChecked;
      });
      updateBulkUI();
    });
  }

  // Handle individual checkboxes
  itemCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      updateBulkUI();
    });
  });

  // ============ BULK DELETE FORM CONFIRMATION ============
  const bulkDeleteForm = document.getElementById("bulkDeleteForm");
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener("submit", function (e) {
      const idsInput = this.querySelector("#bulkIdsInput");
      const ids = idsInput ? idsInput.value.split(",").filter((id) => id) : [];

      if (ids.length === 0) {
        e.preventDefault();
        alert("No items selected!");
        return;
      }

      const ok = confirm(
        `Are you sure you want to delete ${ids.length} selected item(s)? This action cannot be undone.`
      );

      if (!ok) {
        e.preventDefault();
        return;
      }

      // Add loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Deleting...";
        submitBtn.style.opacity = "0.6";
      }
    });
  }

  // ============ INITIAL STATE ============
  // Initialize bulk UI on page load (in case of browser back button)
  updateBulkUI();
});
