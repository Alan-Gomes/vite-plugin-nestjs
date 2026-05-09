# vite-plugin-nestjs

> Run your NestJS application through Vite — native ESM, Vite plugin ecosystem, and Swagger metadata out of the box.

[![npm version](https://img.shields.io/npm/v/vite-plugin-nestjs)](https://www.npmjs.com/package/vite-plugin-nestjs)
[![license](https://img.shields.io/npm/l/vite-plugin-nestjs)](https://github.com/Alan-Gomes/vite-plugin-nestjs/blob/main/LICENSE)
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

That's it. Run `vite` and your NestJS controllers are available at `http://localhost:5173`.

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

A working example is available in [`examples/basic-nest`](./examples/basic-nest). It demonstrates:

- A minimal NestJS app with one controller.
- Swagger metadata generation.
- The recommended `main.ts` pattern for dev/prod parity.

```bash
pnpm install
pnpm dev:example
```

---

## Contributing

Bug reports and pull requests are welcome. Please open an issue first to discuss significant changes.

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run the example in dev mode
pnpm dev:example

# Lint and format
pnpm lint
pnpm format
```

---

## License

[MIT](./LICENSE)
