# Contributing to Vinkius Desktop

Thank you for your interest in contributing to Vinkius Desktop! This guide will help you get started.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/vinkius/desktop/issues) to report bugs or suggest features
- Check existing issues before creating a new one
- Include steps to reproduce, expected behavior, and your environment (OS, app version)

### Pull Requests

1. **Fork** the repository and create your branch from `main`
2. **Install** dependencies: `npm install`
3. **Develop** with hot-reload: `npm run tauri dev`
4. **Test** your changes work across light and dark mode
5. **Commit** with clear, descriptive messages
6. **Open a Pull Request** against `main`

### Code Style

- **TypeScript** — Strict typing, avoid `any`
- **Vue 3** — Composition API with `<script setup>` syntax
- **Tailwind CSS 4** + **shadcn-vue** — Use design tokens, avoid hardcoded CSS values
- **Components** — Keep components focused and reusable

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add server search filtering
fix: resolve dark mode border visibility
refactor: simplify client detection logic
docs: update README with build instructions
```

## Development Setup

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Platform-specific [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Quick Start

```bash
npm install
npm run tauri dev
```

### Project Architecture

- `src/` — Vue frontend (components, composables, stores, views)
- `src-tauri/` — Rust backend (system commands, config management, auth)
- The Desktop app communicates with the [Vinkius Cloud API](https://cloud.vinkius.com) for marketplace data

## Community Guidelines

- Be respectful and constructive
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Ask questions in [GitHub Discussions](https://github.com/vinkius/desktop/discussions)

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
