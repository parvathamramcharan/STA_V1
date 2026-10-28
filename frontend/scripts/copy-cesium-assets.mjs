import { access, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, "..");
const cesiumBuildDirectory = path.join(
  frontendDirectory,
  "node_modules",
  "cesium",
  "Build",
  "Cesium",
);
const publicCesiumDirectory = path.join(
  frontendDirectory,
  "public",
  "cesium",
);

await access(cesiumBuildDirectory);
await cp(cesiumBuildDirectory, publicCesiumDirectory, {
  recursive: true,
  force: true,
});
