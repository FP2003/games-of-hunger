import { useEffect, useRef, type ReactNode } from 'react';
import type { GameState, PlayerDefinition } from '../domain';
import { RelationshipNetwork } from './RelationshipNetwork';

export function GameRelationshipsDialog({ players, state, phase, onClose, portrait }: {
  players: PlayerDefinition[];
  state: GameState;
  phase: string;
  onClose: () => void;
  portrait: (player: PlayerDefinition) => ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${padding + scrollbar}px`;
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={ref} className="panel character-modal game-relationships-modal" aria-labelledby="game-relationships-title" aria-describedby="game-relationships-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="section-heading character-modal-heading"><h3 id="game-relationships-title">Relationship network</h3><button onClick={onClose} aria-label="Close relationship network">×</button></div>
    <div className="character-modal-body">
      <p id="game-relationships-description" className="muted">{phase} · Read only. Select two tributes to see how each feels about the other. Faded tributes marked † have been eliminated.</p>
      <RelationshipNetwork players={players} relationships={state.relationships} eliminatedIds={state.players.filter(p => !p.alive).map(p => p.id)} portrait={portrait} />
    </div>
  </dialog>;
}
