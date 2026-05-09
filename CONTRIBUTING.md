# Contributing to vite-plugin-nestjs

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

Be respectful and constructive. We want this project to be a welcoming space for everyone.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) (used as the package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/Alan-Gomes/vite-plugin-nestjs.git
cd vite-plugin-nestjs

# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run the example app
pnpm dev:example
```

## Project Structure

This is a pnpm monorepo with the following layout:

```
packages/
  vite-plugin-nestjs/   # The plugin source code
examples/
  basic-nest/           # Example NestJS app using the plugin
```

## Making Changes

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes in `packages/vite-plugin-nestjs/src/`.
3. Test your changes against the example app (`pnpm dev:example`).
4. Run the linter and formatter before committing:
   ```bash
   pnpm lint:fix
   ```

## Submitting a Pull Request

1. Push your branch to your fork and open a PR against the `main` branch.
2. Fill in the PR description with what changed and why.
3. Keep PRs focused — one feature or bug fix per PR.
4. A maintainer will review your PR and may request changes before merging.

## Reporting Issues

Use [GitHub Issues](https://github.com/Alan-Gomes/vite-plugin-nestjs/issues) to report bugs or request features. Please include:

- A clear description of the problem or request
- Steps to reproduce (for bugs)
- Your Node.js and pnpm versions
- Relevant configuration or error output

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
