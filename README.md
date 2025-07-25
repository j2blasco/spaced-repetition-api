# TypeScript Package Template

A modern, feature-rich template for creating TypeScript packages with best practices and developer tooling built-in.

## ✨ Features

### 📦 Package Management
- **Dual Module Support**: Outputs both CommonJS and ESM builds
- **Type Definitions**: Automatically generated TypeScript declarations
- **NPM Publishing**: Pre-configured for publishing to npm with proper exports

### 🔧 Development Tools
- **ESLint Configuration**: Comprehensive linting with TypeScript, import rules, and Prettier integration
- **Jest Testing**: Complete testing setup with TypeScript support and ESM compatibility
- **Boundary Enforcement**: Automated architectural boundaries with eslint-plugin-boundaries
- **TSX Scripts**: Execute TypeScript scripts directly with tsx

### 🏗️ Build System
- **Multiple Build Targets**: Separate builds for CommonJS (`dist/cjs`) and ESM (`dist/esm`)
- **Type Generation**: TypeScript declarations output to `types/` directory
- **Build Optimization**: Excludes test files and boundary configurations from production builds

### 🧪 Testing
- **Jest with TypeScript**: Full TypeScript support with ts-jest
- **ESM Support**: Configured for modern ES modules
- **Test Patterns**: Automatically finds `*.test.ts` files
- **Test Utilities**: Excludes utility test files from main test runs

### 🎯 Code Quality
- **Strict TypeScript**: Configured with strict mode and modern ES2022 target
- **Import Resolution**: TypeScript path mapping and import validation
- **Prettier Integration**: Code formatting with ESLint
- **Boundary Rules**: Enforces architectural boundaries between modules

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build both CommonJS and ESM versions |
| `npm run build:cjs` | Build CommonJS version only |
| `npm run build:esm` | Build ESM version only |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint with boundary generation |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run script <file>` | Execute TypeScript scripts with tsx |
| `npm run boundaries:generate` | Generate ESLint boundary rules |

### Project Structure
```
src/                          # Source code
├── boundaries.types.ts       # Boundary configuration types
├── root.boundaries.ts        # Root boundary configuration
└── index.ts                  # Main entry point

scripts/                      # Build and utility scripts
├── src/
│   ├── generate-eslint-boundaries.ts  # Boundary rule generator
│   └── scripts-root-path.ts          # Script utilities
└── tsconfig.json            # Scripts TypeScript config

types/                        # Generated type definitions
dist/                         # Built output
├── cjs/                     # CommonJS build
└── esm/                     # ESM build
```

## 🏛️ Architectural Boundaries

This template includes a sophisticated boundary enforcement system:

- **Boundary Types**: Define module boundaries in `boundaries.types.ts`
- **Configuration**: Set up boundaries in `*.boundaries.ts` files
- **Auto-generation**: ESLint rules are automatically generated from boundary configs
- **Enforcement**: Import/export rules are enforced at build time

### Example Boundary Configuration
```typescript
import type { Boundaries } from './boundaries.types';

const boundaries: Boundaries = {
  name: 'feature-module',
  internal: ['./internal/**'],
  external: ['../shared/**', '../utils/**']
};
```

## 🔧 Configuration Files

- **`tsconfig.json`**: Main TypeScript configuration
- **`tsconfig.build.json`**: Base build configuration
- **`tsconfig.esm.json`**: ESM-specific settings
- **`tsconfig.cjs.json`**: CommonJS-specific settings
- **`eslint.config.mjs`**: ESLint configuration with TypeScript and boundaries
- **`jest.config.ts`**: Jest testing configuration
- **`eslint.boundaries.generated.mjs`**: Auto-generated boundary rules

## 📝 Usage Tips

1. **Adding New Modules**: Create boundary files for new modules to maintain architecture
2. **Testing**: Use the Jest setup for comprehensive testing with TypeScript support
3. **Scripts**: Use `npm run script` to execute one-off TypeScript scripts
4. **Building**: Run `npm run build` before publishing to generate all required outputs

## 🤝 Contributing

This template follows modern TypeScript best practices. When contributing:
- Follow the ESLint rules
- Add tests for new functionality
- Update boundary configurations for new modules
- Run `npm run lint` and `npm test` before committing
