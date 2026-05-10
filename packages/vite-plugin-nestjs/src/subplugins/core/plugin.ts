import { type IncomingMessage, type ServerResponse } from "node:http";
import { relative } from "node:path";
import type { Connect, Plugin } from "vite";
import { isRunnableDevEnvironment, normalizePath } from "vite";
import type { AsyncCoordinator } from "../../types.js";
import { NestServerManager } from "./nest-server-manager.js";

export interface NestjsCorePluginOptions {
  entry: string;
  metadataPath?: string;
  exportName?: string;
  coordinators?: readonly AsyncCoordinator[];
}

export function nestjsCorePlugin(options: NestjsCorePluginOptions): Plugin {
  const { entry, metadataPath, exportName = "default", coordinators } = options;

  let nestManager: NestServerManager | undefined;

  return {
    name: "vite-plugin-nestjs:core",

    config: () => ({
      appType: "custom",
      build: { ssr: entry, target: "node20" },
      optimizeDeps: { noDiscovery: true },
      resolve: { tsconfigPaths: true },
    }),

    configureServer(server) {
      if (!isRunnableDevEnvironment(server.environments.ssr)) {
        return () => {};
      }

      const ssr = server.environments.ssr;
      const url = "/" + normalizePath(relative(server.config.root, entry));
      nestManager = new NestServerManager(
        () => ssr.runner.import(url).then((mod) => mod[exportName]),
        server.config.logger,
        coordinators,
      );

      return () => {
        const originalListen = server.listen.bind(server);
        server.listen = async (...args) => {
          await nestManager?.start();
          return await originalListen(...args);
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

    handleHotUpdate({ server, file }) {
      if (metadataPath && file === metadataPath) {
        return [];
      }
      void server.restart(true);
      return [];
    },

    async closeBundle() {
      await nestManager?.close();
    },
  };
}
