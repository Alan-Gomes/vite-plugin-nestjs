<p align="center">
  <img src="https://skillicons.dev/icons?i=vite,nestjs&perline=2" alt="Vite and NestJS" height="64">
</p>

# vite-plugin-nestjs

> Run your NestJS application through Vite — native ESM, Vite plugin ecosystem, and Swagger metadata out of the box.

[![npm version](https://img.shields.io/npm/v/vite-plugin-nestjs)](https://npmx.dev/package/vite-plugin-nestjs)
[![license](https://img.shields.io/npm/l/vite-plugin-nestjs)](./LICENSE)
[![node](https://img.shields.io/node/v/vite-plugin-nestjs)](https://nodejs.org)

---

## What is this?

`vite-plugin-nestjs` lets you run your NestJS application through **Vite** instead of the NestJS CLI. This gives you native ESM support, the ability to use any Vite plugin in your NestJS project, and automatic Swagger metadata generation when `@nestjs/swagger` is detected in your `nest-cli.json`.

---

## Requirements

- Node.js **≥ 20**
- Vite **^8.0.0**
- `@nestjs/common` and `@nestjs/core` **≥ 10**

---

## Quick start

```bash
npm install vite-plugin-nestjs
# or
pnpm add vite-plugin-nestjs
```

**1. Register the plugin in `vite.config.ts`:**

```ts
import { defineConfig } from "vite";
import { nestjsPlugin } from "vite-plugin-nestjs";

export default defineConfig({
  plugins: [nestjsPlugin()],
});
```

**2. Export your Nest app as the default export from your entry file:**

```ts
// src/main.ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const app = await NestFactory.create(AppModule);

// Only bind a port in production — in dev, Vite serves the requests
if (import.meta.env.PROD) {
  await app.listen(3000);
}

export default app;
```

**3. Keep your `nest-cli.json` as usual** — the plugin reads it automatically:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "sourceRoot": "src",
  "entryFile": "main"
}
```

That's it. Run `vite` and your NestJS controllers are available at `http://localhost:5173` — see [Development server](#development-server) for scripts, ports, and how dev mode differs from production.

---

## Development server

Start Vite in dev mode from your Nest project root (where `vite.config.ts` and `nest-cli.json` live):

```bash
vite
```

Or add a script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

Then run `pnpm dev`, `npm run dev`, or `yarn dev`.

By default the server listens on [**http://localhost:5173**](http://localhost:5173). Use Vite’s CLI to change host or port, for example `vite --port 4000`.

In dev, the plugin mounts your Nest application on Vite’s HTTP server, so **do not** call `app.listen` unless `import.meta.env.PROD` is `true` (as in the Quick start example). The same process serves both Vite and your API routes.

When you change source files, Vite reloads; the plugin may restart the dev server so the Nest app picks up changes.

---

## Features

- **Vite plugin ecosystem** — use any Vite plugin in your NestJS project.
- **Automatic Swagger metadata** — detects `@nestjs/swagger` in your `nest-cli.json` compiler plugins and generates `metadata.ts` before any request is handled.
- **Production-ready build** — `vite build` bundles your Nest app as a standard Node SSR entry; run it with `node dist/main.js`.

---

## Configuration

All options are optional.

```ts
nestjsPlugin({
  nestCliPath?: string,
  project?: string,
  exportName?: string,
})
```

| Option        | Type     | Default           | Description                                                                                 |
| ------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `nestCliPath` | `string` | `"nest-cli.json"` | Path to your `nest-cli.json`. Resolved from `process.cwd()`. Can be absolute.               |
| `project`     | `string` | —                 | Name of a project inside `nest-cli.json`'s `projects` map. Use in multi-project workspaces. |
| `exportName`  | `string` | `"default"`       | Name of the export from your entry file that holds the `INestApplication` instance.         |

---

## `@nestjs/swagger` integration

Add `@nestjs/swagger` to `compilerOptions.plugins` in your `nest-cli.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "introspectComments": true
        }
      }
    ]
  }
}
```

In your entry file, load the generated metadata before setting up `SwaggerModule`:

```ts
import "reflect-metadata";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
// @ts-ignore
import metadata from "./metadata";

const app = await NestFactory.create(AppModule);

await SwaggerModule.loadPluginMetadata(metadata);

const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder().setTitle("My API").build(),
);
SwaggerModule.setup("apidocs", app, document);

if (import.meta.env.PROD) {
  await app.listen(3000);
}

export default app;
```

---

## Production build

`vite build` bundles the Nest application as an SSR entry. The output is a Node.js module you can run directly:

```bash
vite build
node dist/main.js
```

Because the entry file only calls `app.listen` when `import.meta.env.PROD` is `true`, the same source works in both dev and production without any changes.

---

## Example

A working example lives in [`examples/basic-nest`](./examples/basic-nest). It demonstrates:

- A minimal NestJS app with one controller.
- Swagger metadata generation.
- The recommended `main.ts` pattern for dev/prod parity.

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
