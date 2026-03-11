/* =============================================
   KPI Scoring Engine
   Municipal Performance Management System
   ============================================= */

const ScoringEngine = (() => {

  /**
   * Calculate KPI score based on calculation type
   * @param {number} target  - Target value
   * @param {number} actual  - Actual achieved value
   * @param {number} weight  - Weight (0-100, will be converted to decimal)
   * @param {string} calculationType - 'higher_better' | 'lower_better' | 'percentage'
   * @returns {object} { score, weightedScore, status, statusColor, percent }
   */
  function calculateKpiScore(target, actual, weight, calculationType) {
    if (target == null || actual == null || isNaN(target) || isNaN(actual)) {
      return {
        score: 0,
        weightedScore: 0,
        status: 'ไม่มีข้อมูล',
        statusColor: 'gray',
        percent: 0
      };
    }

    let score = 0;

    switch (calculationType) {
      case 'higher_better':
        score = target !== 0 ? actual / target : 0;
        break;

      case 'lower_better':
        score = actual !== 0 ? target / actual : (target === 0 ? 1 : 0);
        break;

      case 'percentage':
        score = actual / 100;
        break;

      default:
        score = target !== 0 ? actual / target : 0;
    }

    // Cap score at 1.2 (120%)
    score = Math.min(score, 1.2);

    // Ensure non-negative
    score = Math.max(score, 0);

    // Weighted score (weight is 0-100, convert to fraction)
    const weightFraction = (weight || 0) / 100;
    const weightedScore = score * weightFraction;

    // Determine status
    const { status, statusColor } = getStatus(score);

    return {
      score: Math.round(score * 10000) / 100,       // as percentage, 2 decimals
      weightedScore: Math.round(weightedScore * 10000) / 100,
      status,
      statusColor,
      percent: Math.round(score * 100)
    };
  }

  /**
   * Get KPI status based on score ratio
   * @param {number} scoreRatio - raw ratio (e.g. 1.0 = 100%)
   * @returns {object} { status, statusColor }
   */
  function getStatus(scoreRatio) {
    if (scoreRatio >= 1.0) {
      return { status: 'บรรลุเป้าหมาย', statusColor: 'green' };
    } else if (scoreRatio >= 0.8) {
      return { status: 'เฝ้าระวัง', statusColor: 'yellow' };
    } else {
      return { status: 'ต้องปรับปรุง', statusColor: 'red' };
    }
  }

  /**
   * Calculate overall dashboard summary from a list of scored KPIs
   * @param {Array} kpiList - Array of KPI objects with score data
   * @returns {object} summary stats
   */
  function calculateDashboardSummary(kpiList) {
    const total = kpiList.length;
    let success = 0, risk = 0, failed = 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    kpiList.forEach(kpi => {
      if (kpi.statusColor === 'green') success++;
      else if (kpi.statusColor === 'yellow') risk++;
      else if (kpi.statusColor === 'red') failed++;

      totalWeightedScore += kpi.weightedScore || 0;
      totalWeight += (kpi.weight || 0);
    });

    // Overall score: sum of weighted scores / total weight * 100
    const overallScore = totalWeight > 0
      ? Math.round((totalWeightedScore / totalWeight) * 100 * 100) / 100
      : 0;

    return {
      total_kpi: total,
      success_kpi: success,
      risk_kpi: risk,
      failed_kpi: failed,
      overall_score: overallScore
    };
  }

  /**
   * Calculate department-level performance
   * @param {Array} kpiList - Array of KPI objects with department info
   * @returns {Array} department performance array
   */
  function calculateDepartmentPerformance(kpiList) {
    const deptMap = {};

    kpiList.forEach(kpi => {
      const dept = kpi.department || 'ไม่ระบุ';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          kpis: [],
          totalWeight: 0,
          totalWeightedScore: 0,
          success: 0,
          risk: 0,
          failed: 0
        };
      }
      deptMap[dept].kpis.push(kpi);
      deptMap[dept].totalWeight += (kpi.weight || 0);
      deptMap[dept].totalWeightedScore += (kpi.weightedScore || 0);

      if (kpi.statusColor === 'green') deptMap[dept].success++;
      else if (kpi.statusColor === 'yellow') deptMap[dept].risk++;
      else deptMap[dept].failed++;
    });

    return Object.values(deptMap).map(dept => ({
      department: dept.department,
      total_kpi: dept.kpis.length,
      success: dept.success,
      risk: dept.risk,
      failed: dept.failed,
      score: dept.totalWeight > 0
        ? Math.round((dept.totalWeightedScore / dept.totalWeight) * 100 * 100) / 100
        : 0
    })).sort((a, b) => b.score - a.score);
  }

  return {
    calculateKpiScore,
    getStatus,
    calculateDashboardSummary,
    calculateDepartmentPerformance
  };
})();

// Export for module systems or keep global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoringEngine;
}
