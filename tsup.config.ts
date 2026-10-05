import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

// The editor needs these from the host; a bot that only uses core or
// runtime never loads them.
const external = ["react", "react-dom", "react/jsx-runtime", "lucide-react", "unicode-emoji-json"];

export default defineConfig([
  {
    // ES modules for bundlers and Node; splitting keeps the emoji data in a
    // chunk of its own that the picker loads when it opens
    entry: { core: "src/core.ts", react: "src/index.ts", runtime: "src/runtime.ts" },
    format: ["esm"],
    dts: true,
    splitting: true,
    target: "es2022",
    external,
    onSuccess: async () => copyFileSync("src/theme.css", "dist/theme.css"),
  },
  {
    // CommonJS for bots that still require()
    entry: { core: "src/core.ts", runtime: "src/runtime.ts" },
    format: ["cjs"],
    dts: true,
    target: "es2022",
    external,
  },
]);
