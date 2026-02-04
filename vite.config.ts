import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 1420,
    strictPort: true,
    allowedHosts: ['.monkeycode-ai.online']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
