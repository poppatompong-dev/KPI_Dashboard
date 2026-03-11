/* =============================================
   AI Analysis Engine
   Smart City Municipal Data Platform
   =============================================
   Client-side statistical AI — no external APIs
   needed. All analysis runs locally for privacy.
   ============================================= */

const AIEngine = (() => {

  // ─── Trend Analysis (Linear Regression) ────
  /**
   * Calculate linear regression on data points
   * @param {number[]} values - Array of numeric values (ordered by time)
   * @returns {object} { slope, intercept, r2, trend }
   */
  function linearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0, trend: 'stable' };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
      sumY2 += values[i] * values[i];
    }

    const denom = (n * sumX2 - sumX * sumX);
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssRes += (values[i] - predicted) ** 2;
      ssTot += (values[i] - yMean) ** 2;
    }
    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    // Determine trend direction
    const threshold = 0.5; // minimum slope to be considered a trend
    let trend = 'stable';
    if (slope > threshold) trend = 'improving';
    else if (slope < -threshold) trend = 'declining';

    return { slope: Math.round(slope * 100) / 100, intercept, r2: Math.round(r2 * 1000) / 1000, trend };
  }

  /**
   * Get trend indicator emoji and label
   */
  function getTrendIndicator(trend) {
    switch (trend) {
      case 'improving': return { icon: '⬆', label: 'แนวโน้มดีขึ้น', color: 'green' };
      case 'declining': return { icon: '⬇', label: 'แนวโน้มลดลง', color: 'red' };
      default: return { icon: '→', label: 'คงที่', color: 'gray' };
    }
  }

  // ─── Risk Detection ────────────────────────
  /**
   * Calculate risk probability for a KPI
   * @param {object} kpi - KPI with score, trend data
   * @param {number[]} historicalScores - Past score values
   * @returns {object} { risk_probability, risk_level, factors }
   */
  function calculateRisk(kpi, historicalScores) {
    let riskScore = 0;
    const factors = [];

    // Factor 1: Current score below target (0-40 points)
    const scoreRatio = (kpi.score || 0) / 100;
    if (scoreRatio < 0.8) {
      riskScore += 40;
      factors.push('ผลงานต่ำกว่าเป้าหมายมาก');
    } else if (scoreRatio < 1.0) {
      riskScore += 20;
      factors.push('ผลงานใกล้เคียงเป้าหมาย');
    }

    // Factor 2: Declining trend (0-30 points)
    if (historicalScores.length >= 2) {
      const regression = linearRegression(historicalScores);
      if (regression.trend === 'declining') {
        riskScore += 30;
        factors.push('แนวโน้มลดลงต่อเนื่อง');
      }
    }

    // Factor 3: Volatility (0-15 points)
    if (historicalScores.length >= 3) {
      const stats = calcStats(historicalScores);
      const cv = stats.mean !== 0 ? stats.stddev / stats.mean : 0;
      if (cv > 0.15) {
        riskScore += 15;
        factors.push('ผลงานผันผวนสูง');
      }
    }

    // Factor 4: Weight importance (0-15 points)
    if ((kpi.weight || 0) >= 10) {
      riskScore += 15;
      factors.push('น้ำหนักสูง มีผลกระทบมาก');
    }

    const probability = Math.min(riskScore / 100, 1.0);
    let riskLevel = 'low';
    if (probability >= 0.7) riskLevel = 'critical';
    else if (probability >= 0.5) riskLevel = 'high';
    else if (probability >= 0.3) riskLevel = 'medium';

    return {
      risk_probability: Math.round(probability * 100) / 100,
      risk_level: riskLevel,
      factors
    };
  }

  /**
   * Detect all at-risk KPIs
   */
  function detectRiskKPIs(kpiList, historicalData) {
    return kpiList.map(kpi => {
      const history = (historicalData || [])
        .filter(h => h.kpi_id === kpi.kpi_id)
        .sort((a, b) => (a.month || 0) - (b.month || 0))
        .map(h => {
          const s = ScoringEngine.calculateKpiScore(
            kpi.target_value, h.actual_value, kpi.weight, kpi.calculation_type
          );
          return s.score;
        });

      const risk = calculateRisk(kpi, history);
      const trendResult = history.length >= 2 ? linearRegression(history) : { trend: 'stable', slope: 0 };

      return {
        kpi_id: kpi.kpi_id,
        kpi_name: kpi.kpi_name,
        department: kpi.department,
        current_score: kpi.score || 0,
        trend: trendResult.trend,
        trend_slope: trendResult.slope,
        ...risk
      };
    })
    .filter(k => k.risk_level !== 'low')
    .sort((a, b) => b.risk_probability - a.risk_probability);
  }

  // ─── Department Performance Analysis ───────
  /**
   * Analyze department performance with AI insights
   */
  function analyzeDepartmentPerformance(kpiList, historicalData) {
    const deptMap = {};

    kpiList.forEach(kpi => {
      const dept = kpi.department || 'ไม่ระบุ';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          kpis: [],
          totalWeight: 0,
          totalWeightedScore: 0,
          success: 0, risk: 0, failed: 0
        };
      }
      deptMap[dept].kpis.push(kpi);
      deptMap[dept].totalWeight += (kpi.weight || 0);
      deptMap[dept].totalWeightedScore += (kpi.weightedScore || 0);
      if (kpi.statusColor === 'green') deptMap[dept].success++;
      else if (kpi.statusColor === 'yellow') deptMap[dept].risk++;
      else deptMap[dept].failed++;
    });

    return Object.values(deptMap).map(dept => {
      const score = dept.totalWeight > 0
        ? Math.round((dept.totalWeightedScore / dept.totalWeight) * 100 * 100) / 100
        : 0;

      // Detect risk KPIs within this department
      const riskKpis = detectRiskKPIs(dept.kpis, historicalData);

      // Determine risk level
      let deptRiskLevel = 'low';
      if (dept.failed >= 3 || riskKpis.filter(r => r.risk_level === 'critical').length >= 2) {
        deptRiskLevel = 'critical';
      } else if (dept.failed >= 1 || riskKpis.length >= 2) {
        deptRiskLevel = 'high';
      } else if (dept.risk >= 2) {
        deptRiskLevel = 'medium';
      }

      // Generate issue summary
      const issueSummary = generateDeptIssueSummary(dept, riskKpis);

      return {
        department: dept.department,
        total_kpi: dept.kpis.length,
        success: dept.success,
        risk: dept.risk,
        failed: dept.failed,
        score,
        risk_level: deptRiskLevel,
        risk_kpis: riskKpis,
        issue_summary: issueSummary,
        failed_kpi_count: dept.failed
      };
    }).sort((a, b) => b.score - a.score);
  }

  function generateDeptIssueSummary(dept, riskKpis) {
    if (dept.failed === 0 && dept.risk === 0) {
      return `${dept.department}มีผลการดำเนินงานดีเยี่ยม ทุกตัวชี้วัดบรรลุเป้าหมาย`;
    }

    const parts = [];
    if (dept.failed > 0) {
      parts.push(`มี ${dept.failed} ตัวชี้วัดที่ต้องปรับปรุงเร่งด่วน`);
    }
    if (dept.risk > 0) {
      parts.push(`${dept.risk} ตัวชี้วัดอยู่ในเกณฑ์เฝ้าระวัง`);
    }
    if (riskKpis.length > 0) {
      const topRisk = riskKpis[0];
      parts.push(`โดยเฉพาะ "${topRisk.kpi_name}" ที่มี${getTrendIndicator(topRisk.trend).label}`);
    }

    return `${dept.department}${parts.join(' ')}`;
  }

  // ─── Anomaly Detection ─────────────────────
  /**
   * Detect anomalies using z-score method
   */
  function detectAnomalies(values, threshold = 2.0) {
    const stats = calcStats(values);
    const anomalies = [];

    values.forEach((v, i) => {
      if (stats.stddev === 0) return;
      const zScore = Math.abs((v - stats.mean) / stats.stddev);
      if (zScore > threshold) {
        anomalies.push({
          index: i,
          value: v,
          z_score: Math.round(zScore * 100) / 100,
          type: v > stats.mean ? 'unusually_high' : 'unusually_low'
        });
      }
    });

    return anomalies;
  }

  // ─── Prediction ────────────────────────────
  /**
   * Predict next period value using linear regression
   */
  function predictNextPeriod(historicalValues) {
    if (historicalValues.length < 2) return null;

    const reg = linearRegression(historicalValues);
    const nextIndex = historicalValues.length;
    const predicted = reg.slope * nextIndex + reg.intercept;

    // Confidence based on R²
    const confidence = reg.r2 > 0.7 ? 'high' : reg.r2 > 0.4 ? 'medium' : 'low';

    return {
      predicted_value: Math.round(predicted * 100) / 100,
      confidence,
      r2: reg.r2,
      trend: reg.trend
    };
  }

  // ─── Executive Insights (NLG) ──────────────
  /**
   * Generate natural language insights in Thai
   */
  function generateExecutiveInsights(analysisData) {
    const insights = [];
    const { summary, deptPerformance, riskKpis, kpiList } = analysisData;

    // Insight 1: Overall city performance
    if (summary) {
      const overallStatus = summary.overall_score >= 100 ? 'ดีเยี่ยม' :
        summary.overall_score >= 80 ? 'น่าพอใจ' : 'ต้องปรับปรุง';

      insights.push({
        type: 'overview',
        priority: 'info',
        icon: '📊',
        title: 'ภาพรวมผลการดำเนินงาน',
        text: `ผลการดำเนินงานรวมอยู่ในเกณฑ์${overallStatus} คะแนนรวม ${summary.overall_score}% จากตัวชี้วัดทั้งหมด ${summary.total_kpi} ตัว บรรลุเป้าหมาย ${summary.success_kpi} ตัว (${summary.total_kpi > 0 ? Math.round(summary.success_kpi / summary.total_kpi * 100) : 0}%)`
      });
    }

    // Insight 2: Top performing department
    if (deptPerformance && deptPerformance.length > 0) {
      const topDept = deptPerformance[0];
      insights.push({
        type: 'achievement',
        priority: 'success',
        icon: '🏆',
        title: 'หน่วยงานดีเด่น',
        text: `${topDept.department}มีผลการดำเนินงานสูงสุด คะแนน ${topDept.score}% จาก ${topDept.total_kpi} ตัวชี้วัด สำเร็จ ${topDept.success} ตัว`
      });
    }

    // Insight 3: Departments at risk
    if (deptPerformance) {
      const atRiskDepts = deptPerformance.filter(d => d.risk_level === 'high' || d.risk_level === 'critical');
      if (atRiskDepts.length > 0) {
        const deptNames = atRiskDepts.map(d => d.department).join(', ');
        insights.push({
          type: 'risk',
          priority: 'danger',
          icon: '⚠️',
          title: 'หน่วยงานที่ต้องเฝ้าระวัง',
          text: `${atRiskDepts.length} หน่วยงานมีความเสี่ยงสูง: ${deptNames} — ผู้บริหารควรติดตามผลอย่างใกล้ชิด`
        });
      }
    }

    // Insight 4: Declining KPIs
    if (riskKpis && riskKpis.length > 0) {
      const declining = riskKpis.filter(k => k.trend === 'declining');
      if (declining.length > 0) {
        const topDecline = declining.slice(0, 3);
        const kpiNames = topDecline.map(k => `"${k.kpi_name}"`).join(', ');
        insights.push({
          type: 'trend',
          priority: 'warning',
          icon: '📉',
          title: 'ตัวชี้วัดแนวโน้มลดลง',
          text: `พบ ${declining.length} ตัวชี้วัดที่มีแนวโน้มลดลงต่อเนื่อง ได้แก่ ${kpiNames} — ควรวิเคราะห์สาเหตุและวางแผนแก้ไข`
        });
      }
    }

    // Insight 5: Upcoming targets at risk
    if (riskKpis && riskKpis.length > 0) {
      const criticalRisks = riskKpis.filter(k => k.risk_probability >= 0.7);
      if (criticalRisks.length > 0) {
        insights.push({
          type: 'prediction',
          priority: 'danger',
          icon: '🔮',
          title: 'การพยากรณ์ความเสี่ยง',
          text: `มี ${criticalRisks.length} ตัวชี้วัดที่มีความน่าจะเป็นสูงว่าจะไม่บรรลุเป้าหมาย ควรดำเนินมาตรการแก้ไขโดยเร่งด่วน`
        });
      }
    }

    // Insight 6: Success rate comparison
    if (summary && summary.total_kpi > 0) {
      const successRate = Math.round(summary.success_kpi / summary.total_kpi * 100);
      if (successRate >= 80) {
        insights.push({
          type: 'performance',
          priority: 'success',
          icon: '✅',
          title: 'อัตราความสำเร็จ',
          text: `อัตราความสำเร็จของตัวชี้วัดอยู่ที่ ${successRate}% ซึ่งสูงกว่าเกณฑ์มาตรฐาน (80%) — แสดงถึงประสิทธิภาพการบริหารงานที่ดี`
        });
      } else {
        insights.push({
          type: 'performance',
          priority: 'warning',
          icon: '📋',
          title: 'อัตราความสำเร็จ',
          text: `อัตราความสำเร็จของตัวชี้วัดอยู่ที่ ${successRate}% ซึ่งต่ำกว่าเกณฑ์มาตรฐาน (80%) — ควรทบทวนแผนงานและจัดสรรทรัพยากรเพิ่มเติม`
        });
      }
    }

    return insights;
  }

  /**
   * Generate director-level insights for a specific department
   */
  function generateDirectorInsights(deptKpis, historicalData, deptName) {
    const insights = [];
    const riskKpis = detectRiskKPIs(deptKpis, historicalData);

    // Calculate department stats
    let success = 0, risk = 0, failed = 0;
    deptKpis.forEach(k => {
      if (k.statusColor === 'green') success++;
      else if (k.statusColor === 'yellow') risk++;
      else failed++;
    });

    // Overall department health
    const total = deptKpis.length;
    const successRate = total > 0 ? Math.round(success / total * 100) : 0;

    if (successRate >= 90) {
      insights.push({
        type: 'overview', priority: 'success', icon: '🎯',
        title: 'สรุปผลการดำเนินงาน',
        text: `${deptName}มีผลการดำเนินงานดีเยี่ยม (${successRate}%) จาก ${total} ตัวชี้วัด บรรลุเป้าหมาย ${success} ตัว`
      });
    } else if (failed > 0) {
      insights.push({
        type: 'overview', priority: 'danger', icon: '🎯',
        title: 'สรุปผลการดำเนินงาน',
        text: `${deptName}มี ${failed} ตัวชี้วัดที่ต่ำกว่าเป้าหมาย จำเป็นต้องปรับปรุงเร่งด่วน เพื่อยกระดับผลงานภาพรวม`
      });
    } else {
      insights.push({
        type: 'overview', priority: 'warning', icon: '🎯',
        title: 'สรุปผลการดำเนินงาน',
        text: `${deptName}มีผลงานใกล้เคียงเป้าหมาย (${successRate}%) แต่มี ${risk} ตัวชี้วัดที่ต้องเฝ้าระวัง`
      });
    }

    // Risk alerts
    if (riskKpis.length > 0) {
      const topRisks = riskKpis.slice(0, 3);
      topRisks.forEach(rk => {
        insights.push({
          type: 'risk', priority: 'warning', icon: '⚠️',
          title: `เฝ้าระวัง: ${rk.kpi_name}`,
          text: `${rk.kpi_name} มีความเสี่ยง ${Math.round(rk.risk_probability * 100)}% — ${rk.factors.join(', ')}`
        });
      });
    }

    // Top and bottom performers
    const sorted = [...deptKpis].sort((a, b) => (b.score || 0) - (a.score || 0));
    if (sorted.length >= 2) {
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      insights.push({
        type: 'comparison', priority: 'info', icon: '📊',
        title: 'เปรียบเทียบผลงาน',
        text: `KPI ที่ดีที่สุด: "${best.kpi_name}" (${best.score}%) | KPI ที่ต้องพัฒนา: "${worst.kpi_name}" (${worst.score}%)`
      });
    }

    return insights;
  }

  // ─── Risk Heatmap Data ─────────────────────
  /**
   * Generate risk heatmap data (department × risk level)
   */
  function generateRiskHeatmap(deptPerformance) {
    return deptPerformance.map(dept => ({
      department: dept.department,
      score: dept.score,
      risk_level: dept.risk_level,
      success_pct: dept.total_kpi > 0 ? Math.round(dept.success / dept.total_kpi * 100) : 0,
      risk_pct: dept.total_kpi > 0 ? Math.round(dept.risk / dept.total_kpi * 100) : 0,
      failed_pct: dept.total_kpi > 0 ? Math.round(dept.failed / dept.total_kpi * 100) : 0,
      color: dept.risk_level === 'critical' ? '#ef4444' :
             dept.risk_level === 'high' ? '#f59e0b' :
             dept.risk_level === 'medium' ? '#fbbf24' : '#10b981'
    }));
  }

  // ─── Strategy Progress ─────────────────────
  /**
   * Calculate strategic goal progress
   */
  function calculateStrategyProgress(kpiList) {
    const stratMap = {};
    kpiList.forEach(kpi => {
      const strat = kpi.strategy || 'ไม่ระบุ';
      if (!stratMap[strat]) {
        stratMap[strat] = { strategy: strat, kpis: [], totalWeight: 0, totalWeightedScore: 0, success: 0, total: 0 };
      }
      stratMap[strat].kpis.push(kpi);
      stratMap[strat].totalWeight += (kpi.weight || 0);
      stratMap[strat].totalWeightedScore += (kpi.weightedScore || 0);
      stratMap[strat].total++;
      if (kpi.statusColor === 'green') stratMap[strat].success++;
    });

    return Object.values(stratMap).map(s => ({
      strategy: s.strategy,
      total_kpi: s.total,
      success: s.success,
      progress: s.totalWeight > 0 ? Math.round((s.totalWeightedScore / s.totalWeight) * 100 * 100) / 100 : 0
    })).sort((a, b) => b.progress - a.progress);
  }

  // ─── Helpers ───────────────────────────────
  function calcStats(values) {
    const n = values.length;
    if (n === 0) return { mean: 0, stddev: 0, min: 0, max: 0 };
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    return {
      mean: Math.round(mean * 100) / 100,
      stddev: Math.round(Math.sqrt(variance) * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  // ─── Full Analysis Pipeline ────────────────
  /**
   * Run complete AI analysis
   */
  function runFullAnalysis(kpiList, historicalData) {
    const deptPerformance = analyzeDepartmentPerformance(kpiList, historicalData);
    const riskKpis = detectRiskKPIs(kpiList, historicalData);
    const summary = ScoringEngine.calculateDashboardSummary(kpiList);
    const strategyProgress = calculateStrategyProgress(kpiList);
    const riskHeatmap = generateRiskHeatmap(deptPerformance);

    const insights = generateExecutiveInsights({
      summary,
      deptPerformance,
      riskKpis,
      kpiList
    });

    return {
      summary,
      deptPerformance,
      riskKpis,
      insights,
      strategyProgress,
      riskHeatmap,
      analysisTimestamp: new Date().toISOString()
    };
  }

  return {
    linearRegression,
    getTrendIndicator,
    calculateRisk,
    detectRiskKPIs,
    analyzeDepartmentPerformance,
    detectAnomalies,
    predictNextPeriod,
    generateExecutiveInsights,
    generateDirectorInsights,
    generateRiskHeatmap,
    calculateStrategyProgress,
    runFullAnalysis,
    calcStats
  };
})();
