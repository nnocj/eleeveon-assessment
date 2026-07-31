/**
 * Scans app/branch-admin/website/templates/<template-folder>/index.tsx and generates the registry.
 * Add a template folder, then run this script (wire it to predev/prebuild).
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const templatesDir = path.join(root, "app/branch-admin/website/templates");
const entries = (await readdir(templatesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const imports = entries.map((name, index) => `import template${index} from "./${name}";`).join("\n");
const refs = entries.map((_, index) => `template${index}`).join(",\n  ");
const output = `/** AUTO-GENERATED. DO NOT EDIT. */\nimport type { WebsiteTemplateDefinition } from "../types";\n${imports}\n\nexport const GENERATED_WEBSITE_TEMPLATES: WebsiteTemplateDefinition[] = [\n  ${refs}\n];\n`;
await writeFile(path.join(templatesDir, "registry.generated.ts"), output, "utf8");
console.log(`Generated website registry with ${entries.length} template(s).`);
