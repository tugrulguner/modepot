# Preview fixture provenance

These checked-in files are byte-for-byte copies of reviewed sibling-project captures; the preview renderer and regression test consume these files rather than hand-authored demo output.

| Fixture | Reviewed source path and immutable revision | Copied fixture SHA-256 | Source-recorded input hash |
| --- | --- | --- | --- |
| `dexpot-typed-crud-capture.json` | [dexpot `c2adef4c8cfc4635e56cbb562e861b235311d6c0`](https://github.com/tugrulguner/dexpot/blob/c2adef4c8cfc4635e56cbb562e861b235311d6c0/website/src/content/docs/data/typed-crud-capture.json) | `12e3b9f08b83075e4f514714c0b7459e0ecdb4c2940b997dd2715f1f13cf9c2b` | `0f963851eff8d82373c795051825a9ccc99b048c4dd6c9315c7b8d9403e72d3a` (`examples/typed_crud.py`) |
| `intpot-demo-preview.json` | [intpot `b32a9025c6e4f9a536fea8c285816561adba9b0e`](https://github.com/tugrulguner/intpot/blob/b32a9025c6e4f9a536fea8c285816561adba9b0e/website/src/data/demo-preview.json) | `b9cc223c7626dcf6126020a9dbb97599de3a141a415793f15f55c06500b5efda` | `bc3ab7142fe6a1f88dce68ada162e790726bdf3a86cdcc678a4d7da656e2bb3a` (`examples/semantic_schema.py`) |

The Dexpot preview uses the first recorded GET (`/items/1`, starter, 9.99). The Intpot preview uses the `greet` capture, including `excited: true`; the captured API result is a string, not a JSON object. The Intpot demo link targets the page's `demo-preview-title` element.
