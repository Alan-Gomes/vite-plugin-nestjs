import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test as base } from "vitest";
import { startViteDev, runViteBuild, killProcess } from "./helpers/vite-process.js";
import fs from "node:fs/promises";

const EXAMPLE_DIR = join(fileURLToPath(import.meta.url), "../../examples/basic-nest");

export const test = base
  .extend("projectDirectory", { scope: "worker" }, async () => {
    return EXAMPLE_DIR;
  })
  .extend("devServer", { scope: "worker" }, async ({ projectDirectory }, { onCleanup }) => {
    await fs.rm(join(projectDirectory, "src/metadata.ts"), { force: true });

    const server = await startViteDev(projectDirectory);
    onCleanup(async () => {
      await killProcess(server.subprocess);
    });
    return server;
  })
  .extend("viteBuild", { scope: "file" }, async ({ projectDirectory }) => {
    return await runViteBuild(projectDirectory);
  });
