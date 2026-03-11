/* =============================================
   Audit Log System
   Municipal KPI Platform — Admin Back-Office
   =============================================
   Every important action is logged with user,
   action type, target, timestamp, and details.
   ============================================= */

const AuditLog = (() => {

  const STORE_KEY = 'kpi_audit_logs';
  const MAX_LOGS = 2000;

  // ─── Action Types ──────────────────────────
  const ACTION_TYPES = {
    LOGIN_SUCCESS:   { label: 'เข้าสู่ระบบ',      icon: '🔓', color: 'green' },
    LOGIN_FAILED:    { label: 'เข้าสู่ระบบล้มเหลว',  icon: '🚫', color: 'red' },
    LOGOUT:          { label: 'ออกจากระบบ',       icon: '🔒', color: 'gray' },
    CREATE_USER:     { label: 'สร้างผู้ใช้',       icon: '👤', color: 'blue' },
    UPDATE_USER:     { label: 'แก้ไขผู้ใช้',       icon: '✏️', color: 'blue' },
    DISABLE_USER:    { label: 'ระงับผู้ใช้',       icon: '⛔', color: 'red' },
    RESET_PASSWORD:  { label: 'รีเซ็ตรหัสผ่าน',    icon: '🔑', color: 'yellow' },
    CREATE_KPI:      { label: 'สร้าง KPI',        icon: '📊', color: 'green' },
    UPDATE_KPI:      { label: 'แก้ไข KPI',        icon: '📝', color: 'blue' },
    ARCHIVE_KPI:     { label: 'จัดเก็บ KPI',      icon: '📦', color: 'gray' },
    DELETE_KPI:      { label: 'ลบ KPI',           icon: '🗑️', color: 'red' },
    SAVE_RESULT:     { label: 'บันทึกผลงาน',      icon: '💾', color: 'green' },
    UPDATE_RESULT:   { label: 'แก้ไขผลงาน',       icon: '📝', color: 'blue' },
    IMPORT_DATA:     { label: 'นำเข้าข้อมูล',      icon: '📥', color: 'blue' },
    CREATE_DEPT:     { label: 'สร้างหน่วยงาน',     icon: '🏢', color: 'green' },
    UPDATE_DEPT:     { label: 'แก้ไขหน่วยงาน',     icon: '✏️', color: 'blue' },
    SYSTEM_ERROR:    { label: 'ข้อผิดพลาดระบบ',    icon: '⚠️', color: 'red' },
    DATA_VALIDATION: { label: 'ตรวจสอบข้อมูล',     icon: '🔍', color: 'yellow' }
  };

  // ─── Load / Save ───────────────────────────
  function _loadLogs() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function _saveLogs(logs) {
    // Trim to max size
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(logs.length - MAX_LOGS);
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(logs));
  }

  // ─── Public API ────────────────────────────

  /**
   * Log an action
   * @param {string} username - Who performed the action
   * @param {string} action - Action type key
   * @param {string} targetType - Type of target (user, kpi, result, department, system)
   * @param {string} targetId - ID of the target
   * @param {string} details - Human-readable description
   */
  function log(username, action, targetType, targetId, details) {
    const logs = _loadLogs();
    logs.push({
      log_id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user: username || 'system',
      action: action,
      target_type: targetType || '',
      target_id: targetId || '',
      timestamp: new Date().toISOString(),
      details: details || ''
    });
    _saveLogs(logs);
  }

  /**
   * Get all logs (newest first)
   */
  function getAll() {
    return _loadLogs().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get logs filtered
   */
  function search(filters) {
    let logs = getAll();

    if (filters.user) {
      logs = logs.filter(l => l.user.toLowerCase().includes(filters.user.toLowerCase()));
    }
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.targetType) {
      logs = logs.filter(l => l.target_type === filters.targetType);
    }
    if (filters.fromDate) {
      logs = logs.filter(l => l.timestamp >= filters.fromDate);
    }
    if (filters.toDate) {
      logs = logs.filter(l => l.timestamp <= filters.toDate);
    }

    return logs;
  }

  /**
   * Get recent logs (last N)
   */
  function getRecent(count) {
    return getAll().slice(0, count || 20);
  }

  /**
   * Get action stats for dashboard
   */
  function getStats() {
    const logs = _loadLogs();
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(l => l.timestamp.startsWith(today));

    const actionCounts = {};
    logs.forEach(l => {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });

    const loginFailures = logs.filter(l => l.action === 'LOGIN_FAILED');
    const recentErrors = logs.filter(l => l.action === 'SYSTEM_ERROR').slice(-5);

    return {
      total_logs: logs.length,
      today_actions: todayLogs.length,
      login_failures_total: loginFailures.length,
      recent_errors: recentErrors,
      action_counts: actionCounts
    };
  }

  /**
   * Clear all logs (admin only)
   */
  function clearAll() {
    localStorage.removeItem(STORE_KEY);
    log('system', 'SYSTEM_ERROR', 'system', '', 'ล้าง Audit Log ทั้งหมด');
  }

  return {
    log, getAll, search, getRecent, getStats, clearAll,
    ACTION_TYPES
  };
})();
