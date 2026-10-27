export type NetworkPoint = { x: number; y: number; rotation: number; labelX: number; labelY: number; side: 'left' | 'right' | 'top' | 'bottom' };

/** Nodes form a regular polygon; nearby horizontal labels avoid vertical collisions. */
export function circularNetwork(count: number, width: number, height: number) {
  const narrow = width < 500;
  const dense = count > 32 || (narrow && count > 24);
  const padding = 12;
  const gap = narrow ? 3 : 8;
  const labelWidth = narrow ? Math.min(dense ? 54 : 78, Math.floor((width - 196) / 2)) : 128;
  const labelHeight = narrow ? dense ? 16 : 20 : 22;
  const verticalPadding = padding + gap + labelHeight;
  const angles = Array.from({ length: count }, (_, i) => -Math.PI / 2 + i * Math.PI * 2 / count);
  const sides = angles.map((angle, i) => i === 0 ? 'top' as const : i === Math.floor(count / 2) ? 'bottom' as const : Math.cos(angle) < -0.001 ? 'left' as const : 'right' as const);
  const maxLabels = Math.max(sides.filter(side => side === 'left').length, sides.filter(side => side === 'right').length);
  let nodeWidth = narrow ? dense ? 14 : 22 : dense ? 28 : 34;
  const minimumRadius = (size: number) => Math.max(narrow ? 80 : 112, count > 1 ? (size + 2) / (2 * Math.sin(Math.PI / count)) : 0);
  const availableRadius = (size: number) => (width - 2 * (padding + labelWidth + gap) - size) / 2;
  while (nodeWidth > 6 && minimumRadius(nodeWidth) > availableRadius(nodeWidth)) nodeWidth--;
  const nodeHeight = nodeWidth;
  const minimumDiameter = Math.ceil(Math.max(2 * minimumRadius(nodeWidth) + nodeWidth + verticalPadding * 2, maxLabels * labelHeight + padding * 2));
  const radius = Math.max(1, Math.min(availableRadius(nodeWidth), (height - nodeWidth - verticalPadding * 2) / 2));
  const points: NetworkPoint[] = angles.map((angle, i) => {
    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    const side = sides[i];
    return {
      x, y, rotation: 0, side,
      labelX: x + (side === 'left' ? -nodeWidth / 2 - gap - labelWidth : side === 'right' ? nodeWidth / 2 + gap : -labelWidth / 2),
      labelY: y + (side === 'top' ? -nodeHeight / 2 - gap - labelHeight / 2 : side === 'bottom' ? nodeHeight / 2 + gap + labelHeight / 2 : 0),
    };
  });
  for (const side of ['left', 'right']) {
    const labels = points.filter(point => point.side === side).sort((a, b) => a.y - b.y);
    const first = padding + labelHeight / 2;
    const last = height - padding - labelHeight / 2;
    labels.forEach((point, i) => { point.labelY = Math.max(point.y, i ? labels[i - 1].labelY + labelHeight : first); });
    for (let i = labels.length - 1; i >= 0; i--) labels[i].labelY = Math.min(labels[i].labelY, i === labels.length - 1 ? last : labels[i + 1].labelY - labelHeight);
    if (labels.length) {
      const preferredShift = labels.reduce((sum, point) => sum + point.y - point.labelY, 0) / labels.length;
      const shift = Math.min(last - labels[labels.length - 1].labelY, Math.max(first - labels[0].labelY, preferredShift));
      labels.forEach(point => { point.labelY += shift; });
    }
  }
  return { points, radius, nodeWidth, nodeHeight, labelWidth, labelHeight, minimumDiameter, narrow, dense };
}
