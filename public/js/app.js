document.addEventListener("DOMContentLoaded", () => {
  // Delete confirmation
  document.querySelectorAll(".delete-form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const name = this.dataset.name || "this product";
      const ok = confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      );
      if (!ok) {
        e.preventDefault();
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
});
