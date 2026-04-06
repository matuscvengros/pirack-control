import { describe, it, expect } from 'vitest';
import {
	smoothPath,
	smoothFillPath,
	valuesToPoints,
	valuesToPointsRange
} from '$lib/utils/smooth-path';

describe('smoothPath', () => {
	it('returns empty string for 0 points', () => {
		expect(smoothPath([])).toBe('');
	});

	it('returns empty string for 1 point', () => {
		expect(smoothPath([[10, 20]])).toBe('');
	});

	it('returns a line segment for 2 points', () => {
		const result = smoothPath([[0, 0], [100, 50]]);
		expect(result).toBe('M0,0 L100,50');
	});

	it('returns a cubic bezier path for 3 points', () => {
		const result = smoothPath([[0, 0], [50, 25], [100, 0]]);
		expect(result).toContain('M0,0');
		expect(result).toContain('C');
		// Should have 2 cubic bezier segments
		const cCount = (result.match(/ C/g) || []).length;
		expect(cCount).toBe(2);
	});

	it('returns a cubic bezier path for 4+ points', () => {
		const points: [number, number][] = [[0, 0], [25, 10], [50, 30], [75, 20], [100, 5]];
		const result = smoothPath(points);
		expect(result).toContain('M0,0');
		// Should have 4 cubic bezier segments (points.length - 1)
		const cCount = (result.match(/ C/g) || []).length;
		expect(cCount).toBe(4);
	});

	it('starts at the first point and ends at the last point', () => {
		const points: [number, number][] = [[10, 20], [50, 60], [90, 30]];
		const result = smoothPath(points);
		expect(result).toMatch(/^M10,20/);
		expect(result).toMatch(/90,30$/);
	});
});

describe('smoothFillPath', () => {
	it('returns empty string for fewer than 2 points', () => {
		expect(smoothFillPath([], 100, 50)).toBe('');
		expect(smoothFillPath([[10, 20]], 100, 50)).toBe('');
	});

	it('creates a closed path for 2+ points', () => {
		const result = smoothFillPath([[0, 10], [100, 20]], 100, 50);
		expect(result).toContain('M0,10');
		expect(result).toContain('L100,50');
		expect(result).toContain('L0,50');
		expect(result).toContain('Z');
	});

	it('uses the provided viewWidth and viewHeight for closing corners', () => {
		const result = smoothFillPath([[0, 5], [200, 15]], 200, 80);
		expect(result).toContain('L200,80');
		expect(result).toContain('L0,80');
	});
});

describe('valuesToPoints', () => {
	it('returns empty array for 0 values', () => {
		expect(valuesToPoints([], 100, 50)).toEqual([]);
	});

	it('returns empty array for 1 value', () => {
		expect(valuesToPoints([42], 100, 50)).toEqual([]);
	});

	it('returns correct number of points for 2+ values', () => {
		const points = valuesToPoints([10, 20, 30], 100, 50);
		expect(points.length).toBe(3);
	});

	it('first point x is 0, last point x is viewWidth', () => {
		const points = valuesToPoints([10, 20, 30], 100, 50);
		expect(points[0][0]).toBe(0);
		expect(points[2][0]).toBe(100);
	});

	it('points are evenly spaced on x axis', () => {
		const points = valuesToPoints([1, 2, 3, 4, 5], 200, 50);
		const step = 200 / 4; // viewWidth / (values.length - 1)
		for (let i = 0; i < points.length; i++) {
			expect(points[i][0]).toBeCloseTo(i * step);
		}
	});

	it('uses scale parameter for y values', () => {
		const pointsDefault = valuesToPoints([0, 100], 100, 50);
		const pointsCustom = valuesToPoints([0, 100], 100, 50, 0.5);
		// Higher scale means the max value reaches closer to the top
		// With scale=0.9, the max value's y = 50 - (100/100)*50*0.9 = 50 - 45 = 5
		// With scale=0.5, the max value's y = 50 - (100/100)*50*0.5 = 50 - 25 = 25
		expect(pointsDefault[1][1]).toBeCloseTo(5);
		expect(pointsCustom[1][1]).toBeCloseTo(25);
	});

	it('zero value maps to viewHeight', () => {
		const points = valuesToPoints([0, 100], 100, 50);
		expect(points[0][1]).toBeCloseTo(50);
	});

	it('treats max as at least 1 to avoid division by zero', () => {
		const points = valuesToPoints([0, 0], 100, 50);
		// All zeros: max = Math.max(0, 0, 1) = 1
		expect(points[0][1]).toBe(50);
		expect(points[1][1]).toBe(50);
	});
});

describe('valuesToPointsRange', () => {
	it('returns empty array for 0 or 1 values', () => {
		expect(valuesToPointsRange([], 100, 50)).toEqual([]);
		expect(valuesToPointsRange([42], 100, 50)).toEqual([]);
	});

	it('returns correct number of points for 2+ values', () => {
		const points = valuesToPointsRange([10, 20, 30], 100, 50);
		expect(points.length).toBe(3);
	});

	it('all same values still produces valid points', () => {
		const points = valuesToPointsRange([42, 42, 42], 100, 50);
		expect(points.length).toBe(3);
		// With all same values, range = (42+padding) - (42-padding) = 2*padding
		// All y values should be the same
		expect(points[0][1]).toBe(points[1][1]);
		expect(points[1][1]).toBe(points[2][1]);
	});

	it('handles negative values', () => {
		const points = valuesToPointsRange([-10, -5, 0], 100, 50);
		expect(points.length).toBe(3);
		// The highest value (0) should have the smallest y (closer to top)
		expect(points[2][1]).toBeLessThan(points[0][1]);
	});

	it('single range value (all same) does not divide by zero', () => {
		// When all values are the same, range = max - min = 0, but code uses || 1
		const points = valuesToPointsRange([5, 5], 100, 50);
		expect(points.length).toBe(2);
		// Should not produce NaN
		for (const pt of points) {
			expect(Number.isFinite(pt[0])).toBe(true);
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('first point x is 0, last point x is viewWidth', () => {
		const points = valuesToPointsRange([10, 20, 30], 100, 50);
		expect(points[0][0]).toBe(0);
		expect(points[2][0]).toBe(100);
	});

	it('respects padding parameter', () => {
		const pointsSmallPad = valuesToPointsRange([10, 20], 100, 50, 1);
		const pointsLargePad = valuesToPointsRange([10, 20], 100, 50, 10);
		// Different padding should produce different y coordinates
		expect(pointsSmallPad[0][1]).not.toBeCloseTo(pointsLargePad[0][1]);
	});

	it('respects scaleRatio parameter', () => {
		const pointsDefault = valuesToPointsRange([10, 20], 100, 50, 3, 0.9);
		const pointsHalf = valuesToPointsRange([10, 20], 100, 50, 3, 0.5);
		// Different scale ratios produce different y coordinates
		expect(pointsDefault[1][1]).not.toBeCloseTo(pointsHalf[1][1]);
	});
});
