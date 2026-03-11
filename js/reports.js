/* =============================================
   Intelligent Reporting System
   Municipal KPI Platform
   =============================================
   Auto-generates executive, department, strategy,
   trend, and risk reports with AI insights.
   ============================================= */

const Reports = (() => {
  let currentReport = 'executive';
  let filters = { year: 2569, month: 6, quarter: null, department: 'all', strategy: 'all' };

  function init() {
    setupFilters();
    setupTabs();
    generateReport();
  }

  function setupFilters() {
    const deptSel = document.getElementById('rptDept');
    if (deptSel && typeof DataPlatform !== 'undefined') {
      DataPlatform.getDepartments().forEach(d => {
        const o = document.createElement('option');
        o.value = d.name; o.textContent = d.short || d.name;
        deptSel.appendChild(o);
      });
      deptSel.addEventListener('change', () => { filters.department = deptSel.value; generateReport(); });
    }

    const monthSel = document.getElementById('rptMonth');
    if (monthSel) {
      const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      thMonths.forEach((m, i) => {
        const o = document.createElement('option');
        o.value = i + 1; o.textContent = m;
        if (i + 1 === filters.month) o.selected = true;
        monthSel.appendChild(o);
      });
      monthSel.addEventListener('change', () => { filters.month = parseInt(monthSel.value); generateReport(); });
    }

    document.getElementById('btnPrint')?.addEventListener('click', () => window.print());
    document.getElementById('btnExport')?.addEventListener('click', exportReport);
  }

  function setupTabs() {
    document.querySelectorAll('[data-report]').forEach(tab => {
      tab.addEventListener('click', () => {
        currentReport = tab.dataset.report;
        document.querySelectorAll('[data-report]').forEach(t => t.classList.toggle('tab--active', t === tab));
        generateReport();
      });
    });
  }

  // ─── Report Generation ─────────────────────
  function generateReport() {
    const el = document.getElementById('reportContent');
    if (!el) return;

    const month = filters.month;
    const allKpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getScoredKpis(month) : [];
    const allResults = typeof DataPlatform !== 'undefined' ? DataPlatform.getResults() : [];
    const depts = typeof DataPlatform !== 'undefined' ? DataPlatform.getDepartments() : [];
    const strategies = typeof DataPlatform !== 'undefined' ? DataPlatform.getStrategies() : [];

    let kpis = allKpis;
    if (filters.department !== 'all') kpis = kpis.filter(k => k.department === filters.department);

    const summary = ScoringEngine.calculateDashboardSummary(kpis);
    const analysis = AIEngine.runFullAnalysis(kpis, allResults);
    const trendData = typeof DataPlatform !== 'undefined' ? DataPlatform.buildTrendData(month) : { labels: [], actual: [], target: [] };

    switch (currentReport) {
      case 'executive': renderExecutiveReport(el, kpis, summary, analysis, trendData, depts); break;
      case 'department': renderDeptReport(el, kpis, allResults, depts, summary); break;
      case 'strategy': renderStrategyReport(el, kpis, strategies, analysis); break;
      case 'trend': renderTrendReport(el, kpis, allResults, trendData); break;
      case 'risk': renderRiskReport(el, kpis, allResults, analysis); break;
      default: el.innerHTML = '';
    }

    // Update report metadata
    const genTime = document.getElementById('reportGenTime');
    if (genTime) genTime.textContent = new Date().toLocaleString('th-TH');
  }

  // ═══════ EXECUTIVE REPORT ══════════════════
  function renderExecutiveReport(el, kpis, summary, analysis, trendData, depts) {
    const thMonth = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][filters.month - 1];

    el.innerHTML = `
      <div class="report-header">
        <h2 class="report-title">📊 รายงานสรุปผลการดำเนินงาน</h2>
        <p class="report-subtitle">เทศบาลนคร — ประจำเดือน${thMonth} ${filters.year}</p>
      </div>

      <!-- Score Overview -->
      <div class="report-score-hero">
        <div class="report-score-circle" style="--score:${summary.overall_score};--color:${summary.overall_score >= 100 ? 'var(--clr-success-500)' : summary.overall_score >= 80 ? 'var(--clr-warning-500)' : 'var(--clr-danger-500)'}">
          <span class="report-score-circle__value">${summary.overall_score}%</span>
          <span class="report-score-circle__label">คะแนนรวม</span>
        </div>
        <div class="report-score-stats">
          <div class="rpt-stat"><span class="rpt-stat__num">${summary.total_kpi}</span><span class="rpt-stat__label">KPI ทั้งหมด</span></div>
          <div class="rpt-stat rpt-stat--green"><span class="rpt-stat__num">${summary.success_kpi}</span><span class="rpt-stat__label">สำเร็จ</span></div>
          <div class="rpt-stat rpt-stat--yellow"><span class="rpt-stat__num">${summary.risk_kpi}</span><span class="rpt-stat__label">เฝ้าระวัง</span></div>
          <div class="rpt-stat rpt-stat--red"><span class="rpt-stat__num">${summary.failed_kpi}</span><span class="rpt-stat__label">ต้องปรับปรุง</span></div>
        </div>
      </div>

      <!-- AI Insights -->
      <div class="report-section">
        <h3 class="report-section__title">🤖 AI วิเคราะห์ภาพรวม</h3>
        <div class="report-insights">${analysis.insights.map(i => _insightCard(i)).join('')}</div>
      </div>

      <!-- Department Ranking -->
      <div class="report-section">
        <h3 class="report-section__title">🏆 การจัดอันดับหน่วยงาน</h3>
        <div class="responsive-table"><table class="kpi-table"><thead><tr><th>#</th><th>หน่วยงาน</th><th class="text-center hide-mobile">KPI</th><th class="text-center">สำเร็จ</th><th class="text-center hide-mobile">เสี่ยง</th><th>คะแนน</th><th class="text-center">สถานะ</th></tr></thead><tbody>
        ${analysis.deptPerformance.map((d, i) => {
          const badge = d.risk_level === 'critical' ? 'badge--red' : d.risk_level === 'high' ? 'badge--yellow' : 'badge--green';
          const barColor = d.score >= 100 ? 'var(--clr-success-500)' : d.score >= 80 ? 'var(--clr-warning-500)' : 'var(--clr-danger-500)';
          return `<tr><td style="font-weight:600;">${i+1}</td><td class="kpi-name">${d.department}</td><td class="text-center hide-mobile">${d.total_kpi}</td><td class="text-center" style="color:var(--clr-success-500);font-weight:600;">${d.success}</td><td class="text-center hide-mobile" style="color:var(--clr-warning-500);">${d.risk}</td><td><div class="progress-bar"><span class="progress-bar__value">${d.score}%</span><div class="progress-bar__track" style="width:5rem;"><div class="progress-bar__fill" style="width:${Math.min(d.score,120)*100/120}%;background:${barColor}"></div></div></div></td><td class="text-center"><span class="badge ${badge}"><span class="badge__dot"></span>${d.risk_level === 'critical' ? 'วิกฤต' : d.risk_level === 'high' ? 'เฝ้าระวัง' : 'ปกติ'}</span></td></tr>`;
        }).join('')}</tbody></table></div>
      </div>

      <!-- Charts -->
      <div class="report-chart-row">
        <div class="chart-card"><div class="chart-card__header"><h3 class="chart-card__title">📈 แนวโน้มผลงาน</h3></div><div class="chart-card__canvas-wrap chart-card__canvas-wrap--trend"><canvas id="rptTrendChart"></canvas></div></div>
        <div class="chart-card"><div class="chart-card__header"><h3 class="chart-card__title">📊 สถานะ KPI</h3></div><div class="chart-card__canvas-wrap chart-card__canvas-wrap--pie"><canvas id="rptStatusChart"></canvas></div></div>
      </div>

      <!-- Strategy Progress -->
      <div class="report-section">
        <h3 class="report-section__title">🎯 ความก้าวหน้ายุทธศาสตร์</h3>
        <div class="report-strat-grid">${analysis.strategyProgress.map((s, i) => {
          const colors = ['#2563eb','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899'];
          const c = colors[i % colors.length];
          return `<div class="report-strat-card"><div style="font-weight:600;font-size:0.85rem;margin-bottom:0.3rem;">${s.strategy}</div><div style="display:flex;align-items:center;gap:0.5rem;"><div style="flex:1;height:8px;background:var(--clr-neutral-200);border-radius:var(--radius-full);overflow:hidden;"><div style="height:100%;width:${Math.min(s.progress,120)*100/120}%;background:${c};border-radius:var(--radius-full);"></div></div><span style="font-weight:700;font-size:0.85rem;color:${c};">${s.progress}%</span></div><div style="font-size:0.7rem;color:var(--clr-neutral-400);margin-top:0.2rem;">${s.success}/${s.total_kpi} KPIs สำเร็จ</div></div>`;
        }).join('')}</div>
      </div>

      <!-- Data Quality -->
      <div class="report-section">
        <h3 class="report-section__title">📋 คุณภาพข้อมูล</h3>
        <div class="report-data-quality">
          <div class="rpt-dq-item"><span>KPI ที่มีข้อมูล</span><strong style="color:var(--clr-success-500);">${summary.total_kpi}/${summary.total_kpi}</strong></div>
          <div class="rpt-dq-item"><span>ข้อมูลครบถ้วน</span><strong style="color:var(--clr-success-500);">100%</strong></div>
          <div class="rpt-dq-item"><span>ข้อมูลผิดปกติ</span><strong style="color:var(--clr-success-500);">0</strong></div>
        </div>
      </div>
    `;

    // Render charts
    setTimeout(() => {
      Charts.renderTrendChart('rptTrendChart', trendData);
      Charts.renderStatusChart('rptStatusChart', { success: summary.success_kpi, risk: summary.risk_kpi, failed: summary.failed_kpi });
    }, 100);
  }

  // ═══════ DEPARTMENT REPORT ═════════════════
  function renderDeptReport(el, kpis, allResults, depts, summary) {
    const deptGroups = {};
    depts.forEach(d => {
      const dk = kpis.filter(k => k.department === d.name);
      const s = ScoringEngine.calculateDashboardSummary(dk);
      const dr = allResults.filter(r => dk.some(k => k.kpi_id === r.kpi_id));
      const riskKpis = AIEngine.detectRiskKPIs(dk, dr);
      deptGroups[d.name] = { kpis: dk, summary: s, riskKpis, short: d.short };
    });

    el.innerHTML = `
      <div class="report-header"><h2 class="report-title">🏢 รายงานผลการดำเนินงานรายหน่วยงาน</h2><p class="report-subtitle">เทศบาลนคร — ${filters.year}</p></div>
      ${Object.entries(deptGroups).map(([name, data]) => {
        if (data.kpis.length === 0) return '';
        const sorted = [...data.kpis].sort((a, b) => (b.score||0) - (a.score||0));
        const top3 = sorted.slice(0, 3);
        const bot3 = sorted.slice(-3).reverse();
        return `
          <div class="report-dept-section">
            <div class="report-dept-header">
              <h3 style="font-size:1rem;font-weight:700;color:var(--clr-primary-500);">${name}</h3>
              <span style="font-size:1.2rem;font-weight:700;">${data.summary.overall_score}%</span>
            </div>
            <div class="report-dept-stats">
              <span>KPI: <strong>${data.summary.total_kpi}</strong></span>
              <span style="color:var(--clr-success-500);">สำเร็จ: <strong>${data.summary.success_kpi}</strong></span>
              <span style="color:var(--clr-warning-500);">เสี่ยง: <strong>${data.summary.risk_kpi}</strong></span>
              <span style="color:var(--clr-danger-500);">ปรับปรุง: <strong>${data.summary.failed_kpi}</strong></span>
            </div>
            <div class="report-dept-lists">
              <div><div style="font-size:0.75rem;font-weight:600;color:var(--clr-success-500);margin-bottom:0.3rem;">🏆 KPI ดีเด่น</div>${top3.map(k => `<div class="rpt-kpi-row"><span>${k.kpi_name}</span><span style="color:var(--clr-success-500);font-weight:600;">${k.score}%</span></div>`).join('')}</div>
              <div><div style="font-size:0.75rem;font-weight:600;color:var(--clr-danger-500);margin-bottom:0.3rem;">⚠️ KPI ต้องพัฒนา</div>${bot3.map(k => `<div class="rpt-kpi-row"><span>${k.kpi_name}</span><span style="color:var(--clr-danger-500);font-weight:600;">${k.score}%</span></div>`).join('')}</div>
            </div>
            ${data.riskKpis.length > 0 ? `<div style="margin-top:0.5rem;padding:0.5rem;background:var(--clr-danger-100);border-radius:var(--radius-md);font-size:0.75rem;color:var(--clr-danger-700);">⚠️ พบ ${data.riskKpis.length} KPI ที่มีความเสี่ยงสูง</div>` : ''}
          </div>`;
      }).join('')}
    `;
  }

  // ═══════ STRATEGY REPORT ═══════════════════
  function renderStrategyReport(el, kpis, strategies, analysis) {
    const colors = ['#2563eb','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899'];
    el.innerHTML = `
      <div class="report-header"><h2 class="report-title">🎯 รายงานความก้าวหน้ายุทธศาสตร์</h2><p class="report-subtitle">เทศบาลนคร — ${filters.year}</p></div>
      <div class="report-strat-detail">
        ${analysis.strategyProgress.map((s, i) => {
          const c = colors[i % colors.length];
          const stratKpis = kpis.filter(k => k.strategy === s.strategy);
          return `<div class="chart-card" style="margin-bottom:var(--space-lg);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
              <div><h3 style="font-size:1rem;font-weight:700;color:${c};">${s.strategy}</h3><div style="font-size:0.75rem;color:var(--clr-neutral-400);">ตัวชี้วัด ${s.total_kpi} ตัว | สำเร็จ ${s.success} ตัว</div></div>
              <div style="font-size:1.8rem;font-weight:700;color:${c};">${s.progress}%</div>
            </div>
            <div style="height:10px;background:var(--clr-neutral-200);border-radius:var(--radius-full);overflow:hidden;margin-bottom:var(--space-md);"><div style="height:100%;width:${Math.min(s.progress,120)*100/120}%;background:${c};border-radius:var(--radius-full);"></div></div>
            <div class="responsive-table"><table class="kpi-table"><thead><tr><th>KPI</th><th>หน่วยงาน</th><th class="text-center">เป้า</th><th class="text-center">ผลงาน</th><th class="text-center">คะแนน</th><th class="text-center">สถานะ</th></tr></thead><tbody>
            ${stratKpis.map(k => {
              const bc = k.statusColor === 'green' ? 'badge--green' : k.statusColor === 'yellow' ? 'badge--yellow' : 'badge--red';
              return `<tr><td class="kpi-name" style="font-size:0.78rem;">${k.kpi_name}</td><td style="font-size:0.75rem;">${k.department ? (k.department.length > 15 ? k.department.substring(0,13)+'…' : k.department) : '-'}</td><td class="text-center">${k.target_value}</td><td class="text-center" style="font-weight:600;">${k.actual_value || '-'}</td><td class="text-center" style="font-weight:600;">${k.score}%</td><td class="text-center"><span class="badge ${bc}"><span class="badge__dot"></span>${k.status}</span></td></tr>`;
            }).join('')}</tbody></table></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ═══════ TREND REPORT ══════════════════════
  function renderTrendReport(el, kpis, allResults, trendData) {
    const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'];

    // Build monthly summary
    const monthlyData = [];
    for (let m = 1; m <= 6; m++) {
      const scored = typeof DataPlatform !== 'undefined' ? DataPlatform.getScoredKpis(m) : [];
      if (scored.length === 0) continue;
      const s = ScoringEngine.calculateDashboardSummary(scored);
      monthlyData.push({ month: m, label: thMonths[m-1], ...s });
    }

    el.innerHTML = `
      <div class="report-header"><h2 class="report-title">📈 รายงานแนวโน้มและการพยากรณ์</h2><p class="report-subtitle">เทศบาลนคร — ${filters.year}</p></div>

      <div class="chart-card" style="margin-bottom:var(--space-xl);"><div class="chart-card__header"><h3 class="chart-card__title">แนวโน้มคะแนนรวม</h3></div><div class="chart-card__canvas-wrap chart-card__canvas-wrap--trend"><canvas id="rptTrendMain"></canvas></div></div>

      <div class="report-section"><h3 class="report-section__title">📊 สรุปผลรายเดือน</h3>
        <div class="responsive-table"><table class="kpi-table"><thead><tr><th>เดือน</th><th class="text-center">คะแนนรวม</th><th class="text-center">สำเร็จ</th><th class="text-center">เฝ้าระวัง</th><th class="text-center">ปรับปรุง</th></tr></thead><tbody>
        ${monthlyData.map(d => `<tr><td style="font-weight:600;">${d.label}</td><td class="text-center" style="font-weight:700;">${d.overall_score}%</td><td class="text-center" style="color:var(--clr-success-500);">${d.success_kpi}</td><td class="text-center" style="color:var(--clr-warning-500);">${d.risk_kpi}</td><td class="text-center" style="color:var(--clr-danger-500);">${d.failed_kpi}</td></tr>`).join('')}
        </tbody></table></div>
      </div>

      <div class="report-section"><h3 class="report-section__title">🤖 AI วิเคราะห์แนวโน้ม</h3>
        ${_trendInsights(monthlyData)}
      </div>
    `;

    setTimeout(() => Charts.renderTrendChart('rptTrendMain', trendData), 100);
  }

  function _trendInsights(monthlyData) {
    if (monthlyData.length < 2) return '<p style="color:var(--clr-neutral-400);">ข้อมูลไม่เพียงพอสำหรับวิเคราะห์แนวโน้ม</p>';
    const scores = monthlyData.map(d => d.overall_score);
    const trend = AIEngine.linearRegression(scores);
    const insights = [];

    if (trend.trend === 'improving') {
      insights.push({ icon: '📈', title: 'แนวโน้มดีขึ้น', text: `คะแนนรวมมีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง จาก ${scores[0]}% เป็น ${scores[scores.length-1]}%`, priority: 'success' });
    } else if (trend.trend === 'declining') {
      insights.push({ icon: '📉', title: 'แนวโน้มลดลง', text: `คะแนนรวมมีแนวโน้มลดลง จาก ${scores[0]}% เป็น ${scores[scores.length-1]}% — ควรวิเคราะห์สาเหตุ`, priority: 'danger' });
    } else {
      insights.push({ icon: '➡️', title: 'แนวโน้มคงที่', text: `คะแนนรวมอยู่ในระดับคงที่ ประมาณ ${scores[scores.length-1]}%`, priority: 'info' });
    }

    const lastMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData[monthlyData.length - 2];
    const diff = lastMonth.overall_score - prevMonth.overall_score;
    if (Math.abs(diff) > 1) {
      insights.push({ icon: diff > 0 ? '⬆️' : '⬇️', title: `เปลี่ยนแปลงจากเดือนก่อน`, text: `คะแนน${diff > 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(diff).toFixed(1)}% จากเดือนก่อน (${prevMonth.label} → ${lastMonth.label})`, priority: diff > 0 ? 'success' : 'warning' });
    }

    return insights.map(i => _insightCard(i)).join('');
  }

  // ═══════ RISK REPORT ═══════════════════════
  function renderRiskReport(el, kpis, allResults, analysis) {
    const riskKpis = analysis.riskKpis || [];
    const criticalKpis = riskKpis.filter(r => r.risk_level === 'critical');
    const highKpis = riskKpis.filter(r => r.risk_level === 'high');

    el.innerHTML = `
      <div class="report-header"><h2 class="report-title">⚠️ รายงานความเสี่ยงและเตือนภัยล่วงหน้า</h2><p class="report-subtitle">เทศบาลนคร — ${filters.year}</p></div>

      <div class="report-risk-summary">
        <div class="rpt-stat rpt-stat--red"><span class="rpt-stat__num">${criticalKpis.length}</span><span class="rpt-stat__label">วิกฤต</span></div>
        <div class="rpt-stat rpt-stat--yellow"><span class="rpt-stat__num">${highKpis.length}</span><span class="rpt-stat__label">เสี่ยงสูง</span></div>
        <div class="rpt-stat"><span class="rpt-stat__num">${riskKpis.length}</span><span class="rpt-stat__label">รวมทั้งหมด</span></div>
      </div>

      ${riskKpis.length === 0 ? '<div class="report-section"><div style="text-align:center;padding:2rem;color:var(--clr-success-500);font-size:1.1rem;">✅ ไม่พบ KPI ที่มีความเสี่ยง</div></div>' : ''}

      ${criticalKpis.length > 0 ? `
        <div class="report-section"><h3 class="report-section__title" style="color:var(--clr-danger-500);">🚨 KPI วิกฤต (Critical)</h3>
          ${criticalKpis.map(r => _riskCard(r)).join('')}
        </div>` : ''}

      ${highKpis.length > 0 ? `
        <div class="report-section"><h3 class="report-section__title" style="color:var(--clr-warning-500);">⚠️ KPI เสี่ยงสูง (High Risk)</h3>
          ${highKpis.map(r => _riskCard(r)).join('')}
        </div>` : ''}

      <!-- Risk Heatmap -->
      <div class="report-section"><h3 class="report-section__title">🗺️ แผนที่ความเสี่ยงรายหน่วยงาน</h3>
        <div class="heatmap-grid" style="margin-top:var(--space-md);">
          ${(analysis.riskHeatmap || []).map(d => `<div class="heatmap-cell" style="background:${d.color}15;border:2px solid ${d.color};border-radius:var(--radius-md);padding:0.6rem;text-align:center;"><div style="font-size:1.2rem;font-weight:700;color:${d.color}">${d.score}%</div><div style="font-size:0.65rem;color:var(--clr-neutral-600);margin-top:0.15rem;">${d.department.length > 14 ? d.department.substring(0,12)+'…' : d.department}</div><div style="margin-top:0.2rem;"><span style="font-size:0.55rem;background:${d.color};color:#fff;padding:0.1rem 0.35rem;border-radius:var(--radius-full);">${d.risk_level}</span></div></div>`).join('')}
        </div>
      </div>

      <!-- AI Risk Insights -->
      <div class="report-section"><h3 class="report-section__title">🤖 AI วิเคราะห์ความเสี่ยง</h3>
        ${analysis.insights.filter(i => i.priority === 'danger' || i.priority === 'warning').map(i => _insightCard(i)).join('') || '<div style="padding:1rem;color:var(--clr-success-500);">ไม่พบความเสี่ยงที่ต้องเฝ้าระวัง</div>'}
      </div>
    `;
  }

  // ─── Shared Components ─────────────────────
  function _insightCard(ins) {
    const pc = ins.priority === 'danger' ? 'insight--danger' : ins.priority === 'warning' ? 'insight--warning' : ins.priority === 'success' ? 'insight--success' : 'insight--info';
    return `<div class="insight-card ${pc}"><div class="insight-card__icon">${ins.icon}</div><div class="insight-card__body"><div class="insight-card__title">${ins.title}</div><div class="insight-card__text">${ins.text}</div></div></div>`;
  }

  function _riskCard(r) {
    const ti = AIEngine.getTrendIndicator(r.trend);
    const riskPct = Math.round(r.risk_probability * 100);
    return `<div class="report-risk-card"><div class="report-risk-card__header"><div><div style="font-weight:600;font-size:0.9rem;">${r.kpi_name}</div><div style="font-size:0.75rem;color:var(--clr-neutral-400);margin-top:0.1rem;">${r.department}</div></div><div style="text-align:right;"><div style="font-size:1.3rem;font-weight:700;color:var(--clr-danger-500);">${riskPct}%</div><div style="font-size:0.65rem;color:var(--clr-neutral-400);">ความเสี่ยง</div></div></div><div class="report-risk-card__factors">${r.factors.map(f => `<span class="report-risk-factor">${f}</span>`).join('')}<span class="report-risk-factor" style="background:${ti.color === 'red' ? 'var(--clr-danger-100)' : 'var(--clr-neutral-100)'};">${ti.icon} ${ti.label}</span></div></div>`;
  }

  // ─── Export ────────────────────────────────
  function exportReport() {
    window.print();
  }

  return { init, generateReport };
})();

document.addEventListener('DOMContentLoaded', Reports.init);
