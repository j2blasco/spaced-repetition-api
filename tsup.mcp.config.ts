import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/api/mcp/spaced-repetition-mcp.ts',
    'src/api/mcp/spaced-repetition-http-mcp.ts',
    'src/api/mcp/start-mcp-http-server.ts',
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
