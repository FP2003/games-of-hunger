import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { PlayerDefinition } from '../domain';
import { groupCastPlayers } from './editor';
import { teamStyle } from './teamColours';

type PointerDrag = { id: string; pointerId: number; startX: number; startY: number; x: number; y: number; active: boolean; draggable: boolean };

export function CastCards({ players, selectedId, onEdit, onRemove, onSwap, portrait }: {
  players: PlayerDefinition[];
  selectedId?: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSwap: (id: string, targetId: string) => void;
  portrait: (player: PlayerDefinition) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const pointer = useRef<PointerDrag | null>(null);
  const frame = useRef(0);
  const ignoreClick = useRef(false);
  const focusAfterSwap = useRef<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const groups = groupCastPlayers(players);
  const ordered = [...groups.values()].flatMap(group => group.members);
  const numbers = new Map(ordered.map((player, index) => [player.id, index + 1]));
  const sourceId = drag?.id ?? pickedId;
  const source = players.find(player => player.id === sourceId);
  const target = players.find(player => player.id === targetId);
  const label = (player: PlayerDefinition) => player.name || 'Unnamed player';
  const slot = (player: PlayerDefinition) => `${player.team || 'Other players'}, slot ${numbers.get(player.id)}`;

  const stop = useCallback(() => {
    pointer.current = null;
    cancelAnimationFrame(frame.current);
    setDrag(null);
    setPickedId(null);
    setTargetId(null);
  }, []);

  useEffect(() => {
    const cancel = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || (!pointer.current && !root.current?.querySelector('[aria-pressed="true"]'))) return;
      ignoreClick.current = Boolean(pointer.current?.active);
      stop();
      setAnnouncement('Move cancelled.');
    };
    window.addEventListener('keydown', cancel);
    return () => { window.removeEventListener('keydown', cancel); cancelAnimationFrame(frame.current); };
  }, [stop]);

  useEffect(() => {
    if (focusAfterSwap.current) {
      handles.current.get(focusAfterSwap.current)?.focus({ preventScroll: true });
      focusAfterSwap.current = null;
    }
  }, [players]);

  function targetAt(x: number, y: number) {
    const card = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cast-player]');
    return card && root.current?.contains(card) ? card.dataset.castPlayer! : null;
  }

  function autoScroll() {
    const current = pointer.current;
    if (!current?.active) return;
    const edge = Math.min(72, window.innerHeight / 4);
    const speed = current.y < edge ? -Math.ceil((edge - current.y) / 5)
      : current.y > window.innerHeight - edge ? Math.ceil((current.y - window.innerHeight + edge) / 5) : 0;
    if (speed) {
      window.scrollBy(0, speed);
      setTargetId(targetAt(current.x, current.y));
    }
    frame.current = requestAnimationFrame(autoScroll);
  }

  function start(event: PointerEvent<HTMLButtonElement>, id: string, handle = false) {
    if (!event.isPrimary || event.button !== 0) return;
    const draggable = handle || event.pointerType === 'mouse';
    pointer.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false, draggable };
    if (draggable) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId || !current.draggable) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (!current.active) {
      if (Math.hypot(current.x - current.startX, current.y - current.startY) < 6) return;
      current.active = true;
      setPickedId(null);
      frame.current = requestAnimationFrame(autoScroll);
    }
    event.preventDefault();
    setDrag({ id: current.id, x: current.x, y: current.y });
    setTargetId(targetAt(current.x, current.y));
  }

  function swap(id: string, destination: string) {
    const from = players.find(player => player.id === id);
    const to = players.find(player => player.id === destination);
    stop();
    if (!from || !to || id === destination) return;
    focusAfterSwap.current = id;
    setAnnouncement(`${label(from)} moved to ${slot(to)}. Swapped with ${label(to)}.`);
    onSwap(id, destination);
  }

  function release(event: PointerEvent<HTMLButtonElement>, handle = false) {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.active) {
      pointer.current = null;
      if (event.pointerType === 'touch') {
        if (handle || pickedId) choose(current.id);
        else onEdit(current.id);
        // Handle touch taps directly; browsers may omit or delay their click event after a drag.
        ignoreClick.current = true;
      }
      return;
    }
    // A completed drag must not also click the editor or pick up another card.
    ignoreClick.current = true;
    const destination = targetAt(event.clientX, event.clientY);
    if (destination && destination !== current.id) swap(current.id, destination);
    else { stop(); setAnnouncement('Move cancelled.'); }
  }

  function choose(id: string) {
    if (ignoreClick.current) return;
    if (pickedId === id) { stop(); setAnnouncement('Move cancelled.'); }
    else if (pickedId) swap(pickedId, id);
    else { setPickedId(id); setTargetId(id); }
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (!pickedId) return;
    const index = ordered.findIndex(player => player.id === id);
    const offset = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? ordered.length - 1
      : offset === undefined ? null : Math.max(0, Math.min(ordered.length - 1, index + offset));
    if (next === null) return;
    event.preventDefault();
    handles.current.get(ordered[next].id)?.focus();
  }

  return <>
    {players.length > 1 && <p className="cast-reorder-hint">Drag the grip to swap slots, or select it and choose another player.</p>}
    <p id="cast-move-instructions" className="sr-only">Drag to another player to swap slots. Or press Space or Enter to pick up, use arrow keys to choose a slot, and press Space or Enter to swap. Escape cancels.</p>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{source ? `${label(source)} picked up. ${target && target.id !== source.id ? `Swap with ${label(target)} in ${slot(target)}.` : 'Choose another slot.'}` : announcement}</p>
    <div className="cast-groups" ref={root} onPointerDownCapture={() => { ignoreClick.current = false; }} onKeyDownCapture={() => { ignoreClick.current = false; }}>
      {[...groups].map(([key, group]) => <section className={`cast-group ${group.team ? '' : 'ungrouped'}`} aria-label={group.team || 'Players without a team'} style={teamStyle(group.team)} key={key}>
        {(group.team || groups.size > 1) && <h3 className="cast-group-heading">{group.team || 'Other players'}</h3>}
        <div className="cast-grid">{group.members.map(player => {
          const number = numbers.get(player.id)!;
          const duplicate = players.some(other => other.id !== player.id && other.name === player.name);
          return <article className={`cast-card ${selectedId === player.id ? 'selected' : ''} ${sourceId === player.id ? 'moving' : ''} ${sourceId && targetId === player.id && sourceId !== player.id ? 'drop-target' : ''}`} style={teamStyle(player.team)} data-cast-player={player.id} key={player.id}>
            <div className="cast-card-top"><span className="entry-number">{String(number).padStart(2, '0')}</span><div className="mini-actions">
              <button className="cast-drag-handle" ref={element => { if (element) handles.current.set(player.id, element); else handles.current.delete(player.id); }} aria-label={`Move ${label(player)}, slot ${number}`} aria-describedby="cast-move-instructions" aria-pressed={pickedId === player.id} title="Drag to swap slots" disabled={players.length < 2}
                onPointerDown={event => start(event, player.id, true)} onPointerMove={move} onPointerUp={event => release(event, true)} onPointerCancel={stop} onLostPointerCapture={() => { if (pointer.current) stop(); }}
                onClick={() => choose(player.id)} onKeyDown={event => navigate(event, player.id)} onFocus={() => { if (pickedId) setTargetId(player.id); }}><span aria-hidden="true">⠿</span></button>
              <button aria-label={`Remove ${player.name || 'player'}`} onClick={() => { stop(); onRemove(player.id); }}>×</button>
            </div></div>
            <button className="cast-person" aria-label={pickedId ? pickedId === player.id ? `Cancel moving ${label(player)}` : `Swap ${source ? label(source) : 'player'} with ${label(player)}, slot ${number}` : `Edit ${player.name || 'character'}, cast entry ${number}`} aria-haspopup={pickedId ? undefined : 'dialog'} aria-controls={!pickedId && selectedId === player.id ? 'character-editor' : undefined}
              onPointerDown={event => start(event, player.id)} onPointerMove={move} onPointerUp={event => release(event)} onPointerCancel={stop} onLostPointerCapture={() => { if (pointer.current) stop(); }} onDragStart={event => event.preventDefault()}
              onClick={() => { if (!ignoreClick.current) { if (pickedId) choose(player.id); else onEdit(player.id); } }}>
              {portrait(player)}<span className="cast-person-details"><strong>{label(player)}</strong>{player.traits.length > 0 && <small>{player.traits.join(' · ')}</small>}{duplicate && <small>Cast entry {number}</small>}</span><span className="cast-person-arrow" aria-hidden="true">↗</span>
            </button>
          </article>;
        })}</div>
      </section>)}
    </div>
    {drag && source && <div className="cast-drag-preview" style={{ left: Math.max(8, Math.min(drag.x + 14, window.innerWidth - 208)), top: Math.max(8, Math.min(drag.y + 14, window.innerHeight - 72)), ...teamStyle(source.team) }} aria-hidden="true">{portrait(source)}<strong>{label(source)}</strong></div>}
  </>;
}
