/**
 * 🚀 SMART CITY KPI PLATFORM v3.0 (Release Candidate)
 * ===================================================
 * Developed by: Computer Technical Officer (นักวิชาการคอมพิวเตอร์)
 * Municipality: เทศบาลนคร
 * Updated: 2026-03-11 15:00
 * "Transforming Municipal Data into Intelligent Decisions"
 * ===================================================
 * Complete backend engine for KPI Dashboard system.
 * Paste this entire file into Apps Script editor.
 * 
 * Sheet ID: 1ND4obJ6Q_LttHJuVzfHwJpE2bntg_bZeG-BLGl6Qprs
 * Web App: https://script.google.com/macros/s/AKfycbzYGYtoaLhtH-GQuZZHdtLZM3Gg9B1A89fV6bHZNx5zbIvHar9JZFPMY3EajN_xLaM/exec
 * ===================================================
 */

const SHEET_ID = '1ND4obJ6Q_LttHJuVzfHwJpE2bntg_bZeG-BLGl6Qprs';

// ─── Sheet Names ─────────────────────────────
const SHEETS = {
  KPI_MASTER: 'KPI_MASTER',
  KPI_RESULTS: 'KPI_RESULTS',
  DEPARTMENTS: 'DEPARTMENTS',
  STRATEGIC_PLAN: 'STRATEGIC_PLAN',
  USERS: 'USERS',
  AUDIT_LOG: 'AUDIT_LOG'
};

// ─── Web App Entry Points ────────────────────

function doGet(e) {
  const action = e?.parameter?.action || 'ping';
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  try {
    let result;
    switch (action) {
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString(), version: '3.0' };
        break;
      case 'getKpiMaster':
        result = getSheetData(spreadsheet, SHEETS.KPI_MASTER);
        break;
      case 'getKpiResults':
        result = getSheetData(spreadsheet, SHEETS.KPI_RESULTS);
        break;
      case 'getDepartments':
        result = getSheetData(spreadsheet, SHEETS.DEPARTMENTS);
        break;
      case 'getStrategicPlan':
        result = getSheetData(spreadsheet, SHEETS.STRATEGIC_PLAN);
        break;
      case 'getUsers':
        result = getSheetData(spreadsheet, SHEETS.USERS);
        break;
      case 'getAuditLog':
        result = getSheetData(spreadsheet, SHEETS.AUDIT_LOG);
        break;
      case 'getAllData':
        result = {
          kpi_master: getSheetData(spreadsheet, SHEETS.KPI_MASTER),
          kpi_results: getSheetData(spreadsheet, SHEETS.KPI_RESULTS),
          departments: getSheetData(spreadsheet, SHEETS.DEPARTMENTS),
          strategic_plan: getSheetData(spreadsheet, SHEETS.STRATEGIC_PLAN)
        };
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  try {
    const payload = JSON.parse(e?.postData?.contents || '{}');
    const action = payload.action;
    let result;

    switch (action) {
      case 'saveResult':
        result = saveKpiResult(spreadsheet, payload.data);
        break;
      case 'createKpi':
        result = createKpi(spreadsheet, payload.data);
        break;
      case 'updateKpi':
        result = updateKpi(spreadsheet, payload.data);
        break;
      case 'createUser':
        result = createUser(spreadsheet, payload.data);
        break;
      case 'logAudit':
        result = logAudit(spreadsheet, payload.data);
        break;
      case 'setupDatabase':
        result = setupDatabase();
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Sheet Data Helpers ──────────────────────

function getSheetData(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => {
      row[h] = data[i][j];
    });
    rows.push(row);
  }

  return rows;
}

// ─── CRUD Operations ─────────────────────────

function saveKpiResult(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_RESULTS);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  // Validate
  if (!data.kpi_id || !data.year || !data.month || data.actual_value === undefined) {
    return { success: false, error: 'Missing required fields' };
  }

  // Check duplicate
  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][0] === data.kpi_id && 
        existing[i][1] == data.year && 
        existing[i][3] == data.month) {
      // Update existing row
      sheet.getRange(i + 1, 5).setValue(data.actual_value);
      sheet.getRange(i + 1, 6).setValue(data.note || '');
      sheet.getRange(i + 1, 7).setValue(data.updated_by || 'system');
      sheet.getRange(i + 1, 8).setValue(new Date());
      return { success: true, action: 'updated' };
    }
  }

  // Append new row
  const quarter = Math.ceil(data.month / 3);
  sheet.appendRow([
    data.kpi_id,
    data.year,
    quarter,
    data.month,
    data.actual_value,
    data.note || '',
    data.updated_by || 'system',
    new Date()
  ]);

  return { success: true, action: 'created' };
}

function createKpi(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  // Generate KPI ID
  const lastRow = sheet.getLastRow();
  const kpiId = 'KPI-' + String(lastRow + 100).padStart(3, '0');

  sheet.appendRow([
    kpiId,
    data.kpi_name,
    data.department,
    data.strategy || '',
    data.target_value,
    data.unit || '',
    data.weight || 5,
    data.calculation_type || 'higher_better',
    data.year || 2569,
    'active',
    data.description || ''
  ]);

  return { success: true, kpi_id: kpiId };
}

function updateKpi(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.kpi_id) {
      if (data.kpi_name) sheet.getRange(i + 1, 2).setValue(data.kpi_name);
      if (data.target_value !== undefined) sheet.getRange(i + 1, 5).setValue(data.target_value);
      if (data.weight !== undefined) sheet.getRange(i + 1, 7).setValue(data.weight);
      if (data.status) sheet.getRange(i + 1, 10).setValue(data.status);
      return { success: true };
    }
  }

  return { success: false, error: 'KPI not found' };
}

function createUser(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  // Check duplicate username
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === data.username) {
      return { success: false, error: 'Username already exists' };
    }
  }

  const userId = 'USR-' + String(Date.now()).slice(-6);
  sheet.appendRow([
    userId,
    data.username,
    data.password_hash || '',
    data.display_name || data.username,
    data.role || 'STAFF',
    data.department || '',
    data.email || '',
    'active',
    new Date(),
    ''
  ]);

  return { success: true, user_id: userId };
}

function logAudit(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.AUDIT_LOG);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const logId = 'LOG-' + Date.now();
  sheet.appendRow([
    logId,
    data.user || 'system',
    data.action || '',
    data.target_type || '',
    data.target_id || '',
    new Date(),
    data.details || ''
  ]);

  return { success: true, log_id: logId };
}

// ─── Database Setup ──────────────────────────

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Create sheets with headers
  const sheetConfigs = [
    {
      name: SHEETS.KPI_MASTER,
      headers: ['kpi_id', 'kpi_name', 'department', 'strategy', 'target_value', 'unit', 'weight', 'calculation_type', 'year', 'status', 'description']
    },
    {
      name: SHEETS.KPI_RESULTS,
      headers: ['kpi_id', 'year', 'quarter', 'month', 'actual_value', 'note', 'updated_by', 'updated_at']
    },
    {
      name: SHEETS.DEPARTMENTS,
      headers: ['dept_id', 'name', 'short', 'director_name', 'status']
    },
    {
      name: SHEETS.STRATEGIC_PLAN,
      headers: ['strategy_id', 'name', 'thai', 'description', 'year', 'status']
    },
    {
      name: SHEETS.USERS,
      headers: ['user_id', 'username', 'password_hash', 'display_name', 'role', 'department', 'email', 'status', 'created_at', 'last_login']
    },
    {
      name: SHEETS.AUDIT_LOG,
      headers: ['log_id', 'user', 'action', 'target_type', 'target_id', 'timestamp', 'details']
    }
  ];

  const results = [];

  sheetConfigs.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      // Format header row
      sheet.getRange(1, 1, 1, config.headers.length)
        .setBackground('#2563eb')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      results.push({ sheet: config.name, action: 'created' });
    } else {
      results.push({ sheet: config.name, action: 'exists' });
    }
  });

  // Seed departments if empty
  const deptSheet = ss.getSheetByName(SHEETS.DEPARTMENTS);
  if (deptSheet && deptSheet.getLastRow() < 2) {
    const departments = [
      ['DEPT-001', 'สำนักปลัดเทศบาล', 'ปลัด', '', 'active'],
      ['DEPT-002', 'สำนักช่าง', 'ช่าง', '', 'active'],
      ['DEPT-003', 'สำนักคลัง', 'คลัง', '', 'active'],
      ['DEPT-004', 'สำนักสาธารณสุขและสิ่งแวดล้อม', 'สาธารณสุข', '', 'active'],
      ['DEPT-005', 'สำนักการศึกษา', 'การศึกษา', '', 'active'],
      ['DEPT-006', 'สำนักการประปา', 'ประปา', '', 'active'],
      ['DEPT-007', 'กองยุทธศาสตร์และงบประมาณ', 'ยุทธศาสตร์', '', 'active'],
      ['DEPT-008', 'กองสวัสดิการสังคม', 'สวัสดิการ', '', 'active'],
      ['DEPT-009', 'กองสารสนเทศภาษีและทรัพย์สิน', 'ภาษี', '', 'active'],
      ['DEPT-010', 'กองการเจ้าหน้าที่', 'เจ้าหน้าที่', '', 'active'],
      ['DEPT-011', 'หน่วยตรวจสอบภายใน', 'ตรวจสอบ', '', 'active']
    ];
    departments.forEach(d => deptSheet.appendRow(d));
    results.push({ sheet: SHEETS.DEPARTMENTS, action: 'seeded 11 departments' });
  }

  // Seed admin user if empty
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  if (userSheet && userSheet.getLastRow() < 2) {
    userSheet.appendRow([
      'USR-001', 'admin', '', 'ผู้ดูแลระบบ', 'SUPER_ADMIN', 'all', 'admin@municipality.go.th', 'active', new Date(), ''
    ]);
    results.push({ sheet: SHEETS.USERS, action: 'seeded admin user' });
  }

  return { success: true, results };
}

// ─── Cache Management ─────────────────────────

function refreshCache() {
  const cache = CacheService.getScriptCache();
  const ss = SpreadsheetApp.openById(SHEET_ID);

  const datasets = ['KPI_MASTER', 'KPI_RESULTS', 'DEPARTMENTS', 'STRATEGIC_PLAN'];
  datasets.forEach(name => {
    const data = getSheetData(ss, name);
    cache.put('cache_' + name, JSON.stringify(data), 300); // 5 min cache
  });

  return { success: true, cached: datasets.length };
}

function setupScheduledRefresh() {
  ScriptApp.newTrigger('refreshCache')
    .timeBased()
    .everyMinutes(5)
    .create();
  return { success: true, message: '5-minute refresh trigger created' };
}
