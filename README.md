<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/modepot-mark.svg?v=neutral-1">
    <source media="(prefers-color-scheme: light)" srcset="public/modepot-mark-light.svg?v=neutral-1">
    <img src="public/modepot-mark-light.svg?v=neutral-1" alt="ModePot family mark" width="96" height="96">
  </picture>
</p>

<h1 align="center">ModePot</h1>

<p align="center"><strong>We simplify, modernize, and performance-optimize frameworks, tools, engines, and games.</strong></p>

<p align="center">An open-source workshop for modernizing software foundations and inventing what comes next. AI-native and agent-friendly where they add real value, without defining every project.</p>

<p align="center">
  <a href="https://modepot.io/">ModePot</a> ·
  <a href="https://github.com/tugrulguner/modepot">GitHub</a> ·
  <a href="https://discord.gg/u3AANZr6RG">Community</a> ·
  <a href="https://tugrul.modepot.io/">Created by Tugrul Guner</a>
</p>

## Projects

Each project owns its site, source, and learning path. Start with the route for the work you want to explore:

| Project | What it does | Learn | Project site | Source |
| --- | --- | --- | --- | --- |
| **Dexpot** | Build synchronous Python HTTP APIs with adaptive execution for GIL and free-threaded CPython. Application handlers stay synchronous while routes are compiled once. | [Quick start](https://dexpot.modepot.io/quick-start/) | [dexpot.modepot.io](https://dexpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/dexpot) |
| **Intpot** | Turn typed Python tools into a CLI, HTTP API, or MCP server, and convert between existing interfaces. | [Quickstart](https://intpot.modepot.io/quickstart/) | [intpot.modepot.io](https://intpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/intpot) |
| **Summonpot** | Declare typed endpoints combining deterministic operations with explicitly bounded agent-owned decisions. | [Quick start](https://summonpot.modepot.io/quick-start/) | [summonpot.modepot.io](https://summonpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/summonpot) |
| **LifePot** | Create and replay artificial-life worlds where agent proposals become validated simulation rules. | [Simulation contract](https://github.com/tugrulguner/lifepot/blob/main/docs/simulation-contract.md) | [lifepot.modepot.io](https://lifepot.modepot.io/) | [GitHub](https://github.com/tugrulguner/lifepot) |
| **RefPot** | Experimental alpha: a native C++ embedded engine with a small Python `Database`/`Row` API for fixed-schema CRUD and explicit transactions. SQL and ORM remain planned; no broad performance result or production-durability claim. | [Quick start](https://refpot.modepot.io/package/) · [Release v0.1.1](https://github.com/tugrulguner/refpot/releases/tag/v0.1.1) | [refpot.modepot.io](https://refpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/refpot) |
| **UtilityPot** | Seven tools: four browser-local converters and calculators, and three AI-assisted tools for entities, flowcharts and webpage evidence. One fixed workflow per tool, with disclosed AI processing and inspectable results. No published release yet. | [README](https://github.com/tugrulguner/utilitypot/blob/main/README.md) | [utilitypot.modepot.io](https://utilitypot.modepot.io/) | [GitHub](https://github.com/tugrulguner/utilitypot) |

These projects are the beginning, not the boundary. RefPot is a publicly released experimental alpha (v0.1.1): its native C++ engine and small Python CRUD/explicit-transaction API are real; SQL and ORM remain planned. Qualification is limited, with no broad 2×-over-SQLite performance result or production-durability claim. ModePot is an open-source family and community; [join the community on Discord](https://discord.gg/u3AANZr6RG) to discuss the work and get involved.

<!-- project-snapshots:start -->
## Project source snapshots

GitHub metadata checked at 2026-10-17T12:09:02.997Z. These are reviewed snapshots, not a continuously live feed.
The existing scheduled source-sync workflow proposes refreshes for review; changes are not automatically merged.

| Project | Source snapshot | Latest recorded release |
| --- | --- | --- |
| dexpot | [fa99012](https://github.com/tugrulguner/dexpot/commit/fa9901251464ef95d856c2b44cf89e0c7e9339e7) | [v0.7.0](https://github.com/tugrulguner/dexpot/releases/tag/v0.7.0) |
| intpot | [01faf02](https://github.com/tugrulguner/intpot/commit/01faf02c671212cad3aea6d611d9dd9ba8e8c3fc) | [v0.11.0](https://github.com/tugrulguner/intpot/releases/tag/v0.11.0) |
| summonpot | [af2b522](https://github.com/tugrulguner/summonpot/commit/af2b522066ae11036370eafd405904555605d761) | [v0.10.0](https://github.com/tugrulguner/summonpot/releases/tag/v0.10.0) |
| lifepot | [82e6578](https://github.com/tugrulguner/lifepot/commit/82e657824af459ee3f1a9db02edebbbab1195d75) | [v0.8.0](https://github.com/tugrulguner/lifepot/releases/tag/v0.8.0) |
| refpot | [05b4680](https://github.com/tugrulguner/refpot/commit/05b4680ca5c0ca9b2164aec67bc69a3d771baaf8) | [v0.1.1](https://github.com/tugrulguner/refpot/releases/tag/v0.1.1) |
| utilitypot | [f0a4082](https://github.com/tugrulguner/utilitypot/commit/f0a4082aa59162b8a4b68af58ccc277d777ceb78) | No release recorded |
<!-- project-snapshots:end -->

## Intpot v0.11.0

Intpot v0.11.0 recovers bounded plain same-module helpers and immutable scalar/tuple constants into standalone CLI, API, and MCP output. Public conversion diagnoses missing retained-body bindings per target and refuses before writes. Dynamic state, closures, decorated helpers, ambiguous bindings, and generated-name collisions remain refused; broader annotation/default dependencies are not a full-fidelity guarantee.

[Release and upgrade notes](https://github.com/tugrulguner/intpot/discussions/205) · [Conversion boundaries](https://intpot.modepot.io/conversion-boundaries/)

## Intpot v0.10.0

Intpot v0.10.0 adds explicit conversion safeguards: CLI-to-API/MCP conversion refuses parameter callbacks that would lose validation or transformation, and public conversion refuses unrecoverable function bodies before writing output. Body-recovery diagnostics are inspectable; intentionally incomplete exports require explicit scaffold opt-in and fail with `NotImplementedError`. This is a bounded assessment, not a full conversion-fidelity guarantee.

[Release and upgrade notes](https://github.com/tugrulguner/intpot/discussions/192) · [Conversion boundaries](https://intpot.modepot.io/conversion-boundaries/)

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
npm run test:project-sync
npm run build
npm run test:layout
```

The existing weekly source-sync job opens a reviewable snapshot refresh. Bot-created pull requests may not trigger separate pull-request workflows; reviewers can run **Website layout** manually on the proposed branch before merging. Source sync itself runs its snapshot, type and build gates before publishing its proposal. Neither path automatically merges or publishes a package release.

## Deployment

The static Astro build is deployed to Cloudflare Workers Static Assets.

```bash
npm run deploy
```

Production domain: `modepot.io`
