/* =============================================
   Chart.js Configurations & Renderers
   Municipal KPI Dashboard
   ============================================= */

const Charts = (() => {
  // Store chart instances for cleanup
  let trendChart = null;
  let statusChart = null;
  let deptChart = null;

  // Thai month labels
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                       'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  // Color palette
  const COLORS = {
    primary:    '#2563eb',
    primaryBg:  'rgba(37, 99, 235, 0.08)',
    accent:     '#06b6d4',
    accentBg:   'rgba(6, 182, 212, 0.08)',
    success:    '#10b981',
    warning:    '#f59e0b',
    danger:     '#ef4444',
    slate:      '#94a3b8',
    gridLine:   '#f1f5f9',
    purple:     '#8b5cf6',
    purpleBg:   'rgba(139, 92, 246, 0.08)'
  };

  // Common font config
  const fontConfig = {
    family: "'Prompt', sans-serif",
    size: 12
  };

  /**
   * Destroy a chart instance safely
   */
  function destroyChart(chartInstance) {
    if (chartInstance) {
      chartInstance.destroy();
    }
    return null;
  }

  /**
   * Render Performance Trend Line Chart
   * @param {string} canvasId
   * @param {object} trendData - { labels:[], target:[], actual:[] }
   */
  function renderTrendChart(canvasId, trendData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    trendChart = destroyChart(trendChart);

    const labels = trendData.labels || THAI_MONTHS;
    const targetData = trendData.target || [];
    const actualData = trendData.actual || [];

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'ผลงานจริง',
            data: actualData,
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryBg,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: COLORS.primary,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'เป้าหมาย',
            data: targetData,
            borderColor: COLORS.slate,
            borderWidth: 2,
            borderDash: [6, 4],
            tension: 0.1,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: fontConfig,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { ...fontConfig, weight: '600' },
            bodyFont: fontConfig,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0,
            max: 120,
            grid: { color: COLORS.gridLine, drawBorder: false },
            ticks: {
              font: fontConfig,
              callback: v => v + '%',
              stepSize: 20
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: fontConfig }
          }
        }
      }
    });

    return trendChart;
  }

  /**
   * Render KPI Status Doughnut Chart
   * @param {string} canvasId
   * @param {object} statusData - { success, risk, failed }
   */
  function renderStatusChart(canvasId, statusData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    statusChart = destroyChart(statusChart);

    const { success = 0, risk = 0, failed = 0 } = statusData;
    const total = success + risk + failed;

    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['บรรลุเป้าหมาย', 'เฝ้าระวัง', 'ต้องปรับปรุง'],
        datasets: [{
          data: [success, risk, failed],
          backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
          borderWidth: 0,
          hoverOffset: 6,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { ...fontConfig, weight: '600' },
            bodyFont: fontConfig,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: ctx => {
                const pct = total > 0 ? Math.round(ctx.parsed / total * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      },
      plugins: [{
        // Center text plugin
        id: 'centerText',
        beforeDraw(chart) {
          const { ctx: drawCtx, width, height } = chart;
          drawCtx.save();

          const centerX = width / 2;
          const centerY = height / 2;

          // Score number
          drawCtx.font = "bold 28px 'Prompt', sans-serif";
          drawCtx.fillStyle = '#171717';
          drawCtx.textAlign = 'center';
          drawCtx.textBaseline = 'middle';
          drawCtx.fillText(total, centerX, centerY - 8);

          // Label
          drawCtx.font = "400 12px 'Prompt', sans-serif";
          drawCtx.fillStyle = '#737373';
          drawCtx.fillText('ตัวชี้วัดทั้งหมด', centerX, centerY + 16);

          drawCtx.restore();
        }
      }]
    });

    // Update legend
    updateStatusLegend(statusData);

    return statusChart;
  }

  /**
   * Update the status chart legend HTML
   */
  function updateStatusLegend(statusData) {
    const legendEl = document.getElementById('chartLegend');
    if (!legendEl) return;

    legendEl.innerHTML = `
      <div class="chart-legend__item">
        <span class="chart-legend__dot" style="background:${COLORS.success}"></span>
        บรรลุเป้าหมาย (${statusData.success || 0})
      </div>
      <div class="chart-legend__item">
        <span class="chart-legend__dot" style="background:${COLORS.warning}"></span>
        เฝ้าระวัง (${statusData.risk || 0})
      </div>
      <div class="chart-legend__item">
        <span class="chart-legend__dot" style="background:${COLORS.danger}"></span>
        ต้องปรับปรุง (${statusData.failed || 0})
      </div>
    `;
  }

  /**
   * Render Department Performance Bar Chart
   * @param {string} canvasId
   * @param {Array} deptData - [{ department, score, total_kpi, success, risk, failed }]
   */
  function renderDeptChart(canvasId, deptData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    deptChart = destroyChart(deptChart);

    // Truncate long department names
    const labels = deptData.map(d => {
      const name = d.department || '';
      return name.length > 20 ? name.substring(0, 18) + '…' : name;
    });

    const scores = deptData.map(d => d.score || 0);

    // Gradient colors per bar based on score
    const barColors = scores.map(s => {
      if (s >= 100) return COLORS.success;
      if (s >= 80)  return COLORS.warning;
      return COLORS.danger;
    });

    deptChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'คะแนน (%)',
          data: scores,
          backgroundColor: barColors.map(c => c + '30'),
          borderColor: barColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { ...fontConfig, weight: '600' },
            bodyFont: fontConfig,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: ctx => deptData[ctx[0].dataIndex]?.department || '',
              label: ctx => {
                const d = deptData[ctx.dataIndex];
                return [
                  ` คะแนน: ${ctx.parsed.x}%`,
                  ` KPI ทั้งหมด: ${d.total_kpi}`,
                  ` สำเร็จ: ${d.success} | เฝ้าระวัง: ${d.risk} | ปรับปรุง: ${d.failed}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 120,
            grid: { color: COLORS.gridLine, drawBorder: false },
            ticks: {
              font: fontConfig,
              callback: v => v + '%',
              stepSize: 20
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { ...fontConfig, size: 11 },
              crossAlign: 'far'
            }
          }
        }
      }
    });

    return deptChart;
  }

  /**
   * Destroy all charts (cleanup)
   */
  function destroyAll() {
    trendChart  = destroyChart(trendChart);
    statusChart = destroyChart(statusChart);
    deptChart   = destroyChart(deptChart);
  }

  return {
    THAI_MONTHS,
    COLORS,
    renderTrendChart,
    renderStatusChart,
    renderDeptChart,
    destroyAll
  };
})();
