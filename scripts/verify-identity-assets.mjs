import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const { artifacts } = JSON.parse(
  await readFile(new URL("src/data/identity-sources.json", root), "utf8"),
);
assert.equal(artifacts.length, 10);
assert.equal(new Set(artifacts.map((a) => a.project)).size, 7);
for (const item of artifacts) {
  assert.match(item.revision, /^[a-f0-9]{40}$/);
  assert.match(item.sourceSha256, /^[a-f0-9]{64}$/);
  assert.match(item.destinationSha256, /^[a-f0-9]{64}$/);
  assert.ok(
    item.destination.startsWith("public/") &&
      !item.destination.split("/").includes(".."),
  );
  const bytes = await readFile(new URL(item.destination, root));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    item.destinationSha256,
    item.destination,
  );
  if (item.project === "refpot" && item.destination.endsWith(".svg")) {
    assert.doesNotMatch(bytes.toString(), /A simple Python ORM|Planned, not released/);
    assert.match(bytes.toString(), /Native C\+\+ database · alpha/);
    assert.match(bytes.toString(), /Python CRUD\. Explicit transactions/);
  }
  if (item.project === "utilitypot" && item.destination.includes("lockup") && item.destination.endsWith(".svg")) {
    assert.match(bytes.toString(), /5 browser-local tools · 3 disclosed AI tools/);
    assert.doesNotMatch(bytes.toString(), /Jev interprets\. You review\. Code executes/);
  }
  if (item.transform === "copy")
    assert.equal(
      item.destinationSha256,
      item.sourceSha256,
      item.destination + " must preserve canonical bytes",
    );
  else assert.equal(item.transform, "webp-quality-92");
}
console.log(
  `Verified ${artifacts.length} identity artifacts across ${new Set(artifacts.map(a=>a.project)).size} products with immutable source revisions.`,
);
