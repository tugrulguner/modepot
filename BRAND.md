# ModePot identity system

ModePot uses one shared vessel geometry and a distinct interior symbol for each project. The umbrella identity owns coordinated cyan, violet, and mint; sibling project accents remain independent. The shared silhouette makes the family recognizable; the interior symbol communicates the boundary each project owns.

## Marks

| Project | Mark | Meaning | Accent |
| --- | --- | --- | --- |
| ModePot | [`public/modepot-mark.svg`](public/modepot-mark.svg) | A geometric vessel carrying the ModePot M monogram | Coordinated cyan–violet–mint spectrum |
| Dexpot | [`public/marks/dexpot-mark.svg`](public/marks/dexpot-mark.svg) | Parallel execution lanes | `#66D9FF` |
| Intpot | [`public/marks/intpot-mark.svg`](public/marks/intpot-mark.svg) | One typed source branching into three interfaces | `#F2B84B` |
| Summonpot | [`public/marks/summonpot-mark.svg`](public/marks/summonpot-mark.svg) | An agent-owned decision inside an explicit boundary | `#A987FF` |
| LifePot | [`public/marks/lifepot-mark.svg`](public/marks/lifepot-mark.svg) | A growing cellular system | `#77E5BD` |
| RefPot | [`public/marks/refpot-mark.svg`](public/marks/refpot-mark.svg) | A layered store of records inside an explicit boundary | Off-white / graphite, `#F4F2EA` |
| UtilityPot | [`public/marks/utilitypot-mark-v1.svg`](public/marks/utilitypot-mark-v1.svg) | A bounded, inspectable utility workflow | Rose, `#F28CBE` |
| SkillPot | [`public/marks/skillpot-mark.svg`](public/marks/skillpot-mark.svg) | A checked artifact inside the shared vessel | Coral, `#FF9A76` |

## ModePot wordmark and lockups

The website wordmark is the reference for the README and social lockups, not a sibling product's single-accent suffix:

- Lowercase `modepot`, Manrope weight 720, tracking `-0.085em` in the large wordmark.
- Off-white `mode` (`#F4F0E7`); `pot` carries the same 105-degree cyan–violet–mint gradient as `src/styles/multicolour-identity.css`: `#66D9FF` at 0%, `#A987FF` at 52%, and `#77E5BD` at 100%. Do not replace it with a flat mint suffix.
- Keep the vessel outline cyan and the M monogram violet. The compact mark's geometry does not change between surfaces.
- Preserve the README's 1200 × 900 canvas displayed at 600 px and the social card's 1200 × 630 canvas. Their compositions serve different formats; their wordmark treatment must agree.
- Describe AI and agent support with the website's qualification: **AI-native and agent-friendly where they add real value**. It does not define every project.

The editable sources are `public/products/modepot-lockup.svg` and `public/modepot-og.svg`. Run `npm run render:identity` to regenerate both the README PNG and social WebP with the declared local fonts. It records exact SHA-256 hashes for sources, fonts, renderer and derivatives in `src/data/identity-renders.json`. Run `npm run check:identity` to verify those hashes without changing files, and `npm run test:identity` for actual decoded suffix-region colour, geometry and positioning regressions. This avoids comparing native text rasterization across operating systems while still rejecting changed inputs or stale outputs. Commit edited sources, generated derivatives and the manifest together.

## Usage

- Use these SVGs as compact marks in navigation, favicons, package surfaces, and project-directory cards.
- Keep each project's detailed 600 px artwork as hero art. Hero art explains the project; it is not the compact logo.
- Pair a mark with the project name when space permits. Do not place descriptive words inside the mark.
- Preserve the `128 × 128` view box and at least one-quarter of the mark's width as clear space.
- Use the compact marks at 24 px or larger. At 16 px, use the vessel silhouette without the interior symbol if the rendering surface blurs it.
- The geometry must remain usable in one color. Product accents distinguish the family members but are not required for recognition.
- Do not add glow, gradients, thin decorative lines, project counts, or provider logos to compact marks.

## Source of truth

This repository owns the family mark geometry. Product repositories may carry an exact copy of their compact mark so their favicon, documentation, and package presentation remain versioned with the product. When the shared geometry changes, update the family source first and then propagate the exact asset to each product repository.
