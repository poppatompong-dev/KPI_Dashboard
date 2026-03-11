/* =============================================
   Main Dashboard Application
   Municipal KPI Dashboard
   ============================================= */

const App = (() => {
  // ─── State ─────────────────────────────────
  let currentFilters = {
    year: new Date().getFullYear() + 543,  // Buddhist year
    periodType: 'month',
    periodValue: new Date().getMonth() + 1,
    department: 'all'
  };

  let allKpiData = [];
  let departments = [];

  // ─── Department list ───────────────────────
  const DEPARTMENTS = [
    'สำนักปลัดเทศบาล',
    'สำนักช่าง',
    'สำนักคลัง',
    'สำนักสาธารณสุขและสิ่งแวดล้อม',
    'สำนักการศึกษา',
    'สำนักการประปา',
    'กองยุทธศาสตร์และงบประมาณ',
    'กองสวัสดิการสังคม',
    'กองสารสนเทศภาษีและทรัพย์สิน',
    'กองการเจ้าหน้าที่',
    'หน่วยตรวจสอบภายใน'
  ];

  // ─── Sample Demo Data ──────────────────────
  const DEMO_KPI_MASTER = [
    { kpi_id: 'KPI-001', kpi_name: 'ร้อยละความสำเร็จในการจัดเก็บรายได้', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 95, unit: '%', weight: 15, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-002', kpi_name: 'ร้อยละความพึงพอใจของประชาชน', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 90, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-003', kpi_name: 'จำนวนข้อร้องเรียนที่ได้รับการแก้ไขทันเวลา', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 95, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-004', kpi_name: 'ร้อยละของถนนที่ได้รับการซ่อมบำรุง', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงสร้างพื้นฐาน', target_value: 80, unit: '%', weight: 12, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-005', kpi_name: 'อัตราการเกิดโรคระบาดในเขตเทศบาล', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Public Health', category: 'สาธารณสุข', target_value: 5, unit: 'ครั้ง/ปี', weight: 10, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-006', kpi_name: 'ร้อยละของนักเรียนที่ผ่านเกณฑ์มาตรฐาน', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'การศึกษา', target_value: 85, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-007', kpi_name: 'ร้อยละของน้ำประปาที่ผ่านเกณฑ์คุณภาพ', department: 'สำนักการประปา', strategy: 'Environmental Sustainability', category: 'สาธารณูปโภค', target_value: 98, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-008', kpi_name: 'ร้อยละการเบิกจ่ายงบประมาณ', department: 'กองยุทธศาสตร์และงบประมาณ', strategy: 'Transparent Governance', category: 'งบประมาณ', target_value: 95, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-009', kpi_name: 'จำนวนครัวเรือนที่ได้รับสวัสดิการ', department: 'กองสวัสดิการสังคม', strategy: 'Public Health', category: 'สวัสดิการ', target_value: 500, unit: 'ครัวเรือน', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-010', kpi_name: 'ร้อยละความครบถ้วนของฐานข้อมูลภาษี', department: 'กองสารสนเทศภาษีและทรัพย์สิน', strategy: 'Smart City', category: 'ข้อมูล', target_value: 100, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-011', kpi_name: 'อัตราการลาออกของพนักงาน', department: 'กองการเจ้าหน้าที่', strategy: 'Transparent Governance', category: 'บุคลากร', target_value: 5, unit: '%', weight: 5, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-012', kpi_name: 'จำนวนข้อสังเกตจากการตรวจสอบ', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 10, unit: 'ข้อ', weight: 5, calculation_type: 'lower_better', year: 2569 },
  ];

  const DEMO_KPI_RESULTS = [
    { kpi_id: 'KPI-001', year: 2569, month: 1, actual_value: 88 },
    { kpi_id: 'KPI-001', year: 2569, month: 2, actual_value: 91 },
    { kpi_id: 'KPI-001', year: 2569, month: 3, actual_value: 96 },
    { kpi_id: 'KPI-002', year: 2569, month: 1, actual_value: 82 },
    { kpi_id: 'KPI-002', year: 2569, month: 2, actual_value: 85 },
    { kpi_id: 'KPI-002', year: 2569, month: 3, actual_value: 92 },
    { kpi_id: 'KPI-003', year: 2569, month: 1, actual_value: 78 },
    { kpi_id: 'KPI-003', year: 2569, month: 2, actual_value: 85 },
    { kpi_id: 'KPI-003', year: 2569, month: 3, actual_value: 91 },
    { kpi_id: 'KPI-004', year: 2569, month: 1, actual_value: 60 },
    { kpi_id: 'KPI-004', year: 2569, month: 2, actual_value: 70 },
    { kpi_id: 'KPI-004', year: 2569, month: 3, actual_value: 75 },
    { kpi_id: 'KPI-005', year: 2569, month: 1, actual_value: 3 },
    { kpi_id: 'KPI-005', year: 2569, month: 2, actual_value: 2 },
    { kpi_id: 'KPI-005', year: 2569, month: 3, actual_value: 4 },
    { kpi_id: 'KPI-006', year: 2569, month: 1, actual_value: 80 },
    { kpi_id: 'KPI-006', year: 2569, month: 2, actual_value: 82 },
    { kpi_id: 'KPI-006', year: 2569, month: 3, actual_value: 87 },
    { kpi_id: 'KPI-007', year: 2569, month: 1, actual_value: 97 },
    { kpi_id: 'KPI-007', year: 2569, month: 2, actual_value: 98 },
    { kpi_id: 'KPI-007', year: 2569, month: 3, actual_value: 99 },
    { kpi_id: 'KPI-008', year: 2569, month: 1, actual_value: 70 },
    { kpi_id: 'KPI-008', year: 2569, month: 2, actual_value: 78 },
    { kpi_id: 'KPI-008', year: 2569, month: 3, actual_value: 88 },
    { kpi_id: 'KPI-009', year: 2569, month: 1, actual_value: 320 },
    { kpi_id: 'KPI-009', year: 2569, month: 2, actual_value: 380 },
    { kpi_id: 'KPI-009', year: 2569, month: 3, actual_value: 450 },
    { kpi_id: 'KPI-010', year: 2569, month: 1, actual_value: 85 },
    { kpi_id: 'KPI-010', year: 2569, month: 2, actual_value: 90 },
    { kpi_id: 'KPI-010', year: 2569, month: 3, actual_value: 95 },
    { kpi_id: 'KPI-011', year: 2569, month: 1, actual_value: 3 },
    { kpi_id: 'KPI-011', year: 2569, month: 2, actual_value: 4 },
    { kpi_id: 'KPI-011', year: 2569, month: 3, actual_value: 6 },
    { kpi_id: 'KPI-012', year: 2569, month: 1, actual_value: 15 },
    { kpi_id: 'KPI-012', year: 2569, month: 2, actual_value: 12 },
    { kpi_id: 'KPI-012', year: 2569, month: 3, actual_value: 8 },
  ];

  // ─── Initialization ────────────────────────
  function init() {
    setupFilters();
    setupEventListeners();
    loadDashboard();
  }

  // ─── Setup Filters ─────────────────────────
  function setupFilters() {
    // Year dropdown
    const yearSelect = document.getElementById('filterYear');
    if (yearSelect) {
      const currentBEYear = new Date().getFullYear() + 543;
      for (let y = currentBEYear; y >= currentBEYear - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `ปี ${y}`;
        if (y === currentBEYear) opt.selected = true;
        yearSelect.appendChild(opt);
      }
    }

    // Period type
    const periodTypeSelect = document.getElementById('filterPeriodType');
    if (periodTypeSelect) {
      periodTypeSelect.innerHTML = `
        <option value="month">รายเดือน</option>
        <option value="quarter">รายไตรมาส</option>
        <option value="annual">รายปี</option>
      `;
      periodTypeSelect.addEventListener('change', () => {
        updatePeriodValues();
        onFilterChange();
      });
    }

    // Period value
    updatePeriodValues();

    // Department dropdown
    const deptSelect = document.getElementById('filterDepartment');
    if (deptSelect) {
      deptSelect.innerHTML = '<option value="all">ทุกสำนัก/กอง</option>';
      DEPARTMENTS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        deptSelect.appendChild(opt);
      });
    }
  }

  function updatePeriodValues() {
    const periodType = document.getElementById('filterPeriodType')?.value || 'month';
    const periodSelect = document.getElementById('filterPeriodValue');
    if (!periodSelect) return;

    const currentMonth = new Date().getMonth() + 1;

    if (periodType === 'month') {
      const months = Charts.THAI_MONTHS;
      periodSelect.innerHTML = months.map((m, i) =>
        `<option value="${i + 1}" ${(i + 1) === currentMonth ? 'selected' : ''}>${m}</option>`
      ).join('');
    } else if (periodType === 'quarter') {
      periodSelect.innerHTML = `
        <option value="1">ไตรมาส 1 (ต.ค.-ธ.ค.)</option>
        <option value="2">ไตรมาส 2 (ม.ค.-มี.ค.)</option>
        <option value="3">ไตรมาส 3 (เม.ย.-มิ.ย.)</option>
        <option value="4">ไตรมาส 4 (ก.ค.-ก.ย.)</option>
      `;
    } else {
      periodSelect.innerHTML = '<option value="0">ทั้งปี</option>';
    }
  }

  // ─── Event Listeners ───────────────────────
  function setupEventListeners() {
    // Filter changes
    ['filterYear', 'filterPeriodValue', 'filterDepartment'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', onFilterChange);
    });

    // Refresh button
    const refreshBtn = document.getElementById('btnRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', loadDashboard);

    // Search
    const searchInput = document.getElementById('kpiSearch');
    if (searchInput) searchInput.addEventListener('input', onSearchChange);

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
    }

    // Navigation links
    document.querySelectorAll('.sidebar__link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateTo(page);
      });
    });
  }

  function navigateTo(page) {
    if (page === 'admin') {
      window.location.href = 'admin.html';
    }
    // Update active link
    document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('sidebar__link--active'));
    document.querySelector(`.sidebar__link[data-page="${page}"]`)?.classList.add('sidebar__link--active');
  }

  function onFilterChange() {
    currentFilters.year = parseInt(document.getElementById('filterYear')?.value) || currentFilters.year;
    currentFilters.periodType = document.getElementById('filterPeriodType')?.value || 'month';
    currentFilters.periodValue = parseInt(document.getElementById('filterPeriodValue')?.value) || 1;
    currentFilters.department = document.getElementById('filterDepartment')?.value || 'all';

    loadDashboard();
  }

  function onSearchChange(e) {
    const query = e.target.value.toLowerCase().trim();
    renderKPITable(filterKpiBySearch(allKpiData, query));
  }

  function filterKpiBySearch(kpiList, query) {
    if (!query) return kpiList;
    return kpiList.filter(k =>
      (k.kpi_name || '').toLowerCase().includes(query) ||
      (k.department || '').toLowerCase().includes(query) ||
      (k.kpi_id || '').toLowerCase().includes(query)
    );
  }

  // ─── Data Loading ──────────────────────────
  function loadDashboard() {
    showLoading(true);

    // Try API first, fall back to demo data
    try {
      API.getAllDashboardData(
        currentFilters.year,
        currentFilters.periodType,
        currentFilters.periodValue,
        currentFilters.department
      ).then(data => {
        processAndRender(data);
        showLoading(false);
      }).catch(err => {
        console.warn('API call failed, using demo data:', err);
        loadDemoData();
      });
    } catch (e) {
      console.warn('API not available, using demo data');
      loadDemoData();
    }
  }

  function loadDemoData() {
    setTimeout(() => {
      const data = buildDemoResponse();
      processAndRender(data);
      showLoading(false);
    }, 600);
  }

  function buildDemoResponse() {
    // Get the latest month's results for active filter
    const targetMonth = currentFilters.periodValue || 3;

    const kpiList = DEMO_KPI_MASTER.map(master => {
      const result = DEMO_KPI_RESULTS.find(
        r => r.kpi_id === master.kpi_id && r.month === targetMonth
      );
      const actual = result ? result.actual_value : null;

      const scoreResult = ScoringEngine.calculateKpiScore(
        master.target_value,
        actual,
        master.weight,
        master.calculation_type
      );

      return {
        ...master,
        actual_value: actual,
        ...scoreResult
      };
    });

    // Filter by department if needed
    const filtered = currentFilters.department === 'all'
      ? kpiList
      : kpiList.filter(k => k.department === currentFilters.department);

    // Build trend data (all months)
    const trendData = buildTrendData(DEMO_KPI_MASTER, DEMO_KPI_RESULTS);

    // Department performance
    const deptPerformance = ScoringEngine.calculateDepartmentPerformance(kpiList);

    // Summary
    const summary = ScoringEngine.calculateDashboardSummary(filtered);

    return {
      summary,
      kpiList: filtered,
      deptPerformance,
      trendData
    };
  }

  function buildTrendData(masters, results) {
    const labels = [];
    const targetAvgs = [];
    const actualAvgs = [];

    for (let m = 1; m <= 12; m++) {
      const monthResults = results.filter(r => r.month === m);
      if (monthResults.length === 0) continue;

      labels.push(Charts.THAI_MONTHS[m - 1]);

      // Calculate avg score for this month
      let totalScore = 0;
      let count = 0;
      monthResults.forEach(r => {
        const master = masters.find(mk => mk.kpi_id === r.kpi_id);
        if (master) {
          const s = ScoringEngine.calculateKpiScore(
            master.target_value, r.actual_value, master.weight, master.calculation_type
          );
          totalScore += s.score;
          count++;
        }
      });

      actualAvgs.push(count > 0 ? Math.round(totalScore / count * 10) / 10 : 0);
      targetAvgs.push(100); // Target is always 100%
    }

    return { labels, target: targetAvgs, actual: actualAvgs };
  }

  // ─── Render Pipeline ───────────────────────
  function processAndRender(data) {
    allKpiData = data.kpiList || [];

    // Update header
    updatePageTitle();

    // Render sections
    renderSummaryCards(data.summary || {});
    Charts.renderTrendChart('trendChart', data.trendData || { labels: [], target: [], actual: [] });
    Charts.renderStatusChart('statusChart', {
      success: data.summary?.success_kpi || 0,
      risk: data.summary?.risk_kpi || 0,
      failed: data.summary?.failed_kpi || 0
    });

    if (data.deptPerformance) {
      Charts.renderDeptChart('deptChart', data.deptPerformance);
    }

    renderKPITable(allKpiData);
  }

  function updatePageTitle() {
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    const periodType = currentFilters.periodType;
    let periodText = '';

    if (periodType === 'month') {
      periodText = Charts.THAI_MONTHS[(currentFilters.periodValue || 1) - 1] || '';
    } else if (periodType === 'quarter') {
      periodText = `ไตรมาส ${currentFilters.periodValue}`;
    } else {
      periodText = 'ทั้งปี';
    }

    titleEl.textContent = `ภาพรวมผลการดำเนินงาน ${periodText} ปี ${currentFilters.year}`;
  }

  // ─── Summary Cards ─────────────────────────
  function renderSummaryCards(summary) {
    const container = document.getElementById('summaryCards');
    if (!container) return;

    container.innerHTML = `
      <!-- Total KPI -->
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__label">ตัวชี้วัดทั้งหมด</div>
          <div class="stat-card__value">${summary.total_kpi || 0} <small>รายการ</small></div>
        </div>
      </div>

      <!-- Success -->
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__label">บรรลุเป้าหมาย</div>
          <div class="stat-card__value">${summary.success_kpi || 0} <small>รายการ</small></div>
        </div>
      </div>

      <!-- Risk -->
      <div class="stat-card stat-card--risk">
        <div class="stat-card__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__label">เฝ้าระวัง</div>
          <div class="stat-card__value">${summary.risk_kpi || 0} <small>รายการ</small></div>
        </div>
      </div>

      <!-- Failed -->
      <div class="stat-card stat-card--failed">
        <div class="stat-card__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__label">ต้องปรับปรุง</div>
          <div class="stat-card__value">${summary.failed_kpi || 0} <small>รายการ</small></div>
        </div>
      </div>

      <!-- Overall Score -->
      <div class="stat-card stat-card--score">
        <div class="stat-card__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__label">คะแนนรวม</div>
          <div class="stat-card__value">${summary.overall_score || 0}<small>%</small></div>
        </div>
      </div>
    `;
  }

  // ─── KPI Table ──────────────────────────────
  function renderKPITable(kpiList) {
    const tbody = document.getElementById('kpiTableBody');
    if (!tbody) return;

    if (kpiList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:3rem;color:var(--clr-neutral-400);">
            <svg style="width:3rem;height:3rem;margin:0 auto 0.5rem;opacity:.4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <div>ไม่พบข้อมูล KPI</div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    kpiList.forEach(kpi => {
      const badgeClass = kpi.statusColor === 'green' ? 'badge--green'
        : kpi.statusColor === 'yellow' ? 'badge--yellow'
        : kpi.statusColor === 'red' ? 'badge--red' : '';

      const progressClass = kpi.statusColor === 'green' ? 'progress-bar__fill--green'
        : kpi.statusColor === 'yellow' ? 'progress-bar__fill--yellow'
        : 'progress-bar__fill--red';

      const barWidth = Math.min(kpi.percent || 0, 100);
      const actualDisplay = kpi.actual_value != null ? kpi.actual_value.toLocaleString() : '-';
      const targetDisplay = kpi.target_value != null ? kpi.target_value.toLocaleString() : '-';

      html += `
        <tr>
          <td class="kpi-name">
            <div>${kpi.kpi_name}</div>
            <div style="font-size:0.7rem;color:var(--clr-neutral-400);margin-top:2px;">${kpi.department || ''}</div>
          </td>
          <td class="text-center">${kpi.weight || 0}%</td>
          <td class="text-right">${targetDisplay} ${kpi.unit || ''}</td>
          <td class="text-right" style="font-weight:600">${actualDisplay} ${kpi.unit || ''}</td>
          <td>
            <div class="progress-bar">
              <span class="progress-bar__value">${kpi.score || 0}%</span>
              <div class="progress-bar__track">
                <div class="progress-bar__fill ${progressClass}" style="width:${barWidth}%"></div>
              </div>
            </div>
          </td>
          <td class="text-center">
            <span class="badge ${badgeClass}">
              <span class="badge__dot"></span>
              ${kpi.status || ''}
            </span>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // ─── Loading ────────────────────────────────
  function showLoading(isLoading) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    if (isLoading) {
      overlay.classList.add('loading-overlay--visible');
    } else {
      overlay.classList.remove('loading-overlay--visible');
    }
  }

  // ─── Toast ──────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function createToastContainer() {
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  }

  return {
    init,
    showToast,
    DEPARTMENTS,
    loadDashboard
  };
})();

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', App.init);
