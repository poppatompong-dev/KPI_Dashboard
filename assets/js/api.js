/* =============================================
   API Communication Layer v3.2
   Municipal KPI Dashboard — Security Hardened
   ============================================= */

const API = (() => {
  // GAS URL + Secret — อ่านจาก window.GAS_URL / window.API_SECRET
  // ซึ่ง inject มาจาก config.js (local) หรือ Vercel Environment Variables (production)
  const APPS_SCRIPT_URL =
    (typeof window !== 'undefined' && window.GAS_URL)
      ? window.GAS_URL
      : '%%GAS_URL%%';

  const API_SECRET =
    (typeof window !== 'undefined' && window.API_SECRET)
      ? window.API_SECRET
      : '';

  // Detect environment: Apps Script iframe vs standalone
  const isAppsScriptEnv = typeof google !== 'undefined' && google.script;

  // ─── Internal helpers ───────────────────────

  /**
   * สร้าง payload พร้อม token และ metadata
   */
  function buildPayload(action, data = {}) {
    return {
      action,
      token: API_SECRET, // ✅ ส่ง token ทุก POST request
      data,
      _meta: { ts: Date.now() }
    };
  }

  /**
   * GET request — ส่ง token เป็น query param
   */
  function callViaFetch(action, params = {}) {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('token', API_SECRET); // ✅ token ใน GET ด้วย
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));

    return fetch(url.toString())
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(e => { throw new Error('GET failed [' + action + ']: ' + e.message); });
  }

  /**
   * POST request พร้อม token
   */
  function postToServerFetch(action, data = {}) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(buildPayload(action, data))
    })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(result => {
        if (result.error === 'Unauthorized') throw new Error('Authentication failed');
        return result;
      })
      .catch(e => { throw new Error('POST failed [' + action + ']: ' + e.message); });
  }

  /**
   * Apps Script iframe mode
   */
  function callViaGoogleScript(functionName, params) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(r => {
          try { resolve(typeof r === 'string' ? JSON.parse(r) : r); }
          catch (e) { reject(new Error('Parse error: ' + e.message)); }
        })
        .withFailureHandler(reject)
        [functionName](JSON.stringify(params));
    });
  }

  function callServer(action, params = {}) {
    return isAppsScriptEnv
      ? callViaGoogleScript(action, params)
      : callViaFetch(action, params);
  }

  function postToServer(action, data = {}) {
    return isAppsScriptEnv
      ? callViaGoogleScript(action, data)
      : postToServerFetch(action, data);
  }

  // ─── Public API Methods ─────────────────────

  return {
    // Health check (no auth)
    ping: () => callServer('ping'),

    // Dashboard reads
    getDashboardSummary:    (y, pt, pv)     => callServer('getDashboardSummary',    { year: y, periodType: pt, periodValue: pv }),
    getDepartmentPerformance:(y, pt, pv)    => callServer('getDepartmentPerformance',{ year: y, periodType: pt, periodValue: pv }),
    getKpiTable:            (y, pt, pv, d)  => callServer('getKpiTable',            { year: y, periodType: pt, periodValue: pv, department: d }),
    getKpiTrend:            kpiId           => callServer('getKpiTrend',             { kpi_id: kpiId }),
    getAllDashboardData:     (y, pt, pv, d)  => callServer('getAllDashboardData',     { year: y, periodType: pt, periodValue: pv, department: d }),
    getDepartments:         ()              => callServer('getDepartments',          {}),
    getStrategies:          ()              => callServer('getStrategies',           {}),
    getKpiMasterList:       ()              => callServer('getKpiMasterList',        {}),

    // Writes (require token)
    saveKpiMaster:  data   => postToServer('saveResult',  data),
    saveKpiResult:  data   => postToServer('saveResult',  data),
    createKpi:      data   => postToServer('createKpi',   data),
    updateKpi:      data   => postToServer('updateKpi',   data),
    deleteKpi:      kpiId  => postToServer('deleteKpi',   { kpi_id: kpiId }),
    createUser:     data   => postToServer('createUser',  data),
    logAudit:       data   => postToServer('logAudit',    data),

    // Expose for advanced use
    callServer,
    postToServer
  };
})();
