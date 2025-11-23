document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".delete-form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const name = this.dataset.name || "this product";

      const ok = confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      );

      if (!ok) {
        e.preventDefault(); // Stop form submit
      }
    });
  });
});
