import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Deliberately separate from vite.config.js: the test run needs neither the dev
// server proxy nor the Tailwind plugin, and keeping them out makes it faster.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // Component styling is asserted through class names, never compiled CSS.
    css: false,
    // Undo spies/stubs between tests so one test cannot leak into the next.
    restoreMocks: true,
    unstubGlobals: true,
  },
})
