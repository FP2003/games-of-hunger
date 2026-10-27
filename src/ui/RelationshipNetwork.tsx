import { useLayoutEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { PlayerDefinition, Relationship } from '../domain';
import { circularNetwork } from './networkLayout';

export type RelationshipStatus = 'neutral' | 'trusted' | 'rival';
const statuses: RelationshipStatus[] = ['trusted', 'rival', 'neutral'];
const labels = { trusted: 'Trusted', rival: 'Rival', neutral: 'Neutral' };
const colours = { trusted: '#a8db91', rival: '#ee978e', neutral: '#82958f' };
const descriptions = { trusted: '+60 trust', rival: '60 grudge', neutral: 'No trust or grudge' };
const statusOf = (edge?: Relationship): RelationshipStatus => edge && edge.grudge >= 40 ? 'rival' : edge && edge.trust >= 40 ? 'trusted' : 'neutral';
type Point = { x: number; y: number };

export function RelationshipNetwork({ players, relationships, focalId, onChange, portrait, onEdit, eliminatedIds = [] }: {
  players: PlayerDefinition[];
  relationships: Relationship[];
  focalId?: string;
  onChange?: (from: string, to: string, status: RelationshipStatus) => void;
  portrait: (player: PlayerDefinition) => ReactNode;
  onEdit?: (id: string) => void;
  eliminatedIds?: string[];
}) {
  const id = useId().replace(/:/g, '');
  const [selection, setSelection] = useState<{ from?: string; to?: string }>({});
  const [showNeutral, setShowNeutral] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 500, height: 380 });
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => setViewportSize({ width: element.clientWidth, height: element.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [players.length, selection.from, selection.to, focalId]);
  const focal = players.find(player => player.id === focalId);
  const from = players.find(player => player.id === (focal?.id ?? selection.from));
  const to = players.find(player => player.id === selection.to && player.id !== from?.id);
  const name = (player: PlayerDefinition) => player.name || 'Unnamed player';
  const caption = (player: PlayerDefinition) => players.some(other => other.id !== player.id && name(other) === name(player)) ? `${name(player)} #${players.indexOf(player) + 1}` : name(player);
  const entry = (player: PlayerDefinition) => `${name(player)}, cast entry ${players.indexOf(player) + 1}${eliminatedIds.includes(player.id) ? ' (eliminated)' : ''}`;
  const ring = players.filter(player => player.id !== focal?.id);
  const { width, height } = viewportSize;
  const layout = circularNetwork(ring.length, width, height);
  const { narrow, dense, nodeWidth, nodeHeight } = layout;
  const minimumHeight = layout.minimumDiameter
    + (narrow ? 66 : 42) + (focal ? narrow ? 88 : 70 : narrow ? 196 : 148);
  const points = new Map<string, Point>();
  ring.forEach((player, index) => points.set(player.id, layout.points[index]));
  if (focal) points.set(focal.id, { x: width / 2, y: height / 2 });
  const lookup = new Map(relationships.map(edge => [JSON.stringify([edge.from, edge.to]), edge]));
  const status = (a: string, b: string) => statusOf(lookup.get(JSON.stringify([a, b])));
  const choose = (playerId: string) => {
    if (focal) setSelection({ to: playerId });
    else if (!from || from.id === playerId) setSelection({ from: playerId });
    else setSelection({ from: from.id, to: playerId });
  };
  const edges: { from: string; to: string; status: RelationshipStatus; mutual: boolean; curved: boolean }[] = [];
  if (focal) {
    ring.forEach(player => edges.push({ from: focal.id, to: player.id, status: status(focal.id, player.id), mutual: false, curved: false }));
  } else {
    players.forEach((a, index) => players.slice(index + 1).forEach(b => {
      const ab = status(a.id, b.id), ba = status(b.id, a.id);
      const revealNeutral = showNeutral || from?.id === a.id || from?.id === b.id;
      if (ab === ba) {
        if (ab !== 'neutral' || revealNeutral) edges.push({ from: a.id, to: b.id, status: ab, mutual: true, curved: false });
      } else {
        if (ab !== 'neutral' || revealNeutral) edges.push({ from: a.id, to: b.id, status: ab, mutual: false, curved: true });
        if (ba !== 'neutral' || revealNeutral) edges.push({ from: b.id, to: a.id, status: ba, mutual: false, curved: true });
      }
    }));
  }
  const activeEdge = (a: string, b: string) => to ? (a === from?.id && b === to.id) || (a === to.id && b === from?.id) : a === from?.id || b === from?.id;
  // Draw selected connections last so they remain visible in a dense network.
  edges.sort((a, b) => Number(activeEdge(a.from, a.to)) - Number(activeEdge(b.from, b.to)));
  const bundleFocus = from && !to ? from : undefined;
  type Bundle = { status: RelationshipStatus; direction: 'incoming' | 'outgoing' | 'mutual'; members: PlayerDefinition[] };
  const bundleMap = new Map<string, Bundle>();
  if (bundleFocus) players.filter(player => player.id !== bundleFocus.id).forEach(player => {
    const outgoing = status(bundleFocus.id, player.id), incoming = status(player.id, bundleFocus.id);
    const add = (value: RelationshipStatus, direction: Bundle['direction']) => {
      const key = `${value}-${direction}`;
      const group = bundleMap.get(key) ?? { status: value, direction, members: [] };
      group.members.push(player); bundleMap.set(key, group);
    };
    if (outgoing === incoming) add(outgoing, 'mutual');
    else { add(outgoing, 'outgoing'); add(incoming, 'incoming'); }
  });
  const bundles = [...bundleMap.values()];
  const trim = (point: Point, toward: Point, nodeId: string): Point => {
    const distance = Math.hypot(toward.x - point.x, toward.y - point.y) || 1;
    const vx = (toward.x - point.x) / distance, vy = (toward.y - point.y) / distance;
    const central = nodeId === focal?.id;
    const rotation = central ? 0 : (layout.points[ring.findIndex(player => player.id === nodeId)]?.rotation ?? 0) * Math.PI / 180;
    const localX = vx * Math.cos(rotation) + vy * Math.sin(rotation);
    const localY = -vx * Math.sin(rotation) + vy * Math.cos(rotation);
    const inset = Math.min((central ? narrow ? 56 : 80 : nodeWidth / 2) / Math.abs(localX), (central ? narrow ? 28 : 36 : nodeHeight / 2) / Math.abs(localY)) + 6;
    return { x: point.x + vx * inset, y: point.y + vy * inset };
  };

  if (players.length < 2) return <p className="muted">Add another player to start connecting relationships.</p>;

  return <section className={`relationship-network${dense ? ' dense' : ''}`} style={{ '--network-min-height': `${minimumHeight}px`, '--node-width': `${nodeWidth}px`, '--node-height': `${nodeHeight}px`, '--node-font': `${narrow ? dense ? 11 : 12 : dense ? 12 : 13}px`, '--node-portrait': `${Math.max(4, nodeWidth - 4)}px`, '--label-width': `${layout.labelWidth}px`, '--label-height': `${layout.labelHeight}px` } as CSSProperties} aria-label={focal ? `Starting relationships for ${name(focal)}` : 'Cast relationship network'}>
    <p id={`${id}-instructions`} className="sr-only">{!onChange ? 'Select two tributes to inspect their relationship.' : focal ? `Select a player to edit how ${name(focal)} feels about them.` : 'Select two players to edit their relationship.'} Arrows show direction.</p>
    <div className="network-toolbar"><h4>Relationships</h4><div className="network-legend" aria-label="Relationship colours">{statuses.map(value => <span key={value} style={{ '--relationship-colour': colours[value] } as CSSProperties}><i className={value} />{labels[value]}</span>)}</div>{!focal && <label className="network-neutral-toggle" title="Show neutral connections"><input type="checkbox" checked={showNeutral} onChange={event => setShowNeutral(event.target.checked)} />Neutral lines</label>}</div>
    <div ref={viewport} className="network-viewport" role="group" aria-label="Relationship chart" aria-describedby={`${id}-instructions`}>
      <div className="network-canvas" style={{ width, height }}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="network-lines">
          <defs>{statuses.map(value => <marker key={value} id={`${id}-${value}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 z" fill={colours[value]} /></marker>)}</defs>
          <circle cx={width / 2} cy={height / 2} r={layout.radius} className="network-orbit" />
          {!bundleFocus && edges.map(edge => {
            const a = points.get(edge.from)!, b = points.get(edge.to)!;
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            const dx = (b.x - a.x) / length, dy = (b.y - a.y) / length;
            const curve = edge.curved ? 22 : 0;
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            // Bring perimeter connections into the circle so adjacent nodes have
            // a visible line too, with room for separate arrows in each direction.
            const control = { x: mid.x + (focal ? 0 : (width / 2 - mid.x) * 0.3) - dy * curve, y: mid.y + (focal ? 0 : (height / 2 - mid.y) * 0.3) + dx * curve };
            const start = trim(a, control, edge.from), end = trim(b, control, edge.to);
            const path = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
            const active = activeEdge(edge.from, edge.to);
            return <g key={JSON.stringify([edge.from, edge.to])} className={`network-edge ${edge.status}${active ? ' highlighted' : ''}${from && !active ? ' dimmed' : ''}`} data-from={edge.from} data-to={edge.to} data-status={edge.status}>
              <path d={path} stroke={colours[edge.status]} markerEnd={`url(#${id}-${edge.status})`} markerStart={edge.mutual ? `url(#${id}-${edge.status})` : undefined} className="network-edge-line" />
              <path d={path} className="network-edge-hit" onClick={() => setSelection({ from: edge.from, to: edge.to })}><title>{name(players.find(player => player.id === edge.from)!)} {edge.mutual ? '↔' : '→'} {name(players.find(player => player.id === edge.to)!)}: {labels[edge.status]}</title></path>
            </g>;
          })}
          {bundleFocus && bundles.map((bundle, index) => {
            const anchor = points.get(bundleFocus.id)!;
            const mean = bundle.members.reduce((sum, player) => ({ x: sum.x + points.get(player.id)!.x / bundle.members.length, y: sum.y + points.get(player.id)!.y / bundle.members.length }), { x: 0, y: 0 });
            const dx = mean.x - anchor.x, dy = mean.y - anchor.y;
            const baseAngle = Math.hypot(dx, dy) < 1 ? -Math.PI / 2 : Math.atan2(dy, dx);
            const angle = baseAngle + (index - (bundles.length - 1) / 2) * 0.35;
            const exit = trim(anchor, { x: anchor.x + Math.cos(angle), y: anchor.y + Math.sin(angle) }, bundleFocus.id);
            const distance = Math.max(Math.hypot(exit.x - anchor.x, exit.y - anchor.y) + 24, Math.min(narrow ? 54 : 88, layout.radius * 0.5));
            const hub = { x: anchor.x + Math.cos(angle) * distance, y: anchor.y + Math.sin(angle) * distance };
            const start = trim(anchor, hub, bundleFocus.id);
            const summary = `${bundle.members.length} ${labels[bundle.status].toLowerCase()} ${bundle.direction === 'incoming' ? 'toward' : bundle.direction === 'outgoing' ? 'from' : 'with'} ${caption(bundleFocus)}: ${bundle.members.map(caption).join(', ')}`;
            if (bundle.members.length === 1) {
              const player = bundle.members[0], point = points.get(player.id)!;
              const a = trim(anchor, point, bundleFocus.id), b = trim(point, anchor, player.id);
              const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
              return <g className={`network-bundle ${bundle.status}`} key={`${bundle.status}-${bundle.direction}`} data-status={bundle.status} data-direction={bundle.direction} data-count="1"><title>{summary}</title><path d={path} stroke={colours[bundle.status]} className="network-bundle-trunk" markerStart={bundle.direction !== 'outgoing' ? `url(#${id}-${bundle.status})` : undefined} markerEnd={bundle.direction !== 'incoming' ? `url(#${id}-${bundle.status})` : undefined} /><path d={path} className="network-edge-hit" onClick={() => setSelection({ from: bundleFocus.id, to: player.id })} /></g>;
            }
            return <g className={`network-bundle ${bundle.status}`} key={`${bundle.status}-${bundle.direction}`} data-status={bundle.status} data-direction={bundle.direction} data-count={bundle.members.length}>
              <title>{summary}</title>
              {bundle.members.map(player => {
                const point = points.get(player.id)!;
                const source = trim(point, hub, player.id);
                const control = { x: (source.x + hub.x) / 2 + (width / 2 - (source.x + hub.x) / 2) * 0.15, y: (source.y + hub.y) / 2 + (height / 2 - (source.y + hub.y) / 2) * 0.15 };
                const path = `M ${source.x} ${source.y} Q ${control.x} ${control.y} ${hub.x} ${hub.y}`;
                return <g key={player.id}><path d={path} stroke={colours[bundle.status]} className="network-bundle-branch" /><path d={path} className="network-edge-hit" onClick={() => setSelection({ from: bundleFocus.id, to: player.id })}><title>{caption(player)}</title></path></g>;
              })}
              <path d={`M ${start.x} ${start.y} L ${hub.x} ${hub.y}`} stroke={colours[bundle.status]} className="network-bundle-trunk" markerStart={bundle.direction !== 'outgoing' ? `url(#${id}-${bundle.status})` : undefined} markerEnd={bundle.direction !== 'incoming' ? `url(#${id}-${bundle.status})` : undefined} />
              {bundle.members.length > 1 && <text x={hub.x + 8} y={hub.y - 8} fill={colours[bundle.status]} className="network-bundle-count">{bundle.members.length}</text>}
            </g>;
          })}
        </svg>
        {players.map(player => {
          const point = points.get(player.id)!;
          const central = focal?.id === player.id;
          const selected = player.id === from?.id || player.id === to?.id;
          const relation = from && from.id !== player.id ? status(from.id, player.id) : 'neutral';
          const contents = <>{portrait(player)}<span className="network-node-name">{caption(player)}{eliminatedIds.includes(player.id) ? ' †' : ''}</span></>;
          const label = central ? undefined : layout.points[ring.findIndex(other => other.id === player.id)];
          const labelAnchor = label?.side === 'left' ? 1 : label?.side === 'right' || !label ? 0 : 0.5;
          const style = { left: point.x, top: point.y, '--label-x': `${label ? label.labelX + layout.labelWidth * labelAnchor - point.x + nodeWidth / 2 - 1 : 0}px`, '--label-y': `${label ? label.labelY - point.y + nodeHeight / 2 - layout.labelHeight / 2 - 1 : 0}px`, '--label-shift': `${-100 * labelAnchor}%`, '--label-align': label?.side === 'left' ? 'right' : label?.side === 'right' ? 'left' : 'center', '--relationship-colour': central ? 'var(--acid)' : colours[relation] } as CSSProperties;
          return central ? <div key={player.id} className="network-node central" style={style} title={entry(player)}>{contents}</div> : <button key={player.id} className={`network-node${selected ? ' selected' : ''}${eliminatedIds.includes(player.id) ? ' eliminated' : ''}`} style={style} aria-label={`Select ${entry(player)}`} aria-pressed={selected} title={`${entry(player)}${from && from.id !== player.id ? ` · ${name(from)} → ${name(player)}: ${labels[relation]}` : ''}`} onClick={() => choose(player.id)}>{contents}</button>;
        })}
      </div>
    </div>
    {bundleFocus && <ul className="sr-only" aria-label="Grouped relationships">{bundles.map(bundle => <li key={`${bundle.status}-${bundle.direction}`}>{bundle.members.length} {labels[bundle.status]} · {bundle.direction}: {bundle.members.map(caption).join(', ')}</li>)}</ul>}
    {from && (to || !focal) && <div className="network-selection" aria-live="polite">
      <button className="network-clear" aria-label="Clear selection" title="Clear selection" onClick={() => setSelection({})}>×</button>
      {to ? <>
        {(focal ? [[from, to]] : [[from, to], [to, from]]).map(([a, b], index) => <div className="network-relationship-control" key={a.id}>
          <span id={`${id}-direction-${index}`}>{caption(a)} <span aria-label="toward">→</span> {caption(b)}</span>
          {onChange ? <div className="network-status-options" role="group" aria-labelledby={`${id}-direction-${index}`}>{statuses.map(value => <button key={value} aria-label={`${caption(a)} toward ${caption(b)}: ${labels[value]}`} aria-pressed={status(a.id, b.id) === value} style={{ '--relationship-colour': colours[value] } as CSSProperties} title={descriptions[value]} onClick={() => onChange(a.id, b.id, value)}><i />{labels[value]}</button>)}</div> : <span className="network-status-readout" style={{ color: colours[status(a.id, b.id)] }}>{labels[status(a.id, b.id)]} · Trust {lookup.get(JSON.stringify([a.id, b.id]))?.trust ?? 0} · Grudge {lookup.get(JSON.stringify([a.id, b.id]))?.grudge ?? 0}</span>}
        </div>)}
      </> : <span className="network-selected-name">{caption(from)}</span>}
      {!focal && onEdit && <button className="network-edit subtle" aria-label={`Edit ${name(from)}’s character`} onClick={() => onEdit(from.id)}>Edit character ↗</button>}
    </div>}
  </section>;
}
