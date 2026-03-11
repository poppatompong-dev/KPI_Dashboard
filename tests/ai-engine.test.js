import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock the global ScoringEngine that AIEngine depends on
const ScoringEngine = require('../assets/js/scoring.js');
global.ScoringEngine = ScoringEngine;

const AIEngine = require('../assets/js/ai-engine.js');

describe('AIEngine', () => {
  describe('linearRegression', () => {
    it('should calculate upward trend correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const result = AIEngine.linearRegression(values);
      expect(result.slope).toBeGreaterThan(0);
      expect(result.trend).toBe('improving');
    });

    it('should calculate downward trend correctly', () => {
      const values = [50, 40, 30, 20, 10];
      const result = AIEngine.linearRegression(values);
      expect(result.slope).toBeLessThan(0);
      expect(result.trend).toBe('declining');
    });

    it('should handle stable data', () => {
      const values = [10, 10.1, 9.9, 10];
      const result = AIEngine.linearRegression(values);
      expect(result.trend).toBe('stable');
    });
  });

  describe('calculateRisk', () => {
    it('should detect critical risk for low score and declining trend', () => {
      const kpi = { score: 60, weight: 15 };
      const history = [80, 70, 60];
      const result = AIEngine.calculateRisk(kpi, history);
      expect(result.risk_level).toBe('critical');
      expect(result.factors).toContain('ผลงานต่ำกว่าเป้าหมายมาก');
      expect(result.factors).toContain('แนวโน้มลดลงต่อเนื่อง');
    });

    it('should detect low risk for high score', () => {
      const kpi = { score: 100, weight: 5 };
      const history = [100, 100, 100];
      const result = AIEngine.calculateRisk(kpi, history);
      expect(result.risk_level).toBe('low');
    });
  });

  describe('predictNextPeriod', () => {
    it('should predict next value based on trend', () => {
      const history = [10, 20, 30];
      const result = AIEngine.predictNextPeriod(history);
      expect(result.predicted_value).toBeCloseTo(40);
      expect(result.trend).toBe('improving');
    });
  });
});
