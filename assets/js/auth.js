/* =============================================
   Authentication & Session Management
   Municipal KPI Platform — Admin Back-Office
   =============================================
   Simple username/password auth with localStorage
   persistence. Designed for future migration to
   OAuth or token-based auth.
   ============================================= */

const Auth = (() => {

  const SESSION_KEY = 'kpi_session';
  const USERS_KEY = 'kpi_users';
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

  // ─── Default Users ─────────────────────────
  const DEFAULT_USERS = [
    {
      user_id: 'USR-001',
      username: 'admin',
      password: _hash('@dm!nP0p'),
      display_name: 'ผู้ดูแลระบบ',
      role: 'SUPER_ADMIN',
      department: 'all',
      status: 'active',
      email: 'admin@municipality.go.th',
      created_at: '2026-01-01T00:00:00',
      last_login: null
    },
    {
      user_id: 'USR-002',
      username: 'executive',
      password: _hash('Exec@2569'),
      display_name: 'นายกเทศมนตรี',
      role: 'EXECUTIVE',
      department: 'all',
      status: 'active',
      email: 'mayor@municipality.go.th',
      created_at: '2026-01-01T00:00:00',
      last_login: null
    },
    {
      user_id: 'USR-003',
      username: 'director_eng',
      password: _hash('Dir@2569'),
      display_name: 'ผอ.สำนักช่าง',
      role: 'DIRECTOR',
      department: 'สำนักช่าง',
      status: 'active',
      email: 'engineering@municipality.go.th',
      created_at: '2026-01-01T00:00:00',
      last_login: null
    },
    {
      user_id: 'USR-004',
      username: 'staff_finance',
      password: _hash('Staff@2569'),
      display_name: 'เจ้าหน้าที่สำนักคลัง',
      role: 'STAFF',
      department: 'สำนักคลัง',
      status: 'active',
      email: 'finance.staff@municipality.go.th',
      created_at: '2026-01-01T00:00:00',
      last_login: null
    },
    {
      user_id: 'USR-005',
      username: 'auditor',
      password: _hash('Audit@2569'),
      display_name: 'ผู้ตรวจสอบภายใน',
      role: 'AUDITOR',
      department: 'หน่วยตรวจสอบภายใน',
      status: 'active',
      email: 'audit@municipality.go.th',
      created_at: '2026-01-01T00:00:00',
      last_login: null
    }
  ];

  // ─── Role Definitions ──────────────────────
  const ROLES = {
    SUPER_ADMIN: {
      label: 'ผู้ดูแลระบบ',
      level: 0,
      permissions: ['*'], // All permissions
      color: '#8b5cf6'
    },
    EXECUTIVE: {
      label: 'ผู้บริหาร',
      level: 1,
      permissions: ['view_dashboard', 'view_reports', 'view_all_departments'],
      color: '#2563eb'
    },
    DIRECTOR: {
      label: 'ผู้อำนวยการ',
      level: 2,
      permissions: ['view_dashboard', 'view_own_department', 'enter_results'],
      color: '#0891b2'
    },
    STAFF: {
      label: 'เจ้าหน้าที่',
      level: 3,
      permissions: ['enter_results', 'view_own_department'],
      color: '#059669'
    },
    AUDITOR: {
      label: 'ผู้ตรวจสอบ',
      level: 4,
      permissions: ['view_dashboard', 'view_reports', 'view_audit_logs', 'view_all_departments'],
      color: '#d97706'
    }
  };

  // ─── Password Rules ────────────────────────
  const PASSWORD_RULES = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true
  };

  // ─── Simple Hash (not crypto-secure, placeholder) ─
  function _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
  }

  // ─── User Store ────────────────────────────
  function _loadUsers() {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    // Initialize with defaults
    _saveUsers(DEFAULT_USERS);
    return [...DEFAULT_USERS];
  }

  function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ─── Session Management ────────────────────
  function _getSession() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (!s) return null;
      const session = JSON.parse(s);
      // Check timeout
      if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
        logout();
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function _setSession(user) {
    const session = {
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      department: user.department,
      loginTime: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  // ─── Public API ────────────────────────────

  /**
   * Attempt to login
   * @returns {object} { success, session, error }
   */
  function login(username, password) {
    const users = _loadUsers();
    const user = users.find(u => u.username === username && u.status === 'active');

    if (!user) {
      AuditLog.log(username, 'LOGIN_FAILED', 'user', username, 'ชื่อผู้ใช้ไม่ถูกต้อง');
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    if (user.password !== _hash(password)) {
      AuditLog.log(username, 'LOGIN_FAILED', 'user', user.user_id, 'รหัสผ่านไม่ถูกต้อง');
      return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    // Update last_login
    user.last_login = new Date().toISOString();
    _saveUsers(users);

    const session = _setSession(user);
    AuditLog.log(user.username, 'LOGIN_SUCCESS', 'user', user.user_id, 'เข้าสู่ระบบสำเร็จ');
    return { success: true, session };
  }

  function logout() {
    const session = _getSession();
    if (session) {
      AuditLog.log(session.username, 'LOGOUT', 'user', session.user_id, 'ออกจากระบบ');
    }
    localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    return _getSession();
  }

  function isLoggedIn() {
    return _getSession() !== null;
  }

  function requireLogin() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function hasPermission(permission) {
    const session = _getSession();
    if (!session) return false;
    const role = ROLES[session.role];
    if (!role) return false;
    return role.permissions.includes('*') || role.permissions.includes(permission);
  }

  function hasRole(requiredRole) {
    const session = _getSession();
    if (!session) return false;
    if (session.role === 'SUPER_ADMIN') return true;
    return session.role === requiredRole;
  }

  function canAccessDepartment(dept) {
    const session = _getSession();
    if (!session) return false;
    if (session.department === 'all') return true;
    if (hasPermission('view_all_departments')) return true;
    return session.department === dept;
  }

  // ─── User CRUD ─────────────────────────────

  function getAllUsers() {
    return _loadUsers();
  }

  function getUserById(userId) {
    return _loadUsers().find(u => u.user_id === userId);
  }

  function createUser(userData) {
    const users = _loadUsers();

    // Check duplicate username
    if (users.find(u => u.username === userData.username)) {
      return { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
    }

    // Validate password
    const pwdValidation = validatePassword(userData.password);
    if (!pwdValidation.valid) {
      return { success: false, error: pwdValidation.errors.join(', ') };
    }

    const newUser = {
      user_id: 'USR-' + String(Date.now()).slice(-6),
      username: userData.username,
      password: _hash(userData.password),
      display_name: userData.display_name || userData.username,
      role: userData.role || 'STAFF',
      department: userData.department || 'all',
      status: userData.status || 'active',
      email: userData.email || '',
      created_at: new Date().toISOString(),
      last_login: null
    };

    users.push(newUser);
    _saveUsers(users);

    const session = _getSession();
    AuditLog.log(session?.username || 'system', 'CREATE_USER', 'user', newUser.user_id,
      `สร้างผู้ใช้ "${newUser.username}" บทบาท: ${ROLES[newUser.role]?.label}`);

    return { success: true, user: newUser };
  }

  function updateUser(userId, updates) {
    const users = _loadUsers();
    const idx = users.findIndex(u => u.user_id === userId);
    if (idx === -1) return { success: false, error: 'ไม่พบผู้ใช้' };

    // Check duplicate username if changing
    if (updates.username && updates.username !== users[idx].username) {
      if (users.find(u => u.username === updates.username)) {
        return { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
      }
    }

    // Hash password if changing
    if (updates.password) {
      const pwdValidation = validatePassword(updates.password);
      if (!pwdValidation.valid) {
        return { success: false, error: pwdValidation.errors.join(', ') };
      }
      updates.password = _hash(updates.password);
    }

    Object.assign(users[idx], updates);
    _saveUsers(users);

    const session = _getSession();
    AuditLog.log(session?.username || 'system', 'UPDATE_USER', 'user', userId,
      `แก้ไขผู้ใช้ "${users[idx].username}"`);

    return { success: true, user: users[idx] };
  }

  function resetPassword(userId, newPassword) {
    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return { success: false, error: pwdValidation.errors.join(', ') };
    }

    const result = updateUser(userId, { password: newPassword });
    if (result.success) {
      const session = _getSession();
      AuditLog.log(session?.username || 'system', 'RESET_PASSWORD', 'user', userId, 'รีเซ็ตรหัสผ่าน');
    }
    return result;
  }

  function validatePassword(pwd) {
    const errors = [];
    if (pwd.length < PASSWORD_RULES.minLength) errors.push(`ต้องมีอย่างน้อย ${PASSWORD_RULES.minLength} ตัวอักษร`);
    if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(pwd)) errors.push('ต้องมีตัวพิมพ์ใหญ่');
    if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(pwd)) errors.push('ต้องมีตัวพิมพ์เล็ก');
    if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(pwd)) errors.push('ต้องมีตัวเลข');
    if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"|,.<>?]/.test(pwd)) errors.push('ต้องมีอักขระพิเศษ');
    return { valid: errors.length === 0, errors };
  }

  // ─── Data Governance ───────────────────────

  function getDataGovernanceReport() {
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    const results = typeof DataPlatform !== 'undefined' ? DataPlatform.getResults() : [];
    const depts = typeof DataPlatform !== 'undefined' ? DataPlatform.getDepartments() : [];

    // Missing results: KPIs without any results
    const kpiIdsWithResults = new Set(results.map(r => r.kpi_id));
    const missingResults = kpis.filter(k => !kpiIdsWithResults.has(k.kpi_id));

    // Completeness by department
    const deptCompleteness = {};
    depts.forEach(d => {
      const deptKpis = kpis.filter(k => k.department === d.name);
      const deptWithResults = deptKpis.filter(k => kpiIdsWithResults.has(k.kpi_id));
      deptCompleteness[d.name] = {
        total: deptKpis.length,
        withData: deptWithResults.length,
        pct: deptKpis.length > 0 ? Math.round(deptWithResults.length / deptKpis.length * 100) : 0
      };
    });

    // Duplicate check
    const duplicates = [];
    const seen = new Set();
    results.forEach(r => {
      const key = `${r.kpi_id}-${r.year}-${r.month}`;
      if (seen.has(key)) duplicates.push(r);
      seen.add(key);
    });

    // Outlier detection
    const outliers = [];
    results.forEach(r => {
      if (r.actual_value < 0) {
        outliers.push({ ...r, issue: 'ค่าติดลบ' });
      }
    });

    return {
      total_kpis: kpis.length,
      total_results: results.length,
      missing_results: missingResults,
      dept_completeness: deptCompleteness,
      duplicates,
      outliers,
      overall_completeness: kpis.length > 0
        ? Math.round((kpis.length - missingResults.length) / kpis.length * 100) : 0
    };
  }

  return {
    login, logout, getSession, isLoggedIn, requireLogin,
    hasPermission, hasRole, canAccessDepartment,
    getAllUsers, getUserById, createUser, updateUser, resetPassword,
    validatePassword, getDataGovernanceReport,
    ROLES, PASSWORD_RULES,
    _hash // exposed for testing
  };
})();
