import { access, readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scannedRoots = ["apps", "packages", "home"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const forbidden = [
  { pattern: /https?:\/\//, reason: "runtime remote URL" },
  { pattern: /\b(?:useGLTF|useTexture|GLTFLoader|OBJLoader|FBXLoader|TextureLoader|CubeTextureLoader|RGBELoader)\b/, reason: "external model or texture loader" },
  { pattern: /\bmesh(?:Standard|Physical|Phong|Lambert|Basic)Material\b/i, reason: "non-toon visible material" },
  { pattern: /\bCanvasTexture\b/, reason: "ad-hoc procedural texture outside the engine floor-finish owner" },
  { pattern: /\.(?:gltf|glb|obj|fbx|dae|3ds|mtl|png|jpe?g|webp|gif|avif|svg|hdr|exr|ktx2)(?:["'`?])/, reason: "external visual asset reference" },
];
const stableUiAssetReferences = [
  /(["'`])\.\/assets\/scene-actions\/[a-z0-9-]+\.png\1/g,
  /(["'`])\/cabane-icon\.png\1/g,
];
const generatedVisualForbidden = [
  { pattern: /<meshToonMaterial\b/, reason: "local toon material instead of engine ToonMaterial" },
  { pattern: /\b(?:DataTexture|gradientMap)\b/, reason: "local toon gradient instead of engine visual vocabulary" },
  { pattern: /<(?:ambientLight|hemisphereLight|directionalLight|pointLight|spotLight)\b/, reason: "shared scene lighting outside the engine" },
];

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const errors = [];
const files = (await Promise.all(scannedRoots.map((sourceRoot) =>
  filesBelow(join(root, sourceRoot))
))).flat();
const fixturePath = join(root, "tests/fixtures/agent-home.tsx");
try {
  await access(fixturePath);
  files.push(fixturePath);
} catch {
  // A standalone policy fixture may intentionally omit the repository fixture.
}
for (const file of files) {
  const source = await readFile(file, "utf8");
  const relativePath = relative(root, file);
  for (const rule of forbidden) {
    if (
      rule.reason === "ad-hoc procedural texture outside the engine floor-finish owner"
      && relativePath === "packages/engine/src/floor-finishes/textures.ts"
    ) continue;
    let inspectedSource = source;
    if (rule.reason === "runtime remote URL" && relativePath === "apps/web/src/editor-plan-import/plan-generation-schema.ts") {
      // JSON Schema identifies its dialect; this URI is not fetched at runtime.
      inspectedSource = inspectedSource.replace("https://json-schema.org/draft/2020-12/schema", "json-schema-dialect");
    }
    if (rule.reason === "runtime remote URL" && relativePath === "packages/engine/src/HomeAssistantCorsHelp.tsx") {
      // User-activated documentation navigation, never a scene asset request.
      inspectedSource = inspectedSource.replace("https://www.home-assistant.io/integrations/http/", "http-settings-documentation");
    }
    if (rule.reason === "runtime remote URL" && relativePath === "apps/web/src/onboarding-config.ts") {
      inspectedSource = inspectedSource.replace(/https:\/\/github\.com\/cabane-app\/cabane(?:#readme)?/g, "public-source-navigation");
    }
    if (rule.reason === "runtime remote URL" && relativePath === "apps/web/src/mobile-editor/MobileEditorPrompt.tsx") {
      // This is the user-requested URL passed to the native share sheet, not a runtime asset fetch.
      inspectedSource = inspectedSource.replace("https://cabane.my", "cabane-share-destination");
    }
    if (rule.reason === "runtime remote URL" && relativePath === "packages/engine/src/ValidatedDashboardView.tsx") {
      // This user-activated feedback link opens a new tab; it is not a runtime asset fetch.
      inspectedSource = inspectedSource.replace("https://tally.so/r/QK6dMA", "feedback-navigation");
    }
    if (rule.reason === "external visual asset reference" && relativePath === "packages/engine/src/onboarding/OnboardingIntroduction.tsx") {
      inspectedSource = inspectedSource.replace('`/onboarding/${name}.png`', '"bundled-onboarding-preview"');
    }

    if (rule.reason === "external visual asset reference" && [
      "apps/web/src/HomeEditor.tsx",
      "apps/web/src/editor-workspace/EditorWorkspace.tsx",
      "apps/web/src/workspaces/WorkspaceLibrary.tsx",
    ].includes(relativePath)) {
      // The editor and workspace library reuse the checked-in engine UI brand mark.
      inspectedSource = inspectedSource.replace(/(["'`])\/cabane-icon\.png\1/g, '"bundled-cabane-brand"');
    }
    if (
      rule.reason === "external visual asset reference"
      && relativePath.startsWith("packages/engine/src/")
    ) {
      for (const reference of stableUiAssetReferences) {
        inspectedSource = inspectedSource.replace(reference, "\"bundled-stable-ui-asset\"");
      }
    }
    if (
      rule.reason === "external model or texture loader"
      && relativePath === "packages/engine/src/LiveCameraSurface.tsx"
    ) {
      inspectedSource = inspectedSource.replaceAll("TextureLoader", "EngineCameraPosterLoader");
    }
    if (rule.pattern.test(inspectedSource)) {
      errors.push(`${relativePath}: ${rule.reason}`);
    }
  }
  if (relativePath.startsWith("home/") || relativePath.startsWith("packages/catalog/")) {
    for (const rule of generatedVisualForbidden) {
      if (rule.pattern.test(source)) errors.push(`${relativePath}: ${rule.reason}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Procedural toon-only source policy is valid.");
}
