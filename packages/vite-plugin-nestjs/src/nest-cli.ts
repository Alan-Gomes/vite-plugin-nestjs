import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import type {
  CompilerOptions,
  Configuration,
  ProjectConfiguration,
} from "@nestjs/cli/lib/configuration/configuration.js";
import type { ResolvedNestConfig, ResolvedSwaggerConfig } from "./types.js";

function readNestCliJson(absolutePath: string): Configuration {
  if (!existsSync(absolutePath)) {
    throw new Error(`[vite-plugin-nestjs] nest-cli config not found at: ${absolutePath}`);
  }
  let raw: string;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (err) {
    throw new Error(`[vite-plugin-nestjs] could not read ${absolutePath}`, { cause: err });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `[vite-plugin-nestjs] failed to parse ${absolutePath}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
}

function resolveTsconfig(opts: CompilerOptions | undefined): string {
  if (!opts) return "tsconfig.json";
  const { builder, tsConfigPath } = opts;
  if (builder && typeof builder === "object" && !Array.isArray(builder)) {
    if (
      builder.options &&
      "configPath" in builder.options &&
      typeof builder.options.configPath === "string"
    ) {
      return builder.options.configPath;
    }
  }
  return tsConfigPath ?? "tsconfig.json";
}

function findSwaggerPlugin(
  plugins: CompilerOptions["plugins"],
): { options: Record<string, unknown> } | null {
  if (!plugins) return null;
  for (const plugin of plugins) {
    if (typeof plugin === "string" && plugin === "@nestjs/swagger") {
      return { options: {} };
    }
    if (typeof plugin === "object" && plugin.name === "@nestjs/swagger") {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return { options: (plugin.options as unknown as Record<string, unknown>) ?? {} };
    }
  }
  return null;
}

function mergeWithProject(
  root: Configuration,
  project: ProjectConfiguration | undefined,
): ProjectConfiguration {
  if (!project) return root;
  return {
    sourceRoot: project.sourceRoot ?? root.sourceRoot,
    entryFile: project.entryFile ?? root.entryFile,
    compilerOptions: {
      tsConfigPath: project.compilerOptions?.tsConfigPath ?? root.compilerOptions?.tsConfigPath,
      builder: project.compilerOptions?.builder ?? root.compilerOptions?.builder,
      plugins: project.compilerOptions?.plugins ?? root.compilerOptions?.plugins,
    },
  };
}

export interface ResolveNestConfigOptions {
  root: string;
  nestCliPath?: string;
  project?: string;
}

export function resolveNestConfig(opts: ResolveNestConfigOptions): ResolvedNestConfig {
  const { root, nestCliPath = "nest-cli.json", project } = opts;

  const cliAbsPath = isAbsolute(nestCliPath) ? nestCliPath : resolve(root, nestCliPath);

  const raw = readNestCliJson(cliAbsPath);
  const cliDir = dirname(cliAbsPath);

  const effective = mergeWithProject(raw, project ? raw.projects?.[project] : undefined);

  const sourceRoot = effective.sourceRoot ?? "src";
  const entryFile = effective.entryFile ?? "main";
  const tsconfigRel = resolveTsconfig(effective.compilerOptions);

  const sourceRootAbs = resolve(cliDir, sourceRoot);
  const entryAbs = resolve(sourceRootAbs, `${entryFile}.ts`);
  const tsconfigAbs = resolve(cliDir, tsconfigRel);

  const swaggerPlugin = findSwaggerPlugin(effective.compilerOptions?.plugins);

  const swagger: ResolvedSwaggerConfig | null = swaggerPlugin
    ? {
        outputDir: sourceRootAbs,
        tsconfigPath: tsconfigAbs,
        pluginOptions: swaggerPlugin.options,
      }
    : null;

  return {
    entry: entryAbs,
    tsconfigPath: tsconfigAbs,
    sourceRoot: sourceRootAbs,
    swagger,
  };
}
