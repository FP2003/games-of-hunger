import { describe, expect, it } from 'vitest';
import { circularNetwork } from '../../src/ui/networkLayout';

describe('regular circular network layout', () => {
  for (const width of [286, 350, 984, 1152]) {
    it(`fits 2–48 evenly spaced, non-overlapping labels at ${width}px`, () => {
      for (let count = 2; count <= 48; count++) {
        const initial = circularNetwork(count, width, width);
        const height = initial.minimumDiameter + 1;
        const layout = circularNetwork(count, width, height);
        const polygons = layout.points.map(point => {
          const angle = point.rotation * Math.PI / 180;
          return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({
            x: point.x + x * layout.nodeWidth / 2 * Math.cos(angle) - y * layout.nodeHeight / 2 * Math.sin(angle),
            y: point.y + x * layout.nodeWidth / 2 * Math.sin(angle) + y * layout.nodeHeight / 2 * Math.cos(angle),
          }));
        });
        for (const [i, point] of layout.points.entries()) {
          expect(point.rotation).toBe(0);
          expect(Math.hypot(point.x - width / 2, point.y - height / 2)).toBeCloseTo(layout.radius, 5);
          expect(point.labelX).toBeGreaterThanOrEqual(0);
          expect(point.labelX + layout.labelWidth).toBeLessThanOrEqual(width);
          expect(point.labelY - layout.labelHeight / 2).toBeGreaterThanOrEqual(0);
          expect(point.labelY + layout.labelHeight / 2).toBeLessThanOrEqual(height);
          for (const corner of polygons[i]) {
            expect(corner.x).toBeGreaterThanOrEqual(0);
            expect(corner.x).toBeLessThanOrEqual(width);
            expect(corner.y).toBeGreaterThanOrEqual(0);
            expect(corner.y).toBeLessThanOrEqual(height);
          }
          for (let j = i + 1; j < count; j++) {
            const other = layout.points[j];
            expect(Math.hypot(point.x - other.x, point.y - other.y), `${count} players: round nodes ${i} and ${j}`).toBeGreaterThanOrEqual(layout.nodeWidth - 0.01);
            if (point.side === other.side) expect(Math.abs(point.labelY - other.labelY), `${count} players: labels ${i} and ${j}`).toBeGreaterThanOrEqual(layout.labelHeight - 0.01);
          }
        }
      }
    });
  }
});
