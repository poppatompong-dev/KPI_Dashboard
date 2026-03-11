/**
 * =============================================
 *  KPI Scoring Engine — Google Apps Script
 *  Server-side scoring calculations
 * =============================================
 */

/**
 * Calculate KPI score (server-side, GS suffix to avoid conflict)
 *
 * @param {number} target - Target value
 * @param {number} actual - Actual achieved value
 * @param {number} weight - Weight (0-100)
 * @param {string} calculationType - 'higher_better' | 'lower_better' | 'percentage'
 * @returns {object} { score, weightedScore, status, statusColor, percent }
 */
function calculateKpiScoreGS(target, actual, weight, calculationType) {
  // Handle missing data
  if (actual === null || actual === undefined || isNaN(actual)) {
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
      // Higher actual is better: score = actual / target
      score = (target && target !== 0) ? actual / target : 0;
      break;

    case 'lower_better':
      // Lower actual is better: score = target / actual
      // If actual is 0 and target is 0, perfect score
      if (actual === 0) {
        score = (target === 0) ? 1.0 : 1.2; // Can't do better than 0
      } else {
        score = target / actual;
      }
      break;

    case 'percentage':
      // Direct percentage: score = actual / 100
      score = actual / 100;
      break;

    default:
      // Default to higher_better
      score = (target && target !== 0) ? actual / target : 0;
  }

  // Cap at 120% (1.2)
  score = Math.min(score, 1.2);

  // Floor at 0
  score = Math.max(score, 0);

  // Convert weight from 0-100 to 0-1
  var weightFraction = (weight || 0) / 100;
  var weightedScore = score * weightFraction;

  // Determine status
  var status, statusColor;
  if (score >= 1.0) {
    status = 'บรรลุเป้าหมาย';
    statusColor = 'green';
  } else if (score >= 0.8) {
    status = 'เฝ้าระวัง';
    statusColor = 'yellow';
  } else {
    status = 'ต้องปรับปรุง';
    statusColor = 'red';
  }

  return {
    score: Math.round(score * 10000) / 100,           // e.g., 95.24 (%)
    weightedScore: Math.round(weightedScore * 10000) / 100,
    status: status,
    statusColor: statusColor,
    percent: Math.round(score * 100)                    // e.g., 95
  };
}

/**
 * Batch score multiple KPIs
 *
 * @param {Array} kpiList - Array of { target, actual, weight, calculation_type }
 * @returns {Array} Array of score results
 */
function batchScoreKpis(kpiList) {
  return kpiList.map(function(kpi) {
    return calculateKpiScoreGS(
      parseFloat(kpi.target) || 0,
      parseFloat(kpi.actual),
      parseFloat(kpi.weight) || 0,
      kpi.calculation_type || 'higher_better'
    );
  });
}

/**
 * Calculate aggregated score for a department
 *
 * @param {Array} deptKpis - Array of scored KPI objects
 * @returns {object} { totalKpi, avgScore, weightedAvg, success, risk, failed }
 */
function calculateDeptScore(deptKpis) {
  var totalWeight = 0;
  var totalWeightedScore = 0;
  var success = 0, risk = 0, failed = 0;

  deptKpis.forEach(function(kpi) {
    totalWeight += (kpi.weight || 0);
    totalWeightedScore += (kpi.weightedScore || 0);

    if (kpi.statusColor === 'green') success++;
    else if (kpi.statusColor === 'yellow') risk++;
    else failed++;
  });

  var weightedAvg = totalWeight > 0
    ? Math.round((totalWeightedScore / totalWeight) * 100 * 100) / 100
    : 0;

  return {
    totalKpi: deptKpis.length,
    weightedAvg: weightedAvg,
    success: success,
    risk: risk,
    failed: failed
  };
}
