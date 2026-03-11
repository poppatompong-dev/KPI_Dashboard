/* =============================================
   Director Dashboard Controller
   Level 2: Department Director View
   ============================================= */

const Director = (() => {
  let currentDept = '';
  let currentMonth = Math.min(new Date().getMonth() + 1, 6);

  function init() {
    // Get dept from URL
    const params = new URLSearchParams(window.location.search);
    currentDept = params.get('dept') || DataPlatform.DEPARTMENTS[0].name;

    setupDeptSelector();
    setupFilters();
    setupNav();
    loadDashboard();
  }

  function setupDeptSelector() {
    const sel = document.getElementById('deptSelector');
    if (!sel) return;
    sel.innerHTML = '';
    DataPlatform.DEPARTMENTS.forEach(d => {
      const o = document.createElement('option');
      o.value = d.name; o.textContent = d.name;
      if (d.name === currentDept) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => {
      currentDept = sel.value;
      window.history.replaceState(null, '', `director.html?dept=${encodeURIComponent(currentDept)}`);
      loadDashboard();
    });

    // Update header
    const title = document.getElementById('deptTitle');
    if (title) title.textContent = currentDept;
  }

  function setupFilters() {
    const monthSel = document.getElementById('filterMonth');
    if (monthSel) {
      const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      monthSel.innerHTML = thaiMonths.map((m, i) =>
        `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${m}</option>`
      ).join('');
      monthSel.addEventListener('change', () => { currentMonth = parseInt(monthSel.value); loadDashboard(); });
    }
  }

  function setupNav() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
  }

  function loadDashboard() {
    showLoading(true);
    // Update title
    const title = document.getElementById('deptTitle');
    if (title) title.textContent = currentDept;

    setTimeout(() => {
      const allResults = DataPlatform.generateMonthlyResults();
      const deptKpis = DataPlatform.getDeptKpis(currentDept, currentMonth);
      const summary = ScoringEngine.calculateDashboardSummary(deptKpis);

      // AI insights
      const deptResults = allResults.filter(r =>
        deptKpis.some(k => k.kpi_id === r.kpi_id)
      );
      const insights = AIEngine.generateDirectorInsights(deptKpis, deptResults, currentDept);
      const riskKpis = AIEngine.detectRiskKPIs(deptKpis, deptResults);

      // Trend data for this department
      const trendData = buildDeptTrend(currentDept);

      renderAll({ summary, deptKpis, insights, riskKpis, trendData, allResults: deptResults });
      showLoading(false);
    }, 300);
  }

  function buildDeptTrend(dept) {
    const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'];
    const labels = [], actuals = [], targets = [];
    for (let m = 1; m <= 6; m++) {
      const kpis = DataPlatform.getDeptKpis(dept, m);
      if (kpis.length === 0) continue;
      labels.push(thaiMonths[m - 1]);
      const avg = kpis.reduce((s, k) => s + (k.score || 0), 0) / kpis.length;
      actuals.push(Math.round(avg * 10) / 10);
      targets.push(100);
    }
    return { labels, actual: actuals, target: targets };
  }

  function renderAll(data) {
    renderSummary(data.summary, data.deptKpis);
    renderInsights(data.insights);
    renderRiskAlerts(data.riskKpis);
    Charts.renderTrendChart('deptTrendChart', data.trendData);
    Charts.renderStatusChart('deptStatusChart', {
      success: data.summary.success_kpi,
      risk: data.summary.risk_kpi,
      failed: data.summary.failed_kpi
    });
    renderKpiTable(data.deptKpis, data.allResults);
    renderTopBottom(data.deptKpis);
  }

  function renderSummary(s, kpis) {
    const el = document.getElementById('deptSummaryCards');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card stat-card--score">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">คะแนนสำนัก/กอง</div><div class="stat-card__value">${s.overall_score}<small>%</small></div></div>
      </div>
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">KPI ทั้งหมด</div><div class="stat-card__value">${s.total_kpi}</div></div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">สำเร็จ</div><div class="stat-card__value">${s.success_kpi}</div></div>
      </div>
      <div class="stat-card stat-card--risk">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">เฝ้าระวัง</div><div class="stat-card__value">${s.risk_kpi}</div></div>
      </div>
      <div class="stat-card stat-card--failed">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">ต้องปรับปรุง</div><div class="stat-card__value">${s.failed_kpi}</div></div>
      </div>
    `;
  }

  function renderInsights(insights) {
    const el = document.getElementById('directorInsights');
    if (!el) return;
    el.innerHTML = insights.map(ins => {
      const pc = ins.priority === 'danger' ? 'insight--danger' : ins.priority === 'warning' ? 'insight--warning' : ins.priority === 'success' ? 'insight--success' : 'insight--info';
      return `<div class="insight-card ${pc}"><div class="insight-card__icon">${ins.icon}</div><div class="insight-card__body"><div class="insight-card__title">${ins.title}</div><div class="insight-card__text">${ins.text}</div></div></div>`;
    }).join('');
  }

  function renderRiskAlerts(riskKpis) {
    const el = document.getElementById('directorRiskAlerts');
    if (!el) return;
    if (riskKpis.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--clr-neutral-400);font-size:0.85rem;">✅ ไม่มี KPI ที่ต้องเฝ้าระวัง</div>';
      return;
    }
    el.innerHTML = riskKpis.map(r => {
      const ti = AIEngine.getTrendIndicator(r.trend);
      return `
        <div class="risk-alert-item">
          <div class="risk-alert-item__header">
            <span style="font-size:0.8rem;font-weight:500;">${r.kpi_name}</span>
            <span class="badge badge--${r.risk_level === 'critical' ? 'red' : 'yellow'}"><span class="badge__dot"></span>${Math.round(r.risk_probability * 100)}%</span>
          </div>
          <div style="font-size:0.7rem;color:var(--clr-neutral-500);margin-top:0.2rem;">${ti.icon} ${ti.label} | คะแนน: ${r.current_score}%</div>
          <div style="font-size:0.65rem;color:var(--clr-neutral-400);margin-top:0.2rem;">${r.factors.join(' · ')}</div>
        </div>`;
    }).join('');
  }

  function renderKpiTable(kpis, allResults) {
    const tbody = document.getElementById('directorKpiTable');
    if (!tbody) return;

    tbody.innerHTML = kpis.map(kpi => {
      // Calculate trend from historical data
      const history = allResults
        .filter(r => r.kpi_id === kpi.kpi_id)
        .sort((a, b) => a.month - b.month)
        .map(r => {
          const s = ScoringEngine.calculateKpiScore(kpi.target_value, r.actual_value, kpi.weight, kpi.calculation_type);
          return s.score;
        });
      const trendResult = history.length >= 2 ? AIEngine.linearRegression(history) : { trend: 'stable' };
      const ti = AIEngine.getTrendIndicator(trendResult.trend);

      const badgeClass = kpi.statusColor === 'green' ? 'badge--green' : kpi.statusColor === 'yellow' ? 'badge--yellow' : 'badge--red';
      const progClass = kpi.statusColor === 'green' ? 'progress-bar__fill--green' : kpi.statusColor === 'yellow' ? 'progress-bar__fill--yellow' : 'progress-bar__fill--red';

      return `
        <tr>
          <td class="kpi-name">${kpi.kpi_name}</td>
          <td class="text-right">${kpi.target_value != null ? kpi.target_value.toLocaleString() : '-'} ${kpi.unit}</td>
          <td class="text-right" style="font-weight:600">${kpi.actual_value != null ? kpi.actual_value.toLocaleString() : '-'} ${kpi.unit}</td>
          <td><div class="progress-bar"><span class="progress-bar__value">${kpi.score}%</span><div class="progress-bar__track"><div class="progress-bar__fill ${progClass}" style="width:${Math.min(kpi.percent, 100)}%"></div></div></div></td>
          <td class="text-center"><span class="badge ${badgeClass}"><span class="badge__dot"></span>${kpi.status}</span></td>
          <td class="text-center" style="font-size:1.1rem;color:${ti.color === 'green' ? 'var(--clr-success-500)' : ti.color === 'red' ? 'var(--clr-danger-500)' : 'var(--clr-neutral-400)'}" title="${ti.label}">${ti.icon}</td>
        </tr>`;
    }).join('');
  }

  function renderTopBottom(kpis) {
    const sorted = [...kpis].sort((a, b) => (b.score || 0) - (a.score || 0));
    const topEl = document.getElementById('directorTopKpis');
    const bottomEl = document.getElementById('directorBottomKpis');

    const renderList = (items, el, color) => {
      if (!el) return;
      el.innerHTML = items.map((k, i) => `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;${i < items.length - 1 ? 'border-bottom:1px solid var(--clr-neutral-100);' : ''}">
          <span style="font-size:0.7rem;font-weight:600;color:${color};width:1.2rem;">#${i + 1}</span>
          <div style="flex:1;font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.kpi_name}</div>
          <span style="font-size:0.8rem;font-weight:700;color:${color}">${k.score}%</span>
        </div>`).join('');
    };

    renderList(sorted.slice(0, 3), topEl, 'var(--clr-success-500)');
    renderList(sorted.slice(-3).reverse(), bottomEl, 'var(--clr-danger-500)');
  }

  function showLoading(v) {
    const o = document.getElementById('loadingOverlay');
    if (o) o.classList.toggle('loading-overlay--visible', v);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Director.init);
