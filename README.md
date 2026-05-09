# vite-plugin-nestjs

> Run your NestJS application through Vite — native ESM, Vite plugin ecosystem, and Swagger metadata out of the box.

[![npm version](https://img.shields.io/npm/v/vite-plugin-nestjs)](https://www.npmjs.com/package/vite-plugin-nestjs)
[![license](https://img.shields.io/npm/l/vite-plugin-nestjs)](./LICENSE)

For usage docs, configuration reference, and examples, see the [**package README**](./packages/vite-plugin-nestjs/README.md).

---

## Contributing

Thank you for your interest in contributing! Full guidelines are in [CONTRIBUTING.md](./CONTRIBUTING.md).

### Quick setup

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

### Project structure

```
packages/
  vite-plugin-nestjs/   # The plugin source code and docs
examples/
  basic-nest/           # Example NestJS app using the plugin
```

### Workflow

1. Fork the repository and create a branch from `main`.
2. Make changes in `packages/vite-plugin-nestjs/src/`.
3. Test against the example app (`pnpm dev:example`).
4. Run `pnpm lint:fix` before committing.
5. Open a PR against `main` — keep it focused on one feature or fix.

Use [GitHub Issues](https://github.com/Alan-Gomes/vite-plugin-nestjs/issues) to report bugs or request features.

---

## License

[MIT](./LICENSE)
