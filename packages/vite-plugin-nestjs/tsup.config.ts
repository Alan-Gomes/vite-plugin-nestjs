import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
  target: "node20",
  dts: {
    compilerOptions: {
      // https://github.com/egoist/tsup/issues/1388
      ignoreDeprecations: "6.0",
    },
  },
});
