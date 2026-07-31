import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
const root=path.join(process.cwd(),"app/lib/websites/templates");
const entries=(await readdir(root,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name).sort();
const imports=entries.map((n,i)=>`import template${i} from "./${n}";`).join("\n");
const list=entries.map((_,i)=>`  template${i},`).join("\n");
await writeFile(path.join(root,"registry.generated.ts"),`/** AUTO-GENERATED. Run npm run website:templates. */\n${imports}\n\nexport const GENERATED_WEBSITE_TEMPLATES = [\n${list}\n];\n`);
console.log(`Generated website registry with ${entries.length} template(s).`);
