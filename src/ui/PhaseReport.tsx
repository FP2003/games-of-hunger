import type { ReactNode } from 'react';
import type { PlayerDefinition, RunRecord } from '../domain';
import { phaseReport } from './playback';
import { confessionalLabel, phaseLabel } from './recap';
import { CharacterText } from './CharacterText';
import { BiomeSymbol } from './BiomeSymbol';

export function PhaseReport({ run, cursor, portrait }: { run: RunRecord; cursor: number; portrait: (player: PlayerDefinition) => ReactNode }) {
  const report = phaseReport(run, cursor);
  const phase = report.events[0]?.phase;
  const player = (id: string) => run.input.cast.players.find(p => p.id === id)!;
  const regionName = (id: string) => run.input.content.biomes.find(b => b.id === id)?.name ?? id;
  return <article className="event-card phase-report" aria-label={phase ? `${phaseLabel(phase)} report` : 'Game ready'}>
    {phase ? <>
      <header className="phase-heading"><h1 aria-live="polite">{phaseLabel(phase)}</h1><p className="muted">{phase.kind === 'finale' && `Day ${phase.day} · `}{report.events.length} events across the arena · {report.events.at(-1)!.state.players.filter(p => p.alive).length} tributes remain</p></header>
      {run.input.content.biomes.map(biome => {
        const events = report.events.filter(e => e.biome === biome.id);
        if (!events.length) return null;
        return <section className="region-report region-theme" data-region={biome.id} key={biome.id} aria-label={`${biome.name} events`}>
          <h2><BiomeSymbol biome={biome.id} /> {biome.name}<small>{events.length} {events.length === 1 ? 'event' : 'events'}</small></h2>
          {events.map(e => <article className={`phase-event${!Object.keys(e.bindings).length ? ' arena-announcement' : ''}`} key={e.id}>
            {!!Object.keys(e.bindings).length && <div className="event-portraits">{Object.values(e.bindings).map(id => <span key={id}>{portrait(player(id))}</span>)}</div>}
            <div className="phase-event-body">{!Object.keys(e.bindings).length && <span className="announcement-tag">Arena broadcast</span>}{e.templateId.startsWith('sponsor-') && <span className="gift-tag">Sponsor gift</span>}<p><CharacterText text={e.text} players={run.input.cast.players} /></p>
              {e.facts.filter(f => f.type === 'move').map((f, i) => <small className="movement-tag" key={i}><CharacterText text={player(f.actorId!).name} players={run.input.cast.players} /> → {regionName(f.biome!)}</small>)}
              {e.facts.filter(f => f.type === 'lore').map((f, i) => <small className="lore-source" key={i}>Past season · {f.sourceRunId} · {f.sourceEvent === undefined ? 'season result' : `event ${f.sourceEvent + 1}`}</small>)}
              {e.confessional && <blockquote><strong><CharacterText text={confessionalLabel(run, e)} players={run.input.cast.players} /></strong><p><CharacterText text={e.confessional.text} players={run.input.cast.players} /></p></blockquote>}
            </div>
          </article>)}
        </section>;
      })}
    </> : <><div className="gates-symbol">✳</div><h1>Game <em>ready.</em></h1><p className="muted">{run.input.cast.players.length} tributes. Start with the bloodbath, then follow each day and night together.</p><p className="muted">The Center Podium offers supplies and danger. Escaping leads to the outer regions. Sponsor gifts can arrive during the game.</p></>}
  </article>;
}

export function FallenTributes({ run, cursor, portrait }: { run: RunRecord; cursor: number; portrait: (player: PlayerDefinition) => ReactNode }) {
  const report = phaseReport(run, cursor);
  const phase = report.events[0]?.phase;
  if (!report.showFallen || !phase) return null;
  const player = (id: string) => run.input.cast.players.find(p => p.id === id)!;
  return <section className="event-card fallen-tributes" aria-label="Fallen tributes">
    <header className="phase-heading"><span className="eyebrow">IN MEMORIAM</span><h1>Fallen tributes</h1><p className="muted">{cursor === run.events.length ? 'The final roll call · since the last night' : `Day ${phase.day}${phase.day === 1 ? ' · including the bloodbath' : ''}`}</p></header>
    {report.fallenIds.length ? <div className="fallen-grid">{report.fallenIds.map(id => <article key={id}>{portrait(player(id))}<strong><CharacterText text={player(id).name} players={[player(id)]} /></strong><small>{player(id).team}</small></article>)}</div> : <p>No tributes fell today.</p>}
  </section>;
}
