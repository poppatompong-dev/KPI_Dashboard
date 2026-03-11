/**
 * 🚀 SMART CITY KPI PLATFORM v3.2 (Security Hardened)
 * ===================================================
 * Developed by: Computer Technical Officer (นักวิชาการคอมพิวเตอร์)
 * Municipality: เทศบาลนคร
 * Updated: 2026-03-11 20:20
 * "Transforming Municipal Data into Intelligent Decisions"
 * ===================================================
 * HOW TO DEPLOY:
 * 1. Paste this file into Google Apps Script Editor
 * 2. Script Properties → Add property: API_SECRET = <your-random-secret>
 * 3. Deploy → New Deployment → Web App → Execute as: Me → Anyone
 * 4. Copy Web App URL → set as Vercel Environment Variable: GAS_URL
 * 5. Copy API_SECRET → set as Vercel Environment Variable: API_SECRET
 * ===================================================
 * ⚠️  SECURITY NOTE: Sheet ID and Web App URL are NOT stored here.
 *     Use Script Properties for all secrets.
 * ===================================================
 */

// ─── Configuration (from Script Properties) ──────────────
const PROPS         = PropertiesService.getScriptProperties();
const SHEET_ID      = PROPS.getProperty('SHEET_ID');      // ตั้งใน Script Properties
const API_SECRET    = PROPS.getProperty('API_SECRET');    // ตั้งใน Script Properties
const BACKUP_FOLDER = PROPS.getProperty('BACKUP_FOLDER'); // Google Drive Folder ID สำหรับ backup

// ─── Sheet Names ──────────────────────────────────────────
const SHEETS = {
  KPI_MASTER:    'KPI_MASTER',
  KPI_RESULTS:   'KPI_RESULTS',
  DEPARTMENTS:   'DEPARTMENTS',
  STRATEGIC_PLAN:'STRATEGIC_PLAN',
  USERS:         'USERS',
  AUDIT_LOG:     'AUDIT_LOG',
  ERROR_LOG:     'ERROR_LOG'
};

// ─── Auth Guard ───────────────────────────────────────────

/**
 * ตรวจสอบ API_SECRET ก่อนทุก request ที่ write ข้อมูล
 * GET requests ที่ read-only ก็ต้อง verify เพื่อป้องกัน data leak
 */
function verifyToken(token) {
  if (!API_SECRET) {
    logError('SYSTEM', 'API_SECRET not configured in Script Properties');
    return false;
  }
  return token === API_SECRET;
}

function unauthorizedResponse() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Web App Entry Points ─────────────────────────────────

function doGet(e) {
  // ตรวจสอบ token จาก query parameter
  const token  = e?.parameter?.token || '';
  const action = e?.parameter?.action || 'ping';

  // ping ไม่ต้องการ token (สำหรับ health check)
  if (action !== 'ping' && !verifyToken(token)) {
    return unauthorizedResponse();
  }

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  try {
    let result;
    switch (action) {
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString(), version: '3.2' };
        break;
      case 'getKpiMaster':
        result = getCachedSheetData(spreadsheet, SHEETS.KPI_MASTER);
        break;
      case 'getKpiResults':
        result = getCachedSheetData(spreadsheet, SHEETS.KPI_RESULTS);
        break;
      case 'getDepartments':
        result = getCachedSheetData(spreadsheet, SHEETS.DEPARTMENTS);
        break;
      case 'getStrategicPlan':
        result = getCachedSheetData(spreadsheet, SHEETS.STRATEGIC_PLAN);
        break;
      case 'getUsers':
        result = getSheetData(spreadsheet, SHEETS.USERS); // ไม่ cache ข้อมูล user
        break;
      case 'getAuditLog':
        result = getSheetData(spreadsheet, SHEETS.AUDIT_LOG);
        break;
      case 'getAllData':
        result = {
          kpi_master:    getCachedSheetData(spreadsheet, SHEETS.KPI_MASTER),
          kpi_results:   getCachedSheetData(spreadsheet, SHEETS.KPI_RESULTS),
          departments:   getCachedSheetData(spreadsheet, SHEETS.DEPARTMENTS),
          strategic_plan:getCachedSheetData(spreadsheet, SHEETS.STRATEGIC_PLAN)
        };
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logError('doGet', error.message, action);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  try {
    const payload = JSON.parse(e?.postData?.contents || '{}');
    const action  = payload.action;

    // ✅ ตรวจสอบ token ทุก POST request ก่อนทำอะไรทั้งนั้น
    if (!verifyToken(payload.token)) {
      logError('doPost', 'Unauthorized request', action);
      return unauthorizedResponse();
    }

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
      case 'deleteKpi':
        result = deleteKpi(spreadsheet, payload.data);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logError('doPost', error.message);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Cache Layer ──────────────────────────────────────────

function getCachedSheetData(spreadsheet, sheetName) {
  const cache = CacheService.getScriptCache();
  const key   = 'cache_' + sheetName;
  const hit   = cache.get(key);

  if (hit) {
    try { return JSON.parse(hit); } catch (e) { /* cache miss */ }
  }

  const data = getSheetData(spreadsheet, sheetName);
  try {
    cache.put(key, JSON.stringify(data), 300); // 5 นาที
  } catch (e) {
    // ข้อมูลใหญ่เกิน cache limit (100KB) — fallback โดยไม่ cache
  }
  return data;
}

function invalidateCache(sheetName) {
  const cache = CacheService.getScriptCache();
  cache.remove('cache_' + sheetName);
}

// ─── Input Validation ─────────────────────────────────────

function validateKpiResult(data) {
  const required = ['kpi_id', 'year', 'month', 'actual_value'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  }
  if (typeof data.actual_value !== 'number' || isNaN(data.actual_value)) {
    throw new Error('actual_value must be a valid number');
  }
  if (data.month < 1 || data.month > 12) {
    throw new Error('month must be between 1 and 12');
  }
  if (data.year < 2560 || data.year > 2580) {
    throw new Error('year out of acceptable range (2560-2580)');
  }
  return true;
}

function validateKpiMaster(data) {
  const required = ['kpi_name', 'department', 'target_value'];
  for (const field of required) {
    if (!data[field] && data[field] !== 0) {
      throw new Error('Missing required field: ' + field);
    }
  }
  const validTypes = ['higher_better', 'lower_better', 'exact'];
  if (data.calculation_type && !validTypes.includes(data.calculation_type)) {
    throw new Error('Invalid calculation_type: ' + data.calculation_type);
  }
  if (data.weight !== undefined && (data.weight < 1 || data.weight > 10)) {
    throw new Error('weight must be between 1 and 10');
  }
  return true;
}

// ─── Sheet Data Helpers ───────────────────────────────────

function getSheetData(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });
    if (Object.values(row).some(v => v !== '' && v !== null)) {
      rows.push(row);
    }
  }

  return rows;
}

// ─── CRUD Operations ──────────────────────────────────────

function saveKpiResult(spreadsheet, data) {
  validateKpiResult(data); // throws on invalid

  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_RESULTS);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][0] === data.kpi_id &&
        existing[i][1] == data.year &&
        existing[i][3] == data.month) {
      sheet.getRange(i + 1, 5).setValue(data.actual_value);
      sheet.getRange(i + 1, 6).setValue(data.note || '');
      sheet.getRange(i + 1, 7).setValue(data.updated_by || 'system');
      sheet.getRange(i + 1, 8).setValue(new Date());
      invalidateCache(SHEETS.KPI_RESULTS);
      return { success: true, action: 'updated' };
    }
  }

  const quarter = Math.ceil(data.month / 3);
  sheet.appendRow([
    data.kpi_id, data.year, quarter, data.month,
    data.actual_value, data.note || '',
    data.updated_by || 'system', new Date()
  ]);

  invalidateCache(SHEETS.KPI_RESULTS);
  return { success: true, action: 'created' };
}

function createKpi(spreadsheet, data) {
  validateKpiMaster(data); // throws on invalid

  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const lastRow = sheet.getLastRow();
  const kpiId = 'KPI-' + String(lastRow + 100).padStart(3, '0');

  sheet.appendRow([
    kpiId, data.kpi_name, data.department, data.strategy || '',
    data.target_value, data.unit || '', data.weight || 5,
    data.calculation_type || 'higher_better', data.year || 2569,
    'active', data.description || ''
  ]);

  invalidateCache(SHEETS.KPI_MASTER);
  return { success: true, kpi_id: kpiId };
}

function updateKpi(spreadsheet, data) {
  if (!data.kpi_id) throw new Error('Missing required field: kpi_id');

  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.kpi_id) {
      if (data.kpi_name)                   sheet.getRange(i + 1, 2).setValue(data.kpi_name);
      if (data.target_value !== undefined)  sheet.getRange(i + 1, 5).setValue(data.target_value);
      if (data.weight !== undefined)        sheet.getRange(i + 1, 7).setValue(data.weight);
      if (data.status)                      sheet.getRange(i + 1, 10).setValue(data.status);
      invalidateCache(SHEETS.KPI_MASTER);
      return { success: true };
    }
  }

  return { success: false, error: 'KPI not found' };
}

function deleteKpi(spreadsheet, data) {
  if (!data.kpi_id) throw new Error('Missing required field: kpi_id');

  const sheet = spreadsheet.getSheetByName(SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.kpi_id) {
      // Soft delete — เปลี่ยน status แทนการลบจริง
      sheet.getRange(i + 1, 10).setValue('deleted');
      invalidateCache(SHEETS.KPI_MASTER);
      return { success: true, action: 'soft_deleted' };
    }
  }

  return { success: false, error: 'KPI not found' };
}

function createUser(spreadsheet, data) {
  if (!data.username || !data.role) throw new Error('Missing required fields: username, role');

  const sheet = spreadsheet.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'EXECUTIVE', 'STAFF'];
  if (!validRoles.includes(data.role)) throw new Error('Invalid role: ' + data.role);

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === data.username) return { success: false, error: 'Username already exists' };
  }

  const userId = 'USR-' + String(Date.now()).slice(-6);
  sheet.appendRow([
    userId, data.username, data.password_hash || '',
    data.display_name || data.username, data.role,
    data.department || '', data.email || '',
    'active', new Date(), ''
  ]);

  return { success: true, user_id: userId };
}

function logAudit(spreadsheet, data) {
  const sheet = spreadsheet.getSheetByName(SHEETS.AUDIT_LOG);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const logId = 'LOG-' + Date.now();
  sheet.appendRow([
    logId, data.user || 'system', data.action || '',
    data.target_type || '', data.target_id || '',
    new Date(), data.details || ''
  ]);

  return { success: true, log_id: logId };
}

// ─── Error Logging ────────────────────────────────────────

function logError(context, message, detail) {
  try {
    const ss   = SpreadsheetApp.openById(SHEET_ID);
    let sheet  = ss.getSheetByName(SHEETS.ERROR_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.ERROR_LOG);
      sheet.appendRow(['timestamp', 'context', 'message', 'detail']);
    }
    sheet.appendRow([new Date(), context, message, detail || '']);
  } catch (e) {
    // silently fail — prevent infinite loop
  }
}

// ─── Daily Backup (Time-based Trigger) ───────────────────

/**
 * เรียก setupBackupTrigger() ครั้งเดียวเพื่อสร้าง trigger อัตโนมัติ
 * จากนั้น dailyBackup() จะรันทุกวันเวลา 01:00 น. โดยอัตโนมัติ
 */
function setupBackupTrigger() {
  // ลบ trigger เดิมก่อน
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyBackup')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .atHour(1)
    .everyDays(1)
    .inTimezone('Asia/Bangkok')
    .create();

  return { success: true, message: 'Daily backup trigger created at 01:00 Bangkok time' };
}

function dailyBackup() {
  try {
    const ss           = SpreadsheetApp.openById(SHEET_ID);
    const folderId     = BACKUP_FOLDER;

    if (!folderId) {
      logError('dailyBackup', 'BACKUP_FOLDER not configured in Script Properties');
      return;
    }

    const folder       = DriveApp.getFolderById(folderId);
    const dateStr      = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
    const backupName   = `KPI_Backup_${dateStr}`;

    // สร้าง backup
    const backup = ss.copy(backupName);
    DriveApp.getFileById(backup.getId()).moveTo(folder);

    // ลบ backup ที่เก่ากว่า 30 วัน
    const files   = folder.getFiles();
    const backups = [];
    while (files.hasNext()) {
      const f = files.next();
      if (f.getName().startsWith('KPI_Backup_')) backups.push(f);
    }

    if (backups.length > 30) {
      backups
        .sort((a, b) => a.getDateCreated() - b.getDateCreated())
        .slice(0, backups.length - 30)
        .forEach(f => f.setTrashed(true));
    }

    logAudit(ss, {
      user: 'system',
      action: 'DAILY_BACKUP',
      target_type: 'spreadsheet',
      target_id: backup.getId(),
      details: backupName
    });

  } catch (e) {
    logError('dailyBackup', e.message);
  }
}

// ─── Cache Refresh (5-min Trigger) ───────────────────────

function refreshCache() {
  const cache = CacheService.getScriptCache();
  const ss    = SpreadsheetApp.openById(SHEET_ID);

  ['KPI_MASTER', 'KPI_RESULTS', 'DEPARTMENTS', 'STRATEGIC_PLAN'].forEach(name => {
    try {
      const data = getSheetData(ss, name);
      cache.put('cache_' + name, JSON.stringify(data), 300);
    } catch (e) {
      logError('refreshCache', e.message, name);
    }
  });

  return { success: true };
}

function setupScheduledRefresh() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'refreshCache')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('refreshCache')
    .timeBased()
    .everyMinutes(5)
    .create();

  return { success: true, message: '5-minute cache refresh trigger created' };
}

// ─── One-time Setup ───────────────────────────────────────

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  const sheetConfigs = [
    { name: SHEETS.KPI_MASTER,     headers: ['kpi_id','kpi_name','department','strategy','target_value','unit','weight','calculation_type','year','status','description'] },
    { name: SHEETS.KPI_RESULTS,    headers: ['kpi_id','year','quarter','month','actual_value','note','updated_by','updated_at'] },
    { name: SHEETS.DEPARTMENTS,    headers: ['dept_id','name','short','director_name','status'] },
    { name: SHEETS.STRATEGIC_PLAN, headers: ['strategy_id','name','thai','description','year','status'] },
    { name: SHEETS.USERS,          headers: ['user_id','username','password_hash','display_name','role','department','email','status','created_at','last_login'] },
    { name: SHEETS.AUDIT_LOG,      headers: ['log_id','user','action','target_type','target_id','timestamp','details'] },
    { name: SHEETS.ERROR_LOG,      headers: ['timestamp','context','message','detail'] }
  ];

  const results = [];

  sheetConfigs.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.getRange(1, 1, 1, config.headers.length)
        .setBackground('#2563eb')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      results.push({ sheet: config.name, action: 'created' });
    } else {
      results.push({ sheet: config.name, action: 'exists' });
    }
  });

  // Seed departments
  const deptSheet = ss.getSheetByName(SHEETS.DEPARTMENTS);
  if (deptSheet && deptSheet.getLastRow() < 2) {
    [
      ['DEPT-001','สำนักปลัดเทศบาล','ปลัด','','active'],
      ['DEPT-002','สำนักช่าง','ช่าง','','active'],
      ['DEPT-003','สำนักคลัง','คลัง','','active'],
      ['DEPT-004','สำนักสาธารณสุขและสิ่งแวดล้อม','สาธารณสุข','','active'],
      ['DEPT-005','สำนักการศึกษา','การศึกษา','','active'],
      ['DEPT-006','สำนักการประปา','ประปา','','active'],
      ['DEPT-007','กองยุทธศาสตร์และงบประมาณ','ยุทธศาสตร์','','active'],
      ['DEPT-008','กองสวัสดิการสังคม','สวัสดิการ','','active'],
      ['DEPT-009','กองสารสนเทศภาษีและทรัพย์สิน','ภาษี','','active'],
      ['DEPT-010','กองการเจ้าหน้าที่','เจ้าหน้าที่','','active'],
      ['DEPT-011','หน่วยตรวจสอบภายใน','ตรวจสอบ','','active']
    ].forEach(d => deptSheet.appendRow(d));
    results.push({ sheet: SHEETS.DEPARTMENTS, action: 'seeded 11 departments' });
  }

  // Seed admin user (password must be set via createUser with proper hash)
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  if (userSheet && userSheet.getLastRow() < 2) {
    userSheet.appendRow([
      'USR-001', 'admin', '', 'ผู้ดูแลระบบ', 'SUPER_ADMIN',
      'all', 'admin@municipality.go.th', 'active', new Date(), ''
    ]);
    results.push({ sheet: SHEETS.USERS, action: 'seeded admin user (set password immediately)' });
  }

  return { success: true, results };
}
