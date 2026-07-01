import { describe, it, expect } from 'vitest';
import { cn, calculateRDS, getStatusColor, getScoreColor } from './utils';

describe('cn (className merge utility)', () => {
  it('merges class names with clsx and tailwind-merge', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('handles falsy values', () => {
    const result = cn('base', false && 'skip-class', null, undefined);
    expect(result).toContain('base');
  });
});

describe('calculateRDS (Road Damage Score)', () => {
  it('returns 100 for empty detections array', () => {
    const result = calculateRDS([]);
    expect(result).toBe(100);
  });

  it('applies correct penalty for pothole detection', () => {
    const detections = [{ class: 'pothole' }];
    const result = calculateRDS(detections);
    expect(result).toBe(90); // 100 - 10
  });

  it('applies correct penalty for linear crack detection', () => {
    const detections = [{ class: 'linear crack' }];
    const result = calculateRDS(detections);
    expect(result).toBe(95); // 100 - 5
  });

  it('applies correct penalty for alligator crack detection', () => {
    const detections = [{ class: 'alligator crack' }];
    const result = calculateRDS(detections);
    expect(result).toBe(93); // 100 - 7
  });

  it('accumulates penalties for multiple detections', () => {
    const detections = [
      { class: 'pothole' },
      { class: 'linear crack' },
      { class: 'alligator crack' },
    ];
    const result = calculateRDS(detections);
    // 10 + 5 + 7 = 22 penalty
    expect(result).toBe(78); // 100 - 22
  });

  it('handles multiple potholes', () => {
    const detections = [
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
    ];
    const result = calculateRDS(detections);
    // 30 penalty
    expect(result).toBe(70);
  });

  it('returns 0 when penalties exceed 100', () => {
    const detections = [
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
      { class: 'pothole' },
    ];
    const result = calculateRDS(detections);
    // 110 penalty, but Math.max ensures 0 minimum
    expect(result).toBe(0);
  });

  it('handles unknown damage classes with no penalty', () => {
    const detections = [
      { class: 'pothole' },
      { class: 'unknown_damage' },
    ];
    const result = calculateRDS(detections);
    // Only pothole penalty (10), unknown is 0
    expect(result).toBe(90);
  });

  it('returns 0 at minimum regardless of penalty amount', () => {
    const detections = Array(15).fill({ class: 'pothole' });
    const result = calculateRDS(detections);
    expect(result).toBe(0);
  });
});

describe('getStatusColor', () => {
  it('returns yellow color for pending status', () => {
    const result = getStatusColor('pending');
    expect(result).toContain('brand-yellow');
  });

  it('returns blue color for reviewed status', () => {
    const result = getStatusColor('reviewed');
    expect(result).toContain('brand-blue');
  });

  it('returns green color for ditingkatkan status', () => {
    const result = getStatusColor('diteruskan');
    expect(result).toContain('green');
  });

  it('returns default gray for unknown status', () => {
    const result = getStatusColor('unknown');
    expect(result).toContain('slate');
  });
});

describe('getScoreColor', () => {
  it('returns green for score >= 80', () => {
    const result = getScoreColor(80);
    expect(result).toContain('green');
  });

  it('returns green for score 95', () => {
    const result = getScoreColor(95);
    expect(result).toContain('green');
  });

  it('returns yellow for score between 50 and 79', () => {
    const result = getScoreColor(65);
    expect(result).toContain('brand-yellow');
  });

  it('returns yellow for score 50', () => {
    const result = getScoreColor(50);
    expect(result).toContain('brand-yellow');
  });

  it('returns red for score below 50', () => {
    const result = getScoreColor(30);
    expect(result).toContain('red');
  });

  it('returns red for score 0', () => {
    const result = getScoreColor(0);
    expect(result).toContain('red');
  });
});

describe('RDS Score Interpretation', () => {
  it('high score (80-100) indicates light damage', () => {
    // Only small penalty, high score
    const detections = [{ class: 'linear crack' }];
    const score = calculateRDS(detections);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('medium score (50-79) indicates moderate damage', () => {
    // Multiple or more severe damage
    const detections = [
      { class: 'pothole' },
      { class: 'linear crack' },
    ];
    const score = calculateRDS(detections);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(80);
  });

  it('low score (0-49) indicates severe damage', () => {
    // Multiple severe damages
    const detections = [
      { class: 'pothole' },
      { class: 'alligator crack' },
      { class: 'pothole' },
    ];
    const score = calculateRDS(detections);
    expect(score).toBeLessThan(50);
  });
});