/**
 * Convert an array of [x, y] points into a smooth SVG path string
 * using Catmull-Rom to cubic bezier conversion.
 */
export function smoothPath(points: [number, number][]): string {
	if (points.length < 2) return '';
	if (points.length === 2) {
		return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;
	}

	const tension = 0.12;
	let d = `M${points[0][0]},${points[0][1]}`;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(points.length - 1, i + 2)];

		const cp1x = p1[0] + ((p2[0] - p0[0]) * tension);
		const cp1y = p1[1] + ((p2[1] - p0[1]) * tension);
		const cp2x = p2[0] - ((p3[0] - p1[0]) * tension);
		const cp2y = p2[1] - ((p3[1] - p1[1]) * tension);

		d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
	}

	return d;
}

/**
 * Create a closed fill path from a smooth line path.
 * Adds straight lines down to the bottom-right and bottom-left corners.
 */
export function smoothFillPath(
	points: [number, number][],
	viewWidth: number,
	viewHeight: number
): string {
	const line = smoothPath(points);
	if (!line) return '';
	return `${line} L${viewWidth},${viewHeight} L0,${viewHeight} Z`;
}

/**
 * Convert raw values to [x, y] points for a chart.
 */
export function valuesToPoints(
	values: number[],
	viewWidth: number,
	viewHeight: number,
	scale: number = 0.9
): [number, number][] {
	if (values.length < 2) return [];
	const max = Math.max(...values, 1);
	const step = viewWidth / (values.length - 1);
	return values.map((v, i) => [
		i * step,
		viewHeight - (v / max) * viewHeight * scale
	]);
}

/**
 * Convert raw values to [x, y] points with a min/max range (for temperature-style charts).
 */
export function valuesToPointsRange(
	values: number[],
	viewWidth: number,
	viewHeight: number,
	padding: number = 3,
	scaleRatio: number = 0.9
): [number, number][] {
	if (values.length < 2) return [];
	const min = Math.min(...values) - padding;
	const max = Math.max(...values) + padding;
	const range = max - min || 1;
	const step = viewWidth / (values.length - 1);
	return values.map((v, i) => [
		i * step,
		viewHeight - ((v - min) / range) * viewHeight * scaleRatio
	]);
}
