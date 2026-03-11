import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// In Node environment, these files are treated as CJS due to the module.exports check we added
const ScoringEngine = require('../assets/js/scoring.js');

describe('ScoringEngine', () => {
  describe('calculateKpiScore', () => {
    it('should calculate "higher_better" correctly when actual >= target', () => {
      const result = ScoringEngine.calculateKpiScore(100, 110, 10, 'higher_better');
      expect(result.score).toBe(110);
      expect(result.weightedScore).toBe(11); // 110% of 10
      expect(result.statusColor).toBe('green');
    });

    it('should calculate "higher_better" correctly when actual < target', () => {
      const result = ScoringEngine.calculateKpiScore(100, 75, 10, 'higher_better');
      expect(result.score).toBe(75);
      expect(result.statusColor).toBe('red');
    });

    it('should cap score at 120%', () => {
      const result = ScoringEngine.calculateKpiScore(100, 150, 10, 'higher_better');
      expect(result.score).toBe(120);
    });

    it('should handle "lower_better" correctly', () => {
      // If target is 10 and actual is 5, it means we performed better.
      // logic: actual !== 0 ? target / actual
      const result = ScoringEngine.calculateKpiScore(10, 5, 10, 'lower_better');
      expect(result.score).toBe(120); // 10/5 = 2.0, capped at 1.2
    });

    it('should handle zero target', () => {
      const result = ScoringEngine.calculateKpiScore(0, 10, 10, 'higher_better');
      expect(result.score).toBe(0);
    });

    it('should return gray status for null values', () => {
      const result = ScoringEngine.calculateKpiScore(null, 10, 10, 'higher_better');
      expect(result.statusColor).toBe('gray');
    });
  });

  describe('getStatus', () => {
    it('should return green for score >= 1.0', () => {
      expect(ScoringEngine.getStatus(1.0).statusColor).toBe('green');
      expect(ScoringEngine.getStatus(1.2).statusColor).toBe('green');
    });

    it('should return yellow for 0.8 <= score < 1.0', () => {
      expect(ScoringEngine.getStatus(0.85).statusColor).toBe('yellow');
    });

    it('should return red for score < 0.8', () => {
      expect(ScoringEngine.getStatus(0.7).statusColor).toBe('red');
    });
  });
});
