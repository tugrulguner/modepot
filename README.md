# ModePot

The public home of ModePot: an open-source family and community simplifying, modernizing, and performance-optimizing frameworks while building fast, simple tools, engines, and games. AI-native and agent-friendly where they add real value, without defining every project.

## Projects

- **Dexpot** — Build synchronous Python HTTP APIs with adaptive execution for GIL and free-threaded CPython. Unlike async-first frameworks, it keeps application handlers synchronous while compiling routes once. [Project site](https://dexpot.modepot.io/) · [GitHub](https://github.com/tugrulguner/dexpot)
- **Intpot** — Turn typed Python tools into a CLI, HTTP API, or MCP server, and convert between existing interfaces. One definition can serve each surface. [Project site](https://intpot.modepot.io/) · [GitHub](https://github.com/tugrulguner/intpot)
- **Summonpot** — Declare typed endpoints that combine deterministic operations with explicitly bounded agent-owned decisions. Keep decision authority visible within the contract. [Project site](https://summonpot.modepot.io/) · [GitHub](https://github.com/tugrulguner/summonpot)
- **LifePot** — Create and replay deterministic artificial-life worlds where agent proposals become validated simulation rules. [Project site](https://lifepot.modepot.io/) · [GitHub](https://github.com/tugrulguner/lifepot)

These are the beginning, not the boundary. ModePot is open to new projects and community contributions. [Visit ModePot](https://modepot.io/) · [Join the community on Discord](https://discord.gg/u3AANZr6RG)

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
npm run build
```

## Deployment

The static Astro build is deployed to Cloudflare Workers Static Assets.

```bash
npm run deploy
```

Production domain: `modepot.io`
