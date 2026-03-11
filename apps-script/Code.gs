/**
 * =============================================
 *  Municipal KPI Dashboard — Main Backend
 *  Google Apps Script Entry Point
 * =============================================
 *
 *  Sheet ID: 1ND4obJ6Q_LttHJuVzfHwJpE2bntg_bZeG-BLGl6Qprs
 *
 *  Sheets Required:
 *    - KPI_MASTER
 *    - KPI_RESULTS
 *    - DEPARTMENTS
 *    - STRATEGIC_PLAN
 */

// ─── Configuration ───────────────────────────
const CONFIG = {
  SPREADSHEET_ID: '1ND4obJ6Q_LttHJuVzfHwJpE2bntg_bZeG-BLGl6Qprs',
  CACHE_TTL: 300, // 5 minutes cache
  SHEETS: {
    KPI_MASTER: 'KPI_MASTER',
    KPI_RESULTS: 'KPI_RESULTS',
    DEPARTMENTS: 'DEPARTMENTS',
    STRATEGIC_PLAN: 'STRATEGIC_PLAN'
  }
};

// ─── Web App Entry Points ────────────────────

/**
 * Serve the dashboard HTML or handle API GET requests
 */
function doGet(e) {
  const action = e?.parameter?.action;

  if (action) {
    // API mode: return JSON
    const result = routeAction(action, e.parameter);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // UI mode: serve the dashboard page
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบจัดการ KPI เทศบาลนคร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Handle API POST requests
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const result = routeAction(action, payload);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Route API actions to handler functions
 */
function routeAction(action, params) {
  switch (action) {
    case 'getAllDashboardData':
      return getAllDashboardData(params);
    case 'getDashboardSummary':
      return getDashboardSummary(params);
    case 'getDepartmentPerformance':
      return getDepartmentPerformance(params);
    case 'getKpiTable':
      return getKpiTable(params);
    case 'getKpiTrend':
      return getKpiTrend(params);
    case 'getDepartments':
      return getDepartmentsList();
    case 'getStrategies':
      return getStrategiesList();
    case 'getKpiMasterList':
      return getKpiMasterList();
    case 'saveKpiMaster':
      return saveKpiMaster(params.kpiData);
    case 'deleteKpi':
      return deleteKpi(params.kpi_id);
    case 'saveKpiResult':
      return saveKpiResult(params.resultData);
    default:
      return { success: false, error: 'Unknown action: ' + action };
  }
}

// ─── Spreadsheet Helpers ─────────────────────

/**
 * Get the spreadsheet instance
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Get or create a sheet by name
 */
function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1e293b')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

/**
 * Read all data from a sheet as array of objects
 */
function readSheetData(sheetName) {
  // Try cache first
  const cacheKey = 'sheet_' + sheetName;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Cache corrupted, continue to read
    }
  }

  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const result = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  }).filter(row => {
    // Filter out completely empty rows
    return Object.values(row).some(v => v !== '' && v !== null && v !== undefined);
  });

  // Cache for 5 minutes
  try {
    CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), CONFIG.CACHE_TTL);
  } catch (e) {
    // Cache too large, skip
  }

  return result;
}

/**
 * Clear cache for a sheet
 */
function clearSheetCache(sheetName) {
  CacheService.getScriptCache().remove('sheet_' + sheetName);
}

// ─── Setup / Migration ──────────────────────

/**
 * Initialize all required sheets with headers
 * Run this once to set up the database
 */
function setupDatabase() {
  // KPI_MASTER
  getOrCreateSheet(CONFIG.SHEETS.KPI_MASTER, [
    'kpi_id', 'kpi_name', 'department', 'strategy', 'category',
    'target_value', 'unit', 'weight', 'calculation_type',
    'description', 'owner', 'year'
  ]);

  // KPI_RESULTS
  getOrCreateSheet(CONFIG.SHEETS.KPI_RESULTS, [
    'record_id', 'kpi_id', 'year', 'quarter', 'month',
    'actual_value', 'note', 'updated_at'
  ]);

  // DEPARTMENTS
  const deptSheet = getOrCreateSheet(CONFIG.SHEETS.DEPARTMENTS, [
    'dept_id', 'dept_name', 'manager', 'division'
  ]);

  // Seed department data if empty
  const deptData = deptSheet.getDataRange().getValues();
  if (deptData.length <= 1) {
    const departments = [
      ['DEPT-01', 'สำนักปลัดเทศบาล', '', 'สำนัก'],
      ['DEPT-02', 'สำนักช่าง', '', 'สำนัก'],
      ['DEPT-03', 'สำนักคลัง', '', 'สำนัก'],
      ['DEPT-04', 'สำนักสาธารณสุขและสิ่งแวดล้อม', '', 'สำนัก'],
      ['DEPT-05', 'สำนักการศึกษา', '', 'สำนัก'],
      ['DEPT-06', 'สำนักการประปา', '', 'สำนัก'],
      ['DEPT-07', 'กองยุทธศาสตร์และงบประมาณ', '', 'กอง'],
      ['DEPT-08', 'กองสวัสดิการสังคม', '', 'กอง'],
      ['DEPT-09', 'กองสารสนเทศภาษีและทรัพย์สิน', '', 'กอง'],
      ['DEPT-10', 'กองการเจ้าหน้าที่', '', 'กอง'],
      ['DEPT-11', 'หน่วยตรวจสอบภายใน', '', 'หน่วย']
    ];
    deptSheet.getRange(2, 1, departments.length, 4).setValues(departments);
  }

  // STRATEGIC_PLAN
  const stratSheet = getOrCreateSheet(CONFIG.SHEETS.STRATEGIC_PLAN, [
    'strategy_id', 'strategy_name', 'description'
  ]);

  const stratData = stratSheet.getDataRange().getValues();
  if (stratData.length <= 1) {
    const strategies = [
      ['STRAT-01', 'Smart City', 'เมืองอัจฉริยะ'],
      ['STRAT-02', 'Infrastructure Development', 'พัฒนาโครงสร้างพื้นฐาน'],
      ['STRAT-03', 'Public Health', 'สาธารณสุขและสิ่งแวดล้อม'],
      ['STRAT-04', 'Education Development', 'พัฒนาการศึกษา'],
      ['STRAT-05', 'Transparent Governance', 'ธรรมาภิบาลและความโปร่งใส'],
      ['STRAT-06', 'Environmental Sustainability', 'ความยั่งยืนด้านสิ่งแวดล้อม']
    ];
    stratSheet.getRange(2, 1, strategies.length, 3).setValues(strategies);
  }

  Logger.log('Database setup complete!');
}

// ─── API: Dashboard Data ─────────────────────

/**
 * Get all dashboard data in a single call (reduces Sheet reads)
 */
function getAllDashboardData(params) {
  const paramsObj = typeof params === 'string' ? JSON.parse(params) : (params || {});
  const year = parseInt(paramsObj.year) || (new Date().getFullYear() + 543);
  const periodType = paramsObj.periodType || 'month';
  const periodValue = parseInt(paramsObj.periodValue) || (new Date().getMonth() + 1);
  const deptFilter = paramsObj.department || 'all';

  // Batch read all data
  const kpiMaster = readSheetData(CONFIG.SHEETS.KPI_MASTER);
  const kpiResults = readSheetData(CONFIG.SHEETS.KPI_RESULTS);

  // Merge and score
  const scoredList = mergeAndScore(kpiMaster, kpiResults, year, periodType, periodValue);

  // Filter by department
  const filtered = deptFilter === 'all'
    ? scoredList
    : scoredList.filter(k => k.department === deptFilter);

  // Build summary
  const summary = buildSummary(filtered);

  // Department performance (always use all, unfiltered)
  const deptPerformance = buildDeptPerformance(scoredList);

  // Trend data
  const trendData = buildTrendData(kpiMaster, kpiResults, year);

  return {
    success: true,
    summary: summary,
    kpiList: filtered,
    deptPerformance: deptPerformance,
    trendData: trendData
  };
}

function getDashboardSummary(params) {
  const data = getAllDashboardData(params);
  return { success: true, summary: data.summary };
}

function getDepartmentPerformance(params) {
  const data = getAllDashboardData(params);
  return { success: true, deptPerformance: data.deptPerformance };
}

function getKpiTable(params) {
  const data = getAllDashboardData(params);
  return { success: true, kpiList: data.kpiList };
}

/**
 * Get monthly trend data for a specific KPI
 */
function getKpiTrend(params) {
  const paramsObj = typeof params === 'string' ? JSON.parse(params) : (params || {});
  const kpiId = paramsObj.kpi_id;

  const kpiMaster = readSheetData(CONFIG.SHEETS.KPI_MASTER);
  const kpiResults = readSheetData(CONFIG.SHEETS.KPI_RESULTS);

  const master = kpiMaster.find(k => k.kpi_id === kpiId);
  if (!master) return { success: false, error: 'KPI not found' };

  const results = kpiResults.filter(r => r.kpi_id === kpiId);
  const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                       'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const labels = [];
  const actual = [];
  const target = [];

  for (let m = 1; m <= 12; m++) {
    const r = results.find(res => parseInt(res.month) === m);
    if (r) {
      labels.push(monthLabels[m - 1]);
      actual.push(parseFloat(r.actual_value) || 0);
      target.push(parseFloat(master.target_value) || 0);
    }
  }

  return {
    success: true,
    kpi_id: kpiId,
    kpi_name: master.kpi_name,
    trendData: { labels, actual, target }
  };
}

// ─── API: Lists ──────────────────────────────

function getDepartmentsList() {
  const data = readSheetData(CONFIG.SHEETS.DEPARTMENTS);
  return { success: true, departments: data };
}

function getStrategiesList() {
  const data = readSheetData(CONFIG.SHEETS.STRATEGIC_PLAN);
  return { success: true, strategies: data };
}

function getKpiMasterList() {
  const data = readSheetData(CONFIG.SHEETS.KPI_MASTER);
  return { success: true, kpis: data };
}

// ─── Scoring & Aggregation ───────────────────

/**
 * Merge KPI master with results and calculate scores
 */
function mergeAndScore(kpiMaster, kpiResults, year, periodType, periodValue) {
  return kpiMaster
    .filter(m => !m.year || parseInt(m.year) === year)
    .map(master => {
      // Find the matching result
      let result = null;

      if (periodType === 'month') {
        result = kpiResults.find(r =>
          r.kpi_id === master.kpi_id &&
          parseInt(r.year) === year &&
          parseInt(r.month) === periodValue
        );
      } else if (periodType === 'quarter') {
        // Get latest month in the quarter
        const qMonths = getQuarterMonths(periodValue);
        const qResults = kpiResults.filter(r =>
          r.kpi_id === master.kpi_id &&
          parseInt(r.year) === year &&
          qMonths.includes(parseInt(r.month))
        ).sort((a, b) => parseInt(b.month) - parseInt(a.month));
        result = qResults[0] || null;
      } else {
        // Annual: get latest
        const yResults = kpiResults.filter(r =>
          r.kpi_id === master.kpi_id &&
          parseInt(r.year) === year
        ).sort((a, b) => parseInt(b.month) - parseInt(a.month));
        result = yResults[0] || null;
      }

      const actual = result ? parseFloat(result.actual_value) : null;
      const targetVal = parseFloat(master.target_value) || 0;
      const weight = parseFloat(master.weight) || 0;
      const calcType = master.calculation_type || 'higher_better';

      const scoreResult = calculateKpiScoreGS(targetVal, actual, weight, calcType);

      return {
        kpi_id: master.kpi_id,
        kpi_name: master.kpi_name,
        department: master.department,
        strategy: master.strategy,
        category: master.category,
        target_value: targetVal,
        unit: master.unit || '',
        weight: weight,
        calculation_type: calcType,
        actual_value: actual,
        note: result ? result.note : '',
        score: scoreResult.score,
        weightedScore: scoreResult.weightedScore,
        percent: scoreResult.percent,
        status: scoreResult.status,
        statusColor: scoreResult.statusColor
      };
    });
}

/**
 * Get months in a fiscal quarter (Thai fiscal: Q1=Oct-Dec, Q2=Jan-Mar, Q3=Apr-Jun, Q4=Jul-Sep)
 */
function getQuarterMonths(quarter) {
  switch (parseInt(quarter)) {
    case 1: return [10, 11, 12];
    case 2: return [1, 2, 3];
    case 3: return [4, 5, 6];
    case 4: return [7, 8, 9];
    default: return [1, 2, 3];
  }
}

/**
 * Build dashboard summary from scored KPI list
 */
function buildSummary(scoredList) {
  let success = 0, risk = 0, failed = 0;
  let totalWeightedScore = 0, totalWeight = 0;

  scoredList.forEach(kpi => {
    if (kpi.statusColor === 'green') success++;
    else if (kpi.statusColor === 'yellow') risk++;
    else if (kpi.statusColor === 'red') failed++;

    totalWeightedScore += kpi.weightedScore || 0;
    totalWeight += kpi.weight || 0;
  });

  const overallScore = totalWeight > 0
    ? Math.round((totalWeightedScore / totalWeight) * 100 * 100) / 100
    : 0;

  return {
    total_kpi: scoredList.length,
    success_kpi: success,
    risk_kpi: risk,
    failed_kpi: failed,
    overall_score: overallScore
  };
}

/**
 * Build department performance from scored KPI list
 */
function buildDeptPerformance(scoredList) {
  const deptMap = {};

  scoredList.forEach(kpi => {
    const dept = kpi.department || 'ไม่ระบุ';
    if (!deptMap[dept]) {
      deptMap[dept] = { department: dept, kpis: [], totalWeight: 0, totalWeightedScore: 0, success: 0, risk: 0, failed: 0 };
    }
    deptMap[dept].kpis.push(kpi);
    deptMap[dept].totalWeight += kpi.weight || 0;
    deptMap[dept].totalWeightedScore += kpi.weightedScore || 0;
    if (kpi.statusColor === 'green') deptMap[dept].success++;
    else if (kpi.statusColor === 'yellow') deptMap[dept].risk++;
    else deptMap[dept].failed++;
  });

  return Object.values(deptMap).map(d => ({
    department: d.department,
    total_kpi: d.kpis.length,
    success: d.success,
    risk: d.risk,
    failed: d.failed,
    score: d.totalWeight > 0 ? Math.round((d.totalWeightedScore / d.totalWeight) * 100 * 100) / 100 : 0
  })).sort((a, b) => b.score - a.score);
}

/**
 * Build monthly trend data for all KPIs
 */
function buildTrendData(kpiMaster, kpiResults, year) {
  const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                       'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const labels = [];
  const targetAvgs = [];
  const actualAvgs = [];

  for (let m = 1; m <= 12; m++) {
    const monthResults = kpiResults.filter(r =>
      parseInt(r.year) === year && parseInt(r.month) === m
    );
    if (monthResults.length === 0) continue;

    labels.push(monthLabels[m - 1]);

    let totalScore = 0, count = 0;
    monthResults.forEach(r => {
      const master = kpiMaster.find(mk => mk.kpi_id === r.kpi_id);
      if (master) {
        const s = calculateKpiScoreGS(
          parseFloat(master.target_value), parseFloat(r.actual_value),
          parseFloat(master.weight), master.calculation_type
        );
        totalScore += s.score;
        count++;
      }
    });

    actualAvgs.push(count > 0 ? Math.round(totalScore / count * 10) / 10 : 0);
    targetAvgs.push(100);
  }

  return { labels, target: targetAvgs, actual: actualAvgs };
}
