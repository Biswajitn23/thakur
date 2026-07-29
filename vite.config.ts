// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig as originalDefineConfig } from "@lovable.dev/vite-tanstack-config";

const configFn = originalDefineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
  },
});

export default async (env: any) => {
  const config = await configFn(env);

  // Filter out the 'vite-tsconfig-paths' plugin added by the wrapper.
  const filterPlugin = (plugin: any): any => {
    if (!plugin) return null;
    if (Array.isArray(plugin)) {
      return plugin.map(filterPlugin).filter(Boolean);
    }
    if (typeof plugin === "object" && plugin.name === "vite-tsconfig-paths") {
      return null;
    }
    return plugin;
  };

  if (config.plugins) {
    config.plugins = config.plugins.map(filterPlugin).filter(Boolean);
  }

  return config;
};

