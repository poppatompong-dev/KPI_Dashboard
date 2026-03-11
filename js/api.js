/* =============================================
   API Communication Layer
   Municipal KPI Dashboard
   ============================================= */

const API = (() => {
  // Google Apps Script Web App URL
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYGYtoaLhtH-GQuZZHdtLZM3Gg9B1A89fV6bHZNx5zbIvHar9JZFPMY3EajN_xLaM/exec';

  // Detect environment: Apps Script vs standalone
  const isAppsScriptEnv = typeof google !== 'undefined' && google.script;

  /**
   * Call a server-side function
   * When running inside Apps Script iframe: use google.script.run
   * When running standalone: use fetch() to the web app URL
   */
  function callServer(functionName, params = {}) {
    if (isAppsScriptEnv) {
      return callViaGoogleScript(functionName, params);
    } else {
      return callViaFetch(functionName, params);
    }
  }

  /**
   * Call via google.script.run (inside Apps Script web app)
   */
  function callViaGoogleScript(functionName, params) {
    return new Promise((resolve, reject) => {
      const runner = google.script.run
        .withSuccessHandler(response => {
          try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            resolve(data);
          } catch (e) {
            reject(new Error('Failed to parse response: ' + e.message));
          }
        })
        .withFailureHandler(error => {
          reject(error);
        });

      // Call the function with params
      if (Object.keys(params).length > 0) {
        runner[functionName](JSON.stringify(params));
      } else {
        runner[functionName]();
      }
    });
  }

  /**
   * Call via fetch (standalone mode)
   */
  function callViaFetch(functionName, params) {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', functionName);

    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key]);
    });

    return fetch(url.toString())
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      });
  }

  /**
   * POST request via fetch
   */
  function postToServer(functionName, payload) {
    if (isAppsScriptEnv) {
      return callViaGoogleScript(functionName, payload);
    }

    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: functionName, ...payload })
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      });
  }

  // ─── Public API Methods ───

  function getDashboardSummary(year, periodType, periodValue) {
    return callServer('getDashboardSummary', { year, periodType, periodValue });
  }

  function getDepartmentPerformance(year, periodType, periodValue) {
    return callServer('getDepartmentPerformance', { year, periodType, periodValue });
  }

  function getKpiTable(year, periodType, periodValue, department) {
    return callServer('getKpiTable', { year, periodType, periodValue, department });
  }

  function getKpiTrend(kpiId) {
    return callServer('getKpiTrend', { kpi_id: kpiId });
  }

  function getAllDashboardData(year, periodType, periodValue, department) {
    return callServer('getAllDashboardData', { year, periodType, periodValue, department });
  }

  function getDepartments() {
    return callServer('getDepartments', {});
  }

  function getStrategies() {
    return callServer('getStrategies', {});
  }

  // Admin operations
  function saveKpiMaster(kpiData) {
    return postToServer('saveKpiMaster', { kpiData });
  }

  function deleteKpi(kpiId) {
    return postToServer('deleteKpi', { kpi_id: kpiId });
  }

  function saveKpiResult(resultData) {
    return postToServer('saveKpiResult', { resultData });
  }

  function getKpiMasterList() {
    return callServer('getKpiMasterList', {});
  }

  return {
    callServer,
    getDashboardSummary,
    getDepartmentPerformance,
    getKpiTable,
    getKpiTrend,
    getAllDashboardData,
    getDepartments,
    getStrategies,
    saveKpiMaster,
    deleteKpi,
    saveKpiResult,
    getKpiMasterList
  };
})();
