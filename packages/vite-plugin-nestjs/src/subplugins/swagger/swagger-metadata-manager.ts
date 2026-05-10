import { existsSync, watch as fsWatch } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import type { AsyncCoordinator, ResolvedSwaggerConfig } from "../../types.js";

const METADATA_FILENAME = "metadata.ts";
const BUILD_TIMEOUT_MS = 30_000;

export class SwaggerMetadataManager {
  readonly metadataPath: string;

  constructor(
    private readonly config: ResolvedSwaggerConfig,
    private readonly coordinator: AsyncCoordinator,
  ) {
    this.metadataPath = resolve(config.outputDir, METADATA_FILENAME);
  }

  async generate(): Promise<void> {
    const { PluginMetadataGenerator, ReadonlyVisitor } = await this.loadDeps();
    const parentDir = dirname(this.metadataPath);
    const metadataPath = this.metadataPath;
    const coordinator = this.coordinator;
    coordinator.markDirty();

    await new Promise<void>((ok, fail) => {
      let done = false;

      const timeout = setTimeout(() => {
        if (done) return;
        done = true;
        watcher.close();
        fail(
          new Error(
            `[vite-plugin-nestjs:swagger] metadata generation timed out after ${BUILD_TIMEOUT_MS}ms`,
          ),
        );
      }, BUILD_TIMEOUT_MS);

      const watcher = fsWatch(parentDir, (_event, filename) => {
        if (filename !== METADATA_FILENAME) return;
        if (!existsSync(metadataPath)) return;
        if (done) return;
        done = true;
        clearTimeout(timeout);
        watcher.close();
        coordinator.markReady();
        ok();
      });

      try {
        const relativeTsconfig = relative(process.cwd(), this.config.tsconfigPath);

        const generator = new PluginMetadataGenerator();
        generator.generate({
          visitors: [
            new ReadonlyVisitor({
              ...this.config.pluginOptions,
              pathToSource: this.config.outputDir,
            }),
          ],
          outputDir: this.config.outputDir,
          watch: false,
          tsconfigPath: relativeTsconfig,
        });
      } catch (error) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        watcher.close();
        fail(error);
      }
    });
  }

  private async loadDeps() {
    const { PluginMetadataGenerator } =
      await import("@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator.js");

    const { ReadonlyVisitor } = await import("@nestjs/swagger/dist/plugin/index.js");

    return { PluginMetadataGenerator, ReadonlyVisitor };
  }
}
