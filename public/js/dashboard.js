document.addEventListener("DOMContentLoaded", () => {
  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js library not loaded!");
    return;
  }

  // Get the data from the hidden script tag
  const chartDataScript = document.getElementById("chart-data");

  if (!chartDataScript) {
    console.error("Chart data script tag not found!");
    return;
  }

  // Parse the JSON
  let pieData = [];
  let lineData = [];

  try {
    const parsed = JSON.parse(chartDataScript.textContent.trim());
    pieData = Array.isArray(parsed.pieData) ? parsed.pieData : [];
    lineData = Array.isArray(parsed.lineData) ? parsed.lineData : [];
  } catch (e) {
    console.error("Error parsing chart data:", e);
    displayErrorMessage("Failed to parse chart data");
    return;
  }

  // Render Line Chart
  const lineCanvas = document.getElementById("lineChart");
  if (lineCanvas) {
    const hasLineData =
      lineData.length > 0 && lineData.some((d) => d.count > 0);

    if (!hasLineData) {
      displayEmptyState(lineCanvas, "No products added in the last 12 months");
    } else {
      try {
        new Chart(lineCanvas, {
          type: "line",
          data: {
            labels: lineData.map((d) => d.month),
            datasets: [
              {
                label: "New Products",
                data: lineData.map((d) => parseInt(d.count) || 0),
                borderColor: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#6366f1",
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                padding: 12,
                titleColor: "#e5e7eb",
                bodyColor: "#9ca3af",
                borderColor: "rgba(99, 102, 241, 0.3)",
                borderWidth: 1,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: "rgba(255, 255, 255, 0.05)" },
                ticks: {
                  color: "#9ca3af",
                  stepSize: 1,
                },
              },
              x: {
                grid: { display: false },
                ticks: { color: "#9ca3af" },
              },
            },
          },
        });
      } catch (error) {
        console.error("Error creating line chart:", error);
        displayEmptyState(lineCanvas, "Error loading chart");
      }
    }
  }

  // Render Pie Chart
  const pieCanvas = document.getElementById("pieChart");
  if (pieCanvas) {
    if (pieData.length === 0) {
      displayEmptyState(pieCanvas, "No products with categories");
    } else {
      try {
        const labels = pieData.map((d) => d.category);
        const values = pieData.map((d) => parseFloat(d.total_value));

        new Chart(pieCanvas, {
          type: "doughnut",
          data: {
            labels: labels,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  "#6366f1",
                  "#ec4899",
                  "#10b981",
                  "#f59e0b",
                  "#3b82f6",
                  "#8b5cf6",
                ],
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  color: "#9ca3af",
                  boxWidth: 12,
                  padding: 15,
                  font: {
                    size: 11,
                  },
                },
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                padding: 12,
                titleColor: "#e5e7eb",
                bodyColor: "#9ca3af",
                borderColor: "rgba(99, 102, 241, 0.3)",
                borderWidth: 1,
                callbacks: {
                  label: function (context) {
                    const label = context.label || "";
                    const value = context.parsed || 0;
                    return label + ": €" + value.toFixed(2);
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error("Error creating pie chart:", error);
        displayEmptyState(pieCanvas, "Error loading chart");
      }
    }
  }

  // Helper function to display empty state
  function displayEmptyState(canvas, message) {
    const parent = canvas.parentElement;

    // Hide canvas
    canvas.style.display = "none";

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #9ca3af;
      font-size: 0.9rem;
      text-align: center;
      padding: 20px;
    `;
    messageDiv.innerHTML = `
      <div style="font-size: 2rem; opacity: 0.3; margin-bottom: 12px;">📊</div>
      <div>${message}</div>
    `;
    parent.appendChild(messageDiv);
  }

  function displayErrorMessage(message) {
    console.error("Display error:", message);
    document.querySelectorAll("canvas").forEach((canvas) => {
      displayEmptyState(canvas, message);
    });
  }
});
