export type NetworkPoint = { x: number; y: number; rotation: number };

/** Equal angles give a regular polygon for any cast size. Labels stay unscaled. */
export function circularNetwork(count: number, width: number, height: number) {
  const narrow = width < 500;
  const dense = count > 32 || (narrow && count > 24);
  const radial = count > 8;
  const padding = 12;
  const gap = narrow ? dense ? 0 : 1 : 4;
  const nodeHeight = narrow ? dense ? 14 : radial ? 22 : 30 : dense ? 24 : 30;
  const angles = Array.from({ length: count }, (_, i) => -Math.PI / 2 + i * Math.PI * 2 / count);
  const requiredRadius = (nodeWidth: number) => {
    if (radial) return nodeWidth / 2 + (nodeHeight + gap) / (2 * Math.tan(Math.PI / count)) + 2;
    let radius = 64;
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      radius = Math.max(radius, Math.min(
        (nodeWidth + gap) / Math.abs(Math.cos(angles[i]) - Math.cos(angles[j])),
        (nodeHeight + gap) / Math.abs(Math.sin(angles[i]) - Math.sin(angles[j])),
      ));
    }
    return radius;
  };
  const diameter = (nodeWidth: number) => 2 * (requiredRadius(nodeWidth) + Math.hypot(nodeWidth / 2, nodeHeight / 2) + padding);
  let nodeWidth = narrow ? dense ? 60 : 78 : dense ? 96 : 112;
  // Reduce label width only when necessary; font size never shrinks with the plot.
  while (nodeWidth > 22 && diameter(nodeWidth) > width) nodeWidth -= 1;
  const minimumDiameter = Math.ceil(diameter(nodeWidth));
  const radius = Math.max(1, Math.min(width, height) / 2 - padding - Math.hypot(nodeWidth / 2, nodeHeight / 2));
  const points: NetworkPoint[] = angles.map(angle => {
    let rotation = radial ? angle * 180 / Math.PI : 0;
    if (rotation > 90) rotation -= 180;
    return { x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius, rotation };
  });
  return { points, radius, nodeWidth, nodeHeight, minimumDiameter, narrow, dense };
}
