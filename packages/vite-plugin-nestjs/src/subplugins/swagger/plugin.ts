import type { Plugin } from "vite";
import type { AsyncCoordinator, ResolvedSwaggerConfig } from "../../types.js";
import { SwaggerMetadataManager } from "./swagger-metadata-manager.js";

export interface NestjsSwaggerPluginOptions {
  swagger: ResolvedSwaggerConfig;
  coordinator: AsyncCoordinator;
}

export function nestjsSwaggerPlugin(options: NestjsSwaggerPluginOptions): Plugin {
  const { swagger, coordinator } = options;
  const swaggerManager = new SwaggerMetadataManager(swagger, coordinator);

  let command: "serve" | "build" = "serve";

  return {
    name: "vite-plugin-nestjs:swagger",

    configResolved(resolved) {
      command = resolved.command;
    },

    configureServer() {
      return () => {
        void swaggerManager.generate();
      };
    },

    async buildStart() {
      if (command === "build") await swaggerManager.generate();
    },
  };
}
