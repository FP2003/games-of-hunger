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
          expect(Math.hypot(point.x - width / 2, point.y - height / 2)).toBeCloseTo(layout.radius, 5);
          for (const corner of polygons[i]) {
            expect(corner.x).toBeGreaterThanOrEqual(0);
            expect(corner.x).toBeLessThanOrEqual(width);
            expect(corner.y).toBeGreaterThanOrEqual(0);
            expect(corner.y).toBeLessThanOrEqual(height);
          }
          for (let j = i + 1; j < count; j++) {
            const axes = [polygons[i], polygons[j]].flatMap(corners => corners.map((corner, k) => ({ x: -(corners[(k + 1) % 4].y - corner.y), y: corners[(k + 1) % 4].x - corner.x })));
            const separated = axes.some(axis => {
              const project = (corner: { x: number; y: number }) => (corner.x * axis.x + corner.y * axis.y) / Math.hypot(axis.x, axis.y);
              const a = polygons[i].map(project), b = polygons[j].map(project);
              return Math.max(...a) <= Math.min(...b) + 0.01 || Math.max(...b) <= Math.min(...a) + 0.01;
            });
            expect(separated, `${count} players: nodes ${i} and ${j}`).toBe(true);
          }
        }
      }
    });
  }
});
