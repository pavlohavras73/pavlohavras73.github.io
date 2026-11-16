// Meshopt-compress the drone models in place (keeps every node and mesh name: the viewer finds
// propellers by name, so no join/flatten/instancing). Originals go to --backup <dir> first.
//   node scripts/compress-drones.mjs --backup ~/drones-backup
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const dir = "public/drones";
const bi = process.argv.indexOf("--backup");
const backup = bi > 0 ? process.argv[bi + 1] : null;
if (!backup) { console.error("pass --backup <dir>"); process.exit(1); }
await mkdir(backup, { recursive: true });

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

for (const f of (await readdir(dir)).filter((x) => x.endsWith(".glb"))) {
  const src = join(dir, f);
  await copyFile(src, join(backup, f));
  const before = (await stat(src)).size;
  const doc = await io.read(src);
  const names = doc.getRoot().listNodes().map((n) => n.getName()).sort().join("|");
  await doc.transform(dedup(), prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const after = doc.getRoot().listNodes().map((n) => n.getName()).sort().join("|");
  if (names !== after) { console.error(`${f}: node names changed, skipping`); continue; }
  await io.write(src, doc);
  console.log(`${f}: ${(before / 1024) | 0} KB → ${((await stat(src)).size / 1024) | 0} KB`);
}
