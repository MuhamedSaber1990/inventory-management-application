document.addEventListener("DOMContentLoaded", () => {
  // ============ 1. CHART DATA SETUP ============

  if (typeof Chart === "undefined") {
    console.error("Chart.js library not loaded!");
    return;
  }

  const chartDataScript = document.getElementById("chart-data");

  if (!chartDataScript) {
    console.error("Chart data script tag not found!");
    return;
  }

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

  // ============ 2. RENDER CHARTS ============

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
                ticks: { color: "#9ca3af", stepSize: 1 },
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
                  font: { size: 11 },
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

  // ============ 3. AI INSIGHTS GENERATOR (NEW) ============

  const aiResult = document.getElementById("aiResult");
  const aiLoading = document.getElementById("aiLoading");

  // Only run if the AI section exists in the HTML
  if (aiResult && aiLoading) {
    // 1. Gather Stats from DOM (To avoid passing complex objects from backend)
    const totalItems = document
      .querySelector(".stat-card:nth-child(1) .stat-value")
      ?.innerText.trim();
    const totalValue = document
      .querySelector(".stat-card.money .stat-value")
      ?.innerText.trim();
    const lowStock = document
      .querySelector(".stat-card.alert .stat-value")
      ?.innerText.trim();

    const payload = {
      stats: {
        total_items: totalItems || "0",
        total_value: totalValue || "0",
        low_stock_count: lowStock || "0",
      },
      categoryData: pieData, // Use the data we parsed earlier
      trendData: lineData, // Use the data we parsed earlier
    };

    // 2. Fetch AI Insights
    fetch("/api/dashboard-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          aiLoading.style.display = "none";
          aiResult.style.display = "block";

          // 3. Safe Parsing (Convert HTML string to DOM nodes)
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.insights, "text/html");
          const listItems = doc.body.childNodes;

          // Clear and Append
          aiResult.textContent = "";
          Array.from(listItems).forEach((node) => {
            aiResult.appendChild(node);
          });
        } else {
          aiLoading.innerHTML = `<span style="color:#f87171">Unable to generate insights at this time.</span>`;
        }
      })
      .catch((err) => {
        console.error("AI Insights Failed:", err);
        aiLoading.style.display = "none";
      });
  }

  // ============ 4. HELPERS ============

  function displayEmptyState(canvas, message) {
    const parent = canvas.parentElement;
    canvas.style.display = "none";
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 200px; color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 20px;
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
