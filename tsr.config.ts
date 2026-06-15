import { defineConfig } from "@tanstack/router-generator";

export default defineConfig({
  routesDirectory: "./app/routes",
  generatedRouteTree: "./app/routeTree.gen.ts",
  quoteStyle: "single",
});
