document.addEventListener("DOMContentLoaded", () => {
  // Delete confirmation with loading state
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

  // Limit Selector Auto-submit
  const limitSelect = document.getElementById("limit");
  const limitForm = document.getElementById("limitForm");

  if (limitSelect && limitForm) {
    limitSelect.addEventListener("change", () => {
      limitForm.submit();
    });
  }

  // Category Filter Auto-submit
  const categorySelect = document.getElementById("category");
  const categoryForm = document.getElementById("categoryForm");

  if (categorySelect && categoryForm) {
    categorySelect.addEventListener("change", () => {
      categoryForm.submit();
    });
  }

  // Add loading state to all form submissions
  document.querySelectorAll("form").forEach((form) => {
    // Skip delete forms (already handled above)
    if (form.classList.contains("delete-form")) {
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

  // Add loading indicator for search
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
});
