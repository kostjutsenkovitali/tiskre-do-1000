const fs = require("fs");
const path = require("path");
const fsp = fs.promises;
const root = process.cwd();
const stash = path.join(root, ".static-stash");
const restores = [
  ["robots.ts", "src/app/robots.ts"],
  ["robots.txt_route.ts", "src/app/robots.txt/route.ts"],
  ["sitemap.ts", "src/app/sitemap.ts"],
  ["sitemap_xml_route.ts", "src/app/sitemap.xml/route.ts"],
  ["app_api_dir", "src/app/api"],
  ["instructions_id_dir", "src/app/(pages)/instructions/[id]"]
  ,
  ["shop_slug_dir", "src/app/(pages)/shop/[slug]"]
];
(async () => {
  if (!fs.existsSync(stash)) process.exit(0);
  for (const [fromRel, toRel] of restores) {
    const from = path.join(stash, fromRel);
    if (fs.existsSync(from)) {
      const toDir = path.dirname(path.join(root, toRel));
      await fsp.mkdir(toDir, { recursive: true });
      await fsp.rename(from, path.join(root, toRel));
      console.log("Restored:", toRel);
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
