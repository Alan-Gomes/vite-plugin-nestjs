import type { Plugin, PluginOption } from "vite";
import { resolveNestConfig } from "./nest-cli.js";
import { nestjsCorePlugin } from "./subplugins/core/plugin.js";
import { nestjsSwaggerPlugin } from "./subplugins/swagger/plugin.js";
import { AsyncCoordinator, type NestjsPluginOptions } from "./types.js";
import { resolve } from "node:path";

export function nestjsPlugin(options: NestjsPluginOptions = {}): PluginOption {
  const { nestCliPath, project, exportName = "default" } = options;

  const config = resolveNestConfig({
    root: process.cwd(),
    nestCliPath,
    project,
  });

  const coordinators: AsyncCoordinator[] = [];

  const plugins: Plugin[] = [];

  let metadataPath: string | undefined;

  if (config.swagger) {
    const swaggerCoordinator = new AsyncCoordinator();
    coordinators.push(swaggerCoordinator);
    metadataPath = resolve(config.sourceRoot, "metadata.ts");
    plugins.push(
      nestjsSwaggerPlugin({
        swagger: config.swagger,
        coordinator: swaggerCoordinator,
      }),
    );
  }

  plugins.unshift(
    nestjsCorePlugin({
      entry: config.entry,
      exportName,
      coordinators,
      metadataPath,
    }),
  );

  return plugins;
}
