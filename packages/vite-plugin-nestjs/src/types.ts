export function invariant<T>(value: T, message: string = "Invariant error"): NonNullable<T> {
  if (value === null || value === undefined) throw new Error(message);
  return value as NonNullable<T>;
}

export class SwaggerCoordinator {
  private pending: Promise<void> | null = null;
  private resolvePending: (() => void) | null = null;

  markDirty(): void {
    if (this.pending) return;
    this.pending = new Promise<void>((resolve) => {
      this.resolvePending = resolve;
    });
  }

  markReady(): void {
    this.resolvePending?.();
    this.resolvePending = null;
    this.pending = null;
  }

  waitForReady(): Promise<void> {
    return this.pending ?? Promise.resolve();
  }
}

export interface ResolvedSwaggerConfig {
  outputDir: string;
  tsconfigPath: string;
  pluginOptions: Record<string, unknown>;
}

export interface ResolvedNestConfig {
  entry: string;
  tsconfigPath: string;
  sourceRoot: string;
  swagger: ResolvedSwaggerConfig | null;
}

export interface NestjsPluginOptions {
  nestCliPath?: string;
  project?: string;
  exportName?: string;
}
