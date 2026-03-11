/* =============================================
   Executive Dashboard Controller
   Level 1: Mayor / CEO View
   ============================================= */

const Executive = (() => {
  let currentMonth = Math.min(new Date().getMonth() + 1, 6); // cap at 6 for demo

  function init() {
    setupFilters();
    setupNav();
    loadDashboard();
  }

  function setupFilters() {
    const yearSelect = document.getElementById('filterYear');
    if (yearSelect) {
      const yr = new Date().getFullYear() + 543;
      for (let y = yr; y >= yr - 3; y--) {
        const o = document.createElement('option');
        o.value = y; o.textContent = `ปี ${y}`;
        yearSelect.appendChild(o);
      }
    }

    const monthSelect = document.getElementById('filterMonth');
    if (monthSelect) {
      const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                          'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      thaiMonths.forEach((m, i) => {
        const o = document.createElement('option');
        o.value = i + 1; o.textContent = m;
        if (i + 1 === currentMonth) o.selected = true;
        monthSelect.appendChild(o);
      });
      monthSelect.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        loadDashboard();
      });
    }
  }

  function setupNav() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
  }

  function loadDashboard() {
    showLoading(true);
    setTimeout(() => {
      const data = DataPlatform.buildAnalysisPackage(currentMonth, 'all');
      renderAll(data);
      showLoading(false);
    }, 400);
  }

  function renderAll(data) {
    renderSummaryCards(data.summary);
    renderInsights(data.insights);
    Charts.renderTrendChart('trendChart', data.trendData);
    Charts.renderStatusChart('statusChart', {
      success: data.summary.success_kpi,
      risk: data.summary.risk_kpi,
      failed: data.summary.failed_kpi
    });
    renderDeptRanking(data.deptPerformance);
    renderRiskHeatmap(data.riskHeatmap);
    renderStrategyProgress(data.strategyProgress);
    renderRiskAlerts(data.riskKpis);
    renderTopBottom(data.kpiList);
  }

  function renderSummaryCards(s) {
    const el = document.getElementById('summaryCards');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">ตัวชี้วัดทั้งหมด</div><div class="stat-card__value">${s.total_kpi}<small> รายการ</small></div></div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">บรรลุเป้าหมาย</div><div class="stat-card__value">${s.success_kpi}<small> รายการ</small></div></div>
      </div>
      <div class="stat-card stat-card--risk">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">เฝ้าระวัง</div><div class="stat-card__value">${s.risk_kpi}<small> รายการ</small></div></div>
      </div>
      <div class="stat-card stat-card--failed">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">ต้องปรับปรุง</div><div class="stat-card__value">${s.failed_kpi}<small> รายการ</small></div></div>
      </div>
      <div class="stat-card stat-card--score">
        <div class="stat-card__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></div>
        <div class="stat-card__info"><div class="stat-card__label">คะแนนรวม</div><div class="stat-card__value">${s.overall_score}<small>%</small></div></div>
      </div>
    `;
  }

  function renderInsights(insights) {
    const el = document.getElementById('aiInsights');
    if (!el) return;
    el.innerHTML = insights.map(ins => {
      const priorityClass = ins.priority === 'danger' ? 'insight--danger'
        : ins.priority === 'warning' ? 'insight--warning'
        : ins.priority === 'success' ? 'insight--success' : 'insight--info';
      return `
        <div class="insight-card ${priorityClass}">
          <div class="insight-card__icon">${ins.icon}</div>
          <div class="insight-card__body">
            <div class="insight-card__title">${ins.title}</div>
            <div class="insight-card__text">${ins.text}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderDeptRanking(depts) {
    const el = document.getElementById('deptRanking');
    if (!el) return;
    el.innerHTML = depts.map((d, i) => {
      const riskBadge = d.risk_level === 'critical' ? '<span class="badge badge--red"><span class="badge__dot"></span>วิกฤต</span>'
        : d.risk_level === 'high' ? '<span class="badge badge--yellow"><span class="badge__dot"></span>เฝ้าระวัง</span>'
        : '<span class="badge badge--green"><span class="badge__dot"></span>ปกติ</span>';
      const barW = Math.min(d.score, 120);
      const barColor = d.score >= 100 ? 'var(--clr-success-500)' : d.score >= 80 ? 'var(--clr-warning-500)' : 'var(--clr-danger-500)';
      return `
        <tr class="dept-row" onclick="location.href='director.html?dept=${encodeURIComponent(d.department)}'">
          <td style="font-weight:600;color:var(--clr-neutral-500);width:2rem;">${i + 1}</td>
          <td class="kpi-name"><a href="director.html?dept=${encodeURIComponent(d.department)}" style="color:var(--clr-primary-500);font-weight:500;">${d.department}</a></td>
          <td class="text-center">${d.total_kpi}</td>
          <td class="text-center" style="color:var(--clr-success-500);font-weight:600;">${d.success}</td>
          <td class="text-center" style="color:var(--clr-warning-500);">${d.risk}</td>
          <td class="text-center" style="color:var(--clr-danger-500);">${d.failed}</td>
          <td>
            <div class="progress-bar"><span class="progress-bar__value">${d.score}%</span>
              <div class="progress-bar__track" style="width:6rem"><div class="progress-bar__fill" style="width:${barW * 100 / 120}%;background:${barColor}"></div></div>
            </div>
          </td>
          <td class="text-center">${riskBadge}</td>
        </tr>`;
    }).join('');
  }

  function renderRiskHeatmap(heatmapData) {
    const el = document.getElementById('riskHeatmap');
    if (!el) return;
    el.innerHTML = heatmapData.map(d => {
      const size = Math.max(2.5, Math.min(5, d.score / 20));
      return `
        <div class="heatmap-cell" style="background:${d.color}20;border:2px solid ${d.color};border-radius:var(--radius-md);padding:0.6rem;text-align:center;min-width:120px;">
          <div style="font-size:1.25rem;font-weight:700;color:${d.color}">${d.score}%</div>
          <div style="font-size:0.65rem;color:var(--clr-neutral-600);margin-top:0.2rem;line-height:1.3;">${d.department.length > 15 ? d.department.substring(0,13) + '…' : d.department}</div>
          <div style="margin-top:0.3rem;">
            <span style="font-size:0.6rem;background:${d.color};color:#fff;padding:0.1rem 0.4rem;border-radius:var(--radius-full);">${d.risk_level}</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderStrategyProgress(strategies) {
    const el = document.getElementById('strategyProgress');
    if (!el) return;
    const stratColors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    el.innerHTML = strategies.map((s, i) => {
      const color = stratColors[i % stratColors.length];
      const barW = Math.min(s.progress, 120);
      return `
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
            <span style="font-size:0.8rem;font-weight:500;color:var(--clr-neutral-700);">${s.strategy}</span>
            <span style="font-size:0.75rem;font-weight:600;color:${color}">${s.progress}%</span>
          </div>
          <div style="height:0.5rem;background:var(--clr-neutral-200);border-radius:var(--radius-full);overflow:hidden;">
            <div style="height:100%;width:${barW * 100 / 120}%;background:${color};border-radius:var(--radius-full);transition:width 0.6s ease;"></div>
          </div>
          <div style="font-size:0.65rem;color:var(--clr-neutral-400);margin-top:0.15rem;">${s.success}/${s.total_kpi} KPIs สำเร็จ</div>
        </div>`;
    }).join('');
  }

  function renderRiskAlerts(riskKpis) {
    const el = document.getElementById('riskAlerts');
    if (!el) return;
    if (riskKpis.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--clr-neutral-400);font-size:0.85rem;">✅ ไม่มีความเสี่ยงที่ต้องเฝ้าระวัง</div>';
      return;
    }
    el.innerHTML = riskKpis.slice(0, 8).map(r => {
      const trendInd = AIEngine.getTrendIndicator(r.trend);
      const riskPct = Math.round(r.risk_probability * 100);
      const riskColor = r.risk_level === 'critical' ? 'var(--clr-danger-500)' : 'var(--clr-warning-500)';
      return `
        <div class="risk-alert-item">
          <div class="risk-alert-item__header">
            <span style="font-size:0.8rem;font-weight:500;color:var(--clr-neutral-800);">${r.kpi_name}</span>
            <span style="font-size:0.7rem;font-weight:600;color:${riskColor};">${riskPct}%</span>
          </div>
          <div style="font-size:0.7rem;color:var(--clr-neutral-500);margin-top:0.15rem;">${r.department}</div>
          <div style="display:flex;gap:0.4rem;margin-top:0.3rem;flex-wrap:wrap;">
            <span style="font-size:0.6rem;background:${trendInd.color === 'red' ? 'var(--clr-danger-100)' : 'var(--clr-neutral-100)'};color:${trendInd.color === 'red' ? 'var(--clr-danger-700)' : 'var(--clr-neutral-600)'};padding:0.1rem 0.4rem;border-radius:var(--radius-full);">${trendInd.icon} ${trendInd.label}</span>
            <span style="font-size:0.6rem;background:var(--clr-neutral-100);padding:0.1rem 0.4rem;border-radius:var(--radius-full);color:var(--clr-neutral-600);">คะแนน: ${r.current_score}%</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderTopBottom(kpiList) {
    const sorted = [...kpiList].sort((a, b) => (b.score || 0) - (a.score || 0));
    const top5 = sorted.slice(0, 5);
    const bottom5 = sorted.slice(-5).reverse();

    const topEl = document.getElementById('topKpis');
    const bottomEl = document.getElementById('bottomKpis');

    if (topEl) {
      topEl.innerHTML = top5.map((k, i) => `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;${i < 4 ? 'border-bottom:1px solid var(--clr-neutral-100);' : ''}">
          <span style="font-size:0.7rem;font-weight:600;color:var(--clr-success-500);width:1.5rem;">#${i + 1}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;font-weight:500;color:var(--clr-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.kpi_name}</div>
            <div style="font-size:0.65rem;color:var(--clr-neutral-400);">${k.department}</div>
          </div>
          <span style="font-size:0.8rem;font-weight:700;color:var(--clr-success-500);">${k.score}%</span>
        </div>`).join('');
    }

    if (bottomEl) {
      bottomEl.innerHTML = bottom5.map((k, i) => `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;${i < 4 ? 'border-bottom:1px solid var(--clr-neutral-100);' : ''}">
          <span style="font-size:0.7rem;font-weight:600;color:var(--clr-danger-500);width:1.5rem;">#${i + 1}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;font-weight:500;color:var(--clr-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k.kpi_name}</div>
            <div style="font-size:0.65rem;color:var(--clr-neutral-400);">${k.department}</div>
          </div>
          <span style="font-size:0.8rem;font-weight:700;color:var(--clr-danger-500);">${k.score}%</span>
        </div>`).join('');
    }
  }

  function showLoading(v) {
    const o = document.getElementById('loadingOverlay');
    if (o) o.classList.toggle('loading-overlay--visible', v);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Executive.init);
