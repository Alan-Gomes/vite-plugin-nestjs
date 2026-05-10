import type { IncomingMessage, ServerResponse } from "node:http";
import type { INestApplication } from "@nestjs/common";
import type { Logger } from "vite";
import type { AsyncCoordinator } from "../../types.js";

function isNestApp(v: unknown): v is INestApplication {
  return !!v && typeof v === "object" && typeof Reflect.get(v, "getHttpAdapter") === "function";
}

export class NestServerManager {
  private prevApp: INestApplication | undefined;
  private initLock: Promise<INestApplication> | undefined;

  constructor(
    private readonly importModule: () => Promise<unknown>,
    private readonly logger: Logger,
    private readonly coordinators: readonly AsyncCoordinator[] = [],
  ) {}

  private async waitForAllReady(): Promise<void> {
    await Promise.all(this.coordinators.map((c) => c.waitForReady()));
  }

  private async loadApp(): Promise<INestApplication> {
    let exported = await this.importModule();

    if (exported instanceof Promise) {
      exported = await exported;
    }
    if (!isNestApp(exported)) {
      throw new Error("[vite-plugin-nestjs] imported module is not a NestJS application");
    }

    return exported;
  }

  private async acquireApp(): Promise<INestApplication> {
    if (this.initLock) return this.initLock;
    if (this.prevApp) return this.prevApp;

    this.initLock = (async () => {
      const app = await this.loadApp();
      if (this.prevApp) {
        try {
          await this.prevApp.close();
        } catch (err) {
          this.logger.warn(
            `[vite-plugin-nestjs] error closing previous app: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      await app.init();
      this.prevApp = app;
      return app;
    })();

    try {
      return await this.initLock;
    } finally {
      this.initLock = undefined;
    }
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    await this.waitForAllReady();

    const app = await this.acquireApp();
    const instance = app.getHttpAdapter().getInstance();

    if (typeof instance === "function") {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      (instance as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
      return;
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    if (instance && typeof Reflect.get(instance as object, "ready") === "function") {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const fastify = instance as {
        ready(): Promise<{ routing(req: IncomingMessage, res: ServerResponse): void }>;
      };
      (await fastify.ready()).routing(req, res);
      return;
    }

    throw new Error("[vite-plugin-nestjs] unrecognized HTTP adapter instance");
  }

  async start(): Promise<void> {
    try {
      await this.waitForAllReady();
      await this.acquireApp();
    } catch (error: unknown) {
      this.logger.error(
        `[vite-plugin-nestjs] failed to start: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error : undefined },
      );
    }
  }

  async close(): Promise<void> {
    try {
      await this.prevApp?.close();
    } catch (error) {
      this.logger.error(
        `[vite-plugin-nestjs] failed to close: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error : undefined },
      );
    }
    this.prevApp = undefined;
  }
}
