import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../ui/App';
import { createIndexedDbRepository, createMemoryRepository, exportHistory, importHistory } from '../persistence';
import { selectLoreContext } from '../lore';
import { defaultArena } from '../content/defaultArena';
import type { AppServices } from './services';

async function launch() {
  let storageWarning: string | undefined;
  const repository = await createIndexedDbRepository().catch(error => {
    storageWarning = `${error instanceof Error ? error.message : 'Browser storage is unavailable.'} This session is temporary; export your cast and replay before closing the page.`;
    return createMemoryRepository();
  });
  const services: AppServices = {
    repository,
    arena: defaultArena,
    loadContent: () => import('../content').then(module => module.defaultContentPack),
    generate: async input => {
      const [{ generateRun }, { narrativeAdapter }] = await Promise.all([import('../engine'), import('../narrative')]);
      return generateRun(input, narrativeAdapter);
    },
    lore: selectLoreContext,
    exportHistory: () => exportHistory(repository),
    importHistory: text => importHistory(text, repository),
    storageWarning,
  };
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App services={services} /></React.StrictMode>);
}
void launch();
