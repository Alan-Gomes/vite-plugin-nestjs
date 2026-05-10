import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import type {
  CompilerOptions,
  Configuration,
} from "@nestjs/cli/lib/configuration/configuration.js";
import { defaultTo, isPlainObject, mergeDeep, prop } from "remeda";
import type { ResolvedNestConfig, ResolvedSwaggerConfig } from "./types.js";

function readNestCliJson(absolutePath: string): Configuration {
  if (!existsSync(absolutePath)) {
    throw new Error(`[vite-plugin-nestjs] nest-cli config not found at: ${absolutePath}`);
  }
  let fileText: string;
  try {
    fileText = readFileSync(absolutePath, "utf-8");
  } catch (error) {
    throw new Error(`[vite-plugin-nestjs] could not read ${absolutePath}`, { cause: error });
  }
  try {
    return JSON.parse(fileText);
  } catch (error) {
    throw new Error(
      `[vite-plugin-nestjs] failed to parse ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function resolveTsconfigPath(compilerOptions: CompilerOptions | undefined): string {
  if (!compilerOptions) return "tsconfig.json";

  const { builder, tsConfigPath } = compilerOptions;
  const configPathFromBuilder = isPlainObject(builder)
    ? prop(builder, "options", "configPath")
    : undefined;
  if (configPathFromBuilder) return configPathFromBuilder;

  return defaultTo(tsConfigPath, "tsconfig.json");
}

function resolveSwaggerPlugin(
  plugins: CompilerOptions["plugins"] = [],
): { options: Record<string, unknown> } | null {
  const matched = plugins.find(
    (compilerPlugin) =>
      compilerPlugin === "@nestjs/swagger" ||
      (typeof compilerPlugin === "object" && compilerPlugin.name === "@nestjs/swagger"),
  );

  if (matched === undefined) return null;
  if (typeof matched === "string") return { options: {} };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    options: (matched.options as unknown as Record<string, unknown>) ?? {},
  };
}

export interface ResolveNestConfigOptions {
  root: string;
  nestCliPath?: string;
  project?: string;
}

export function resolveNestConfig(options: ResolveNestConfigOptions): ResolvedNestConfig {
  const { root, nestCliPath = "nest-cli.json", project: projectName } = options;

  const nestCliAbsolutePath = isAbsolute(nestCliPath) ? nestCliPath : resolve(root, nestCliPath);
  const nestCliDirectory = dirname(nestCliAbsolutePath);
  const fileConfiguration = readNestCliJson(nestCliAbsolutePath);

  const project = projectName ? fileConfiguration.projects?.[projectName] : undefined;

  const mergedConfiguration = mergeDeep(fileConfiguration, project ?? {});
  const mergedCompilerOptions = mergedConfiguration.compilerOptions;

  const sourceRootRelative = defaultTo(mergedConfiguration.sourceRoot, "src");
  const entryModuleBaseName = defaultTo(mergedConfiguration.entryFile, "main");
  const tsconfigPath = resolveTsconfigPath(mergedCompilerOptions);

  const absoluteSourceRoot = resolve(nestCliDirectory, sourceRootRelative);
  const absoluteEntryPath = resolve(absoluteSourceRoot, `${entryModuleBaseName}.ts`);
  const absoluteTsconfigPath = resolve(nestCliDirectory, tsconfigPath);

  const swaggerPluginMatch = resolveSwaggerPlugin(mergedCompilerOptions?.plugins);

  const swagger: ResolvedSwaggerConfig | null = swaggerPluginMatch
    ? {
        outputDir: absoluteSourceRoot,
        tsconfigPath: absoluteTsconfigPath,
        pluginOptions: swaggerPluginMatch.options,
      }
    : null;

  return {
    entry: absoluteEntryPath,
    tsconfigPath: absoluteTsconfigPath,
    sourceRoot: absoluteSourceRoot,
    swagger,
  };
}
