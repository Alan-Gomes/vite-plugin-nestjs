import { defineConfig } from "vite";
import { nestjsPlugin } from "../../packages/vite-plugin-nestjs/src/index.ts";

export default defineConfig({
  plugins: [nestjsPlugin()],
});
