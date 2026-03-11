/**
 * =============================================
 *  Admin CRUD Operations — Google Apps Script
 *  KPI Master & Results management
 * =============================================
 */

// ─── KPI Master CRUD ─────────────────────────

/**
 * Save (Add or Update) a KPI Master record
 *
 * @param {object|string} kpiData - KPI data object or JSON string
 * @returns {object} { success, message, kpi_id }
 */
function saveKpiMaster(kpiData) {
  var data = (typeof kpiData === 'string') ? JSON.parse(kpiData) : kpiData;

  var sheet = getOrCreateSheet(CONFIG.SHEETS.KPI_MASTER, [
    'kpi_id', 'kpi_name', 'department', 'strategy', 'category',
    'target_value', 'unit', 'weight', 'calculation_type',
    'description', 'owner', 'year'
  ]);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var kpiIdCol = headers.indexOf('kpi_id');

  // Find existing row
  var existingRow = -1;
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][kpiIdCol] === data.kpi_id) {
      existingRow = i + 1; // 1-indexed
      break;
    }
  }

  // Build row data
  var rowData = headers.map(function(h) {
    return data[h] !== undefined ? data[h] : '';
  });

  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    // Add new row
    sheet.appendRow(rowData);
  }

  // Clear cache
  clearSheetCache(CONFIG.SHEETS.KPI_MASTER);

  return {
    success: true,
    message: existingRow > 0 ? 'อัปเดต KPI สำเร็จ' : 'เพิ่ม KPI ใหม่สำเร็จ',
    kpi_id: data.kpi_id
  };
}

/**
 * Delete a KPI Master record
 *
 * @param {string} kpiId - KPI ID to delete
 * @returns {object} { success, message }
 */
function deleteKpi(kpiId) {
  var sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.KPI_MASTER);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var kpiIdCol = headers.indexOf('kpi_id');

  for (var i = allData.length - 1; i >= 1; i--) {
    if (allData[i][kpiIdCol] === kpiId) {
      sheet.deleteRow(i + 1);

      // Also delete related results
      deleteKpiResults(kpiId);

      // Clear cache
      clearSheetCache(CONFIG.SHEETS.KPI_MASTER);
      clearSheetCache(CONFIG.SHEETS.KPI_RESULTS);

      return { success: true, message: 'ลบ KPI สำเร็จ: ' + kpiId };
    }
  }

  return { success: false, error: 'ไม่พบ KPI: ' + kpiId };
}

/**
 * Delete all results for a KPI
 */
function deleteKpiResults(kpiId) {
  var sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.KPI_RESULTS);
  if (!sheet) return;

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var kpiIdCol = headers.indexOf('kpi_id');

  // Delete from bottom to top to avoid index shift
  for (var i = allData.length - 1; i >= 1; i--) {
    if (allData[i][kpiIdCol] === kpiId) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ─── KPI Results CRUD ────────────────────────

/**
 * Save a KPI Result record
 *
 * @param {object|string} resultData - Result data object or JSON string
 * @returns {object} { success, message }
 */
function saveKpiResult(resultData) {
  var data = (typeof resultData === 'string') ? JSON.parse(resultData) : resultData;

  var sheet = getOrCreateSheet(CONFIG.SHEETS.KPI_RESULTS, [
    'record_id', 'kpi_id', 'year', 'quarter', 'month',
    'actual_value', 'note', 'updated_at'
  ]);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];

  // Calculate quarter from month
  var month = parseInt(data.month) || 0;
  var quarter = 0;
  if (month >= 10 && month <= 12) quarter = 1;
  else if (month >= 1 && month <= 3) quarter = 2;
  else if (month >= 4 && month <= 6) quarter = 3;
  else if (month >= 7 && month <= 9) quarter = 4;

  // Check for existing record (same kpi_id + year + month)
  var kpiIdCol = headers.indexOf('kpi_id');
  var yearCol = headers.indexOf('year');
  var monthCol = headers.indexOf('month');
  var existingRow = -1;

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][kpiIdCol] === data.kpi_id &&
        parseInt(allData[i][yearCol]) === parseInt(data.year) &&
        parseInt(allData[i][monthCol]) === month) {
      existingRow = i + 1;
      break;
    }
  }

  // Generate record_id if new
  var recordId = existingRow > 0
    ? allData[existingRow - 1][0]
    : 'REC-' + data.kpi_id + '-' + data.year + '-' + String(month).padStart(2, '0');

  var rowData = [
    recordId,
    data.kpi_id,
    parseInt(data.year),
    quarter,
    month,
    parseFloat(data.actual_value) || 0,
    data.note || '',
    new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Clear cache
  clearSheetCache(CONFIG.SHEETS.KPI_RESULTS);

  return {
    success: true,
    message: existingRow > 0 ? 'อัปเดตผลการดำเนินงานสำเร็จ' : 'บันทึกผลการดำเนินงานสำเร็จ',
    record_id: recordId
  };
}

/**
 * Bulk import KPI results (for batch data entry)
 *
 * @param {Array} results - Array of result data objects
 * @returns {object} { success, processed, errors }
 */
function bulkSaveKpiResults(results) {
  var dataArray = (typeof results === 'string') ? JSON.parse(results) : results;
  var processed = 0;
  var errors = [];

  dataArray.forEach(function(result, idx) {
    try {
      saveKpiResult(result);
      processed++;
    } catch (e) {
      errors.push({ index: idx, error: e.message });
    }
  });

  return {
    success: errors.length === 0,
    processed: processed,
    errors: errors
  };
}

// ─── Department CRUD ─────────────────────────

/**
 * Save a Department record
 */
function saveDepartment(deptData) {
  var data = (typeof deptData === 'string') ? JSON.parse(deptData) : deptData;

  var sheet = getOrCreateSheet(CONFIG.SHEETS.DEPARTMENTS, [
    'dept_id', 'dept_name', 'manager', 'division'
  ]);

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var deptIdCol = headers.indexOf('dept_id');

  var existingRow = -1;
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][deptIdCol] === data.dept_id) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = headers.map(function(h) {
    return data[h] !== undefined ? data[h] : '';
  });

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  clearSheetCache(CONFIG.SHEETS.DEPARTMENTS);

  return { success: true, message: 'บันทึกข้อมูลสำนัก/กอง สำเร็จ' };
}
