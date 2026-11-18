import { defineConfig } from 'vitest/config';

const localServer = { host: '127.0.0.1', port: 5173, strictPort: true };

export default defineConfig({
  base: './',
  server: localServer,
  preview: localServer,
  test: { include: ['tests/**/*.test.ts', 'src/**/*.test.ts'], testTimeout: 30000 },
});
