import { expect, it, vi } from 'vitest';
import { loadWorkspace } from '../../src/app/loadWorkspace';
import { createMemoryRepository } from '../../src/persistence';
import { exampleCast, fixtureRun } from '../fixtures';

it('loads healthy casts and seasons even when saved playback is damaged', async () => {
  const repository = createMemoryRepository();
  try {
    await repository.saveCast('cast', exampleCast); await repository.recordCompleted(fixtureRun);
    vi.spyOn(repository, 'getPlayback').mockRejectedValue(new Error('Damaged replay'));
    const workspace = await loadWorkspace(repository);
    expect(workspace.casts).toEqual([{ id: 'cast', cast: exampleCast }]);
    expect(workspace.history.seasons).toHaveLength(1);
    expect(workspace.draftReadable).toBe(true);
    expect(workspace.errors).toEqual(['Could not load saved progress: Damaged replay']);
  } finally { repository.close(); }
});

it('does not treat a failed draft read as an empty draft that can be overwritten', async () => {
  const repository = createMemoryRepository();
  try {
    vi.spyOn(repository, 'getDraft').mockRejectedValue(new Error('Newer draft format'));
    const workspace = await loadWorkspace(repository);
    expect(workspace.draftReadable).toBe(false);
    expect(workspace.errors).toContain('Could not load your cast draft: Newer draft format');
    expect(workspace.history).toEqual({ version: 1, seasons: [] });
  } finally { repository.close(); }
});
