const fs = require("fs");
const path = require("path");
const fsp = fs.promises;
const root = process.cwd();
const stash = path.join(root, ".static-stash");
const items = [
  ["src/app/robots.ts", "robots.ts"],
  ["src/app/robots.txt/route.ts", "robots.txt_route.ts"],
  ["src/app/sitemap.ts", "sitemap.ts"],
  ["src/app/sitemap.xml/route.ts", "sitemap_xml_route.ts"],
  ["src/app/api", "app_api_dir"],
];
(async () => {
  await fsp.mkdir(stash, { recursive: true });
  for (const [fromRel, toRel] of items) {
    const from = path.join(root, fromRel);
    if (fs.existsSync(from)) {
      const to = path.join(stash, toRel);
      await fsp.rename(from, to);
      console.log("Stashed:", fromRel);
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
