import { join } from "node:path";
import { test } from "./fixtures.js";
import { expect } from "vitest";
import fs from "node:fs/promises";

test.describe("vite build tests", () => {
  test("vite build exits with code 0", ({ viteBuild }) => {
    expect(viteBuild.exitCode).toBe(0);
  });

  test("SSR entry file is emitted to dist/", async ({ projectDirectory, viteBuild: _ }) => {
    expect(await fs.readFile(join(projectDirectory, "dist/main.js"), "utf-8")).toMatchSnapshot(
      "SSR entry file (dist/main.js)",
    );
  });

  test("metadata.ts is written to disk by the Swagger plugin", async ({
    projectDirectory,
    viteBuild: _,
  }) => {
    expect(await fs.readFile(join(projectDirectory, "src/metadata.ts"), "utf-8")).toMatchSnapshot(
      "metadata.ts",
    );
  });
});
