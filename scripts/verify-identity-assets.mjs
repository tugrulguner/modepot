import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const { artifacts } = JSON.parse(
  await readFile(new URL("src/data/identity-sources.json", root), "utf8"),
);
assert.equal(artifacts.length, 8);
assert.equal(new Set(artifacts.map((a) => a.project)).size, 6);
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
  if (item.transform === "copy")
    assert.equal(
      item.destinationSha256,
      item.sourceSha256,
      item.destination + " must preserve canonical bytes",
    );
  else assert.equal(item.transform, "webp-quality-92");
}
console.log(
  "Verified eight identity artifacts from six immutable product-source revisions.",
);
