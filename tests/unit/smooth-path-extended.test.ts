import { describe, it, expect } from 'vitest';
import {
	smoothPath,
	smoothFillPath,
	valuesToPoints,
	valuesToPointsRange
} from '$lib/utils/smooth-path';

describe('smoothPath extended', () => {
	it('produces consistent output for identical inputs', () => {
		const points: [number, number][] = [[0, 0], [50, 25], [100, 0]];
		const a = smoothPath(points);
		const b = smoothPath(points);
		expect(a).toBe(b);
	});

	it('handles very large coordinate values', () => {
		const points: [number, number][] = [[0, 0], [1e6, 1e6], [2e6, 0]];
		const result = smoothPath(points);
		expect(result).toContain('M0,0');
		expect(result).toContain('C');
	});

	it('handles negative coordinate values', () => {
		const points: [number, number][] = [[-100, -50], [0, 0], [100, 50]];
		const result = smoothPath(points);
		expect(result).toContain('M-100,-50');
		expect(result).toMatch(/100,50$/);
	});

	it('handles fractional coordinate values', () => {
		const points: [number, number][] = [[0.5, 1.5], [2.5, 3.5], [4.5, 5.5]];
		const result = smoothPath(points);
		expect(result).toContain('M0.5,1.5');
		expect(result).toMatch(/4\.5,5\.5$/);
	});

	it('handles collinear points (all on a straight line)', () => {
		const points: [number, number][] = [[0, 0], [50, 50], [100, 100]];
		const result = smoothPath(points);
		expect(result).toContain('M0,0');
		expect(result).toContain('C');
	});

	it('handles duplicate points', () => {
		const points: [number, number][] = [[50, 50], [50, 50], [50, 50]];
		const result = smoothPath(points);
		expect(result).toContain('M50,50');
		// Should not throw or produce NaN
		expect(result).not.toContain('NaN');
	});

	it('handles two identical points', () => {
		const points: [number, number][] = [[50, 50], [50, 50]];
		const result = smoothPath(points);
		expect(result).toBe('M50,50 L50,50');
	});

	it('produces exactly N-1 cubic segments for N points (N >= 3)', () => {
		for (let n = 3; n <= 10; n++) {
			const points: [number, number][] = Array.from({ length: n }, (_, i) => [i * 10, i * 5]);
			const result = smoothPath(points);
			const cCount = (result.match(/ C/g) || []).length;
			expect(cCount).toBe(n - 1);
		}
	});
});

describe('smoothFillPath extended', () => {
	it('closes path correctly for 3+ points', () => {
		const points: [number, number][] = [[0, 10], [50, 5], [100, 15]];
		const result = smoothFillPath(points, 100, 50);
		expect(result).toContain('Z');
		expect(result).toContain('L100,50');
		expect(result).toContain('L0,50');
	});

	it('uses viewWidth=0 and viewHeight=0 without error', () => {
		const points: [number, number][] = [[0, 0], [0, 0]];
		const result = smoothFillPath(points, 0, 0);
		expect(result).toContain('L0,0');
		expect(result).toContain('Z');
	});

	it('handles large viewWidth and viewHeight', () => {
		const points: [number, number][] = [[0, 10], [5000, 20]];
		const result = smoothFillPath(points, 5000, 3000);
		expect(result).toContain('L5000,3000');
		expect(result).toContain('L0,3000');
	});
});

describe('valuesToPoints extended', () => {
	it('handles all identical non-zero values', () => {
		const points = valuesToPoints([50, 50, 50], 100, 50);
		expect(points.length).toBe(3);
		// All y values should be the same since all inputs are the same
		expect(points[0][1]).toBe(points[1][1]);
		expect(points[1][1]).toBe(points[2][1]);
	});

	it('handles very large values', () => {
		const points = valuesToPoints([1e9, 2e9, 3e9], 100, 50);
		expect(points.length).toBe(3);
		for (const pt of points) {
			expect(Number.isFinite(pt[0])).toBe(true);
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('handles mixed zero and non-zero values', () => {
		const points = valuesToPoints([0, 100, 0], 100, 50);
		expect(points.length).toBe(3);
		// Zero values should be at viewHeight
		expect(points[0][1]).toBeCloseTo(50);
		expect(points[2][1]).toBeCloseTo(50);
		// Max value (100) should be closer to top
		expect(points[1][1]).toBeLessThan(50);
	});

	it('returns points with ascending x values', () => {
		const points = valuesToPoints([10, 20, 30, 40, 50], 200, 100);
		for (let i = 1; i < points.length; i++) {
			expect(points[i][0]).toBeGreaterThan(points[i - 1][0]);
		}
	});

	it('handles scale=0', () => {
		const points = valuesToPoints([10, 20, 30], 100, 50, 0);
		// With scale=0, all y values = viewHeight - 0 = viewHeight
		for (const pt of points) {
			expect(pt[1]).toBeCloseTo(50);
		}
	});

	it('handles scale=1', () => {
		const points = valuesToPoints([0, 100], 100, 50, 1);
		// Max value: y = 50 - (100/100)*50*1 = 0
		expect(points[1][1]).toBeCloseTo(0);
		// Zero value: y = 50
		expect(points[0][1]).toBeCloseTo(50);
	});

	it('handles 2 values (minimum for output)', () => {
		const points = valuesToPoints([10, 20], 100, 50);
		expect(points.length).toBe(2);
		expect(points[0][0]).toBe(0);
		expect(points[1][0]).toBe(100);
	});

	it('y values decrease as input values increase', () => {
		const points = valuesToPoints([10, 20, 30], 100, 50);
		// Higher values should have lower y (closer to top)
		expect(points[2][1]).toBeLessThan(points[0][1]);
	});
});

describe('valuesToPointsRange extended', () => {
	it('handles large ranges', () => {
		const points = valuesToPointsRange([0, 1000], 100, 50);
		expect(points.length).toBe(2);
		for (const pt of points) {
			expect(Number.isFinite(pt[0])).toBe(true);
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('handles very close values', () => {
		const points = valuesToPointsRange([100.001, 100.002, 100.003], 100, 50);
		expect(points.length).toBe(3);
		// Points should still be separated in y
		for (const pt of points) {
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('handles negative values with padding', () => {
		const points = valuesToPointsRange([-20, -10, -5], 100, 50, 5);
		expect(points.length).toBe(3);
		// Higher values (less negative) should have smaller y (closer to top)
		expect(points[2][1]).toBeLessThan(points[0][1]);
	});

	it('handles mixed negative and positive values', () => {
		const points = valuesToPointsRange([-50, 0, 50], 100, 50);
		expect(points.length).toBe(3);
		for (const pt of points) {
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('padding=0 still works (range is still max-min)', () => {
		const points = valuesToPointsRange([10, 20], 100, 50, 0);
		expect(points.length).toBe(2);
		for (const pt of points) {
			expect(Number.isFinite(pt[1])).toBe(true);
		}
	});

	it('scaleRatio=0 makes all y values equal to viewHeight', () => {
		const points = valuesToPointsRange([10, 20, 30], 100, 50, 3, 0);
		for (const pt of points) {
			expect(pt[1]).toBeCloseTo(50);
		}
	});

	it('scaleRatio=1 uses full viewHeight', () => {
		const points = valuesToPointsRange([10, 20], 100, 50, 0, 1);
		expect(points.length).toBe(2);
		// The minimum value should map to viewHeight, max to 0
		// With padding=0: min=10, max=20, range=10
		// min value: y = 50 - ((10-10)/10)*50*1 = 50
		// max value: y = 50 - ((20-10)/10)*50*1 = 50 - 50 = 0
		expect(points[0][1]).toBeCloseTo(50);
		expect(points[1][1]).toBeCloseTo(0);
	});

	it('returns points with ascending x values', () => {
		const points = valuesToPointsRange([30, 10, 20, 40, 5], 200, 100);
		for (let i = 1; i < points.length; i++) {
			expect(points[i][0]).toBeGreaterThan(points[i - 1][0]);
		}
	});

	it('two values produce exactly two points', () => {
		const points = valuesToPointsRange([10, 20], 100, 50);
		expect(points.length).toBe(2);
		expect(points[0][0]).toBe(0);
		expect(points[1][0]).toBe(100);
	});
});
