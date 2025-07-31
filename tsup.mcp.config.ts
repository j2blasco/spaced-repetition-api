import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/api/mcp/simple-mcp.ts',
    'src/api/mcp/spaced-repetition-mcp.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'ESNext',
  outDir: 'dist/mcp',
})
