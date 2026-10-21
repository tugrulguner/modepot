<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/products/modepot-lockup.png?v=wordmark-parity-1">
    <img src="public/products/modepot-lockup.png?v=wordmark-parity-1" alt="ModePot — open-source software foundations, tools and games" width="600">
  </picture>
</p>

<p align="center">
  <a href="https://modepot.io/">ModePot</a> ·
  <a href="https://github.com/tugrulguner/modepot">GitHub</a> ·
  <a href="https://discord.gg/u3AANZr6RG">Community</a> ·
  <a href="https://tugrul.modepot.io/">Created by Tugrul Guner</a>
</p>

<p align="center">An open-source family building frameworks, tools, engines and games; AI-native and agent-friendly where they add real value, without defining every project.</p>

## Projects

Each project owns its site, source, and learning path. Start with the route for the work you want to explore:

| Project | What it does | Learn | Project site | Source |
| --- | --- | --- | --- | --- |
| **Dexpot** | Build synchronous Python HTTP APIs with adaptive execution for GIL and free-threaded CPython. Application handlers stay synchronous while routes are compiled once. | [Quick start](https://dexpot.modepot.io/quick-start/) | [dexpot.modepot.io](https://dexpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/dexpot) |
| **Intpot** | Turn typed Python tools into a CLI, HTTP API, or MCP server, and convert between existing interfaces. | [Quickstart](https://intpot.modepot.io/quickstart/) | [intpot.modepot.io](https://intpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/intpot) |
| **Summonpot** | Declare typed endpoints combining deterministic operations with explicitly bounded agent-owned decisions. | [Quick start](https://summonpot.modepot.io/quick-start/) | [summonpot.modepot.io](https://summonpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/summonpot) |
| **LifePot** | Create and replay artificial-life worlds where agent proposals become validated simulation rules. | [Simulation contract](https://github.com/tugrulguner/lifepot/blob/main/docs/simulation-contract.md) | [lifepot.modepot.io](https://lifepot.modepot.io/) | [GitHub](https://github.com/tugrulguner/lifepot) |
| **RefPot** | Experimental alpha: a native C++ embedded engine with a small Python `Database`/`Row` API for fixed-schema CRUD and explicit transactions. SQL and ORM remain planned; no broad performance result or production-durability claim. | [Quick start](https://refpot.modepot.io/package/) · [Release v0.1.1](https://github.com/tugrulguner/refpot/releases/tag/v0.1.1) | [refpot.modepot.io](https://refpot.modepot.io/) | [GitHub](https://github.com/tugrulguner/refpot) |
| **UtilityPot** | Eight focused browser tools: five browser-local converters and calculators, and three AI-assisted tools for entity extraction, flowcharts and webpage evidence. One fixed workflow per tool; inspect results before copying or downloading. | [README](https://github.com/tugrulguner/utilitypot/blob/main/README.md) | [utilitypot.modepot.io](https://utilitypot.modepot.io/) | [GitHub](https://github.com/tugrulguner/utilitypot) |

These projects are the beginning, not the boundary. RefPot is a publicly released experimental alpha (v0.1.1): its native C++ engine and small Python CRUD/explicit-transaction API are real; SQL and ORM remain planned. Qualification is limited, with no broad 2×-over-SQLite performance result or production-durability claim. ModePot is an open-source family and community; [join the community on Discord](https://discord.gg/u3AANZr6RG) to discuss the work and get involved.

<!-- project-snapshots:start -->
## Project source snapshots

GitHub metadata checked at 2026-10-20T02:05:38.133Z. These are reviewed snapshots, not a continuously live feed.
The existing scheduled source-sync workflow proposes refreshes for review; changes are not automatically merged.

| Project | Source snapshot | Latest recorded release |
| --- | --- | --- |
| dexpot | [01a034b](https://github.com/tugrulguner/dexpot/commit/01a034b65ae4f0901a0d523e5ec0f676809e7837) | [v0.7.0](https://github.com/tugrulguner/dexpot/releases/tag/v0.7.0) |
| intpot | [1a0df4f](https://github.com/tugrulguner/intpot/commit/1a0df4ffd8fecef6af76438870782df53b7bce98) | [v0.11.1](https://github.com/tugrulguner/intpot/releases/tag/v0.11.1) |
| summonpot | [a9fa5bb](https://github.com/tugrulguner/summonpot/commit/a9fa5bbed59fa6b73a5e223ee0887a9e82adcb4b) | [v0.10.0](https://github.com/tugrulguner/summonpot/releases/tag/v0.10.0) |
| lifepot | [4744a8d](https://github.com/tugrulguner/lifepot/commit/4744a8db79f97e9d4f20d84ebc17ce45689a7fb1) | [v0.9.0](https://github.com/tugrulguner/lifepot/releases/tag/v0.9.0) |
| refpot | [e165505](https://github.com/tugrulguner/refpot/commit/e165505a0ac895c98358c388036fc4a37a422248) | [v0.1.1](https://github.com/tugrulguner/refpot/releases/tag/v0.1.1) |
| utilitypot | [e3fd1d8](https://github.com/tugrulguner/utilitypot/commit/e3fd1d81d0415cd26887deabcb2b8142cedddb4e) | No release recorded |
<!-- project-snapshots:end -->

## Releases and changelogs

For current versions and release details, see the projects' [release pages](https://github.com/tugrulguner/dexpot/releases), [Intpot release notes](https://github.com/tugrulguner/intpot/releases), [Summonpot releases](https://github.com/tugrulguner/summonpot/releases), [LifePot releases](https://github.com/tugrulguner/lifepot/releases), and [RefPot releases](https://github.com/tugrulguner/refpot/releases). UtilityPot has no published release; its [repository](https://github.com/tugrulguner/utilitypot) remains the source for current project information.

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
