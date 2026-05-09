import { type IncomingMessage, type ServerResponse } from "node:http";
import { relative } from "node:path";
import type { Connect, Plugin } from "vite";
import { isRunnableDevEnvironment, normalizePath } from "vite";
import { NestServerManager } from "./nest-server-manager.js";
import { resolveNestConfig } from "./nest-cli.js";
import { SwaggerMetadataManager } from "./swagger-metadata-manager.js";
import { SwaggerCoordinator, invariant, type NestjsPluginOptions } from "./types.js";

export function nestjsPlugin(options: NestjsPluginOptions = {}): Plugin {
  const { nestCliPath, project, exportName = "default" } = options;

  const config = resolveNestConfig({
    root: process.cwd(),
    nestCliPath,
    project,
  });

  const coordinator = config.swagger ? new SwaggerCoordinator() : undefined;
  const swaggerManager = config.swagger
    ? new SwaggerMetadataManager(config.swagger, invariant(coordinator))
    : undefined;

  let nestManager: NestServerManager | undefined;
  let command: "serve" | "build" = "serve";

  return {
    name: "vite-plugin-nestjs",

    config: () => ({
      appType: "custom",
      build: { ssr: config.entry, target: "node20" },
      optimizeDeps: { noDiscovery: true },
    }),

    configResolved(resolved) {
      command = resolved.command;
    },

    configureServer(server) {
      if (!isRunnableDevEnvironment(server.environments.ssr)) {
        return () => {};
      }

      const ssr = server.environments.ssr;
      const url = "/" + normalizePath(relative(server.config.root, config.entry));
      nestManager = new NestServerManager(
        () => ssr.runner.import(url).then((mod) => mod[exportName]),
        server.config.logger,
        coordinator,
      );

      return () => {
        void swaggerManager?.generate();

        const originalListen = server.listen.bind(server);
        server.listen = async (...args) => {
          await nestManager?.start();
          const result = await originalListen(...args);
          return result;
        };

        server.middlewares.use(
          (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
            if (nestManager) {
              nestManager.handle(req, res).catch(next);
            } else {
              next();
            }
          },
        );
      };
    },

    handleHotUpdate({ file, server }) {
      if (swaggerManager && file === swaggerManager.metadataPath) {
        return [];
      }
      void server.restart(true);
      return [];
    },

    async buildStart() {
      if (command === "build") await swaggerManager?.generate();
    },

    async closeBundle() {
      await nestManager?.close();
    },
  };
}
