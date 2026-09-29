# ModePot identity system

ModePot uses one shared vessel geometry and a distinct interior symbol for each project. The shared silhouette makes the family recognizable; the interior symbol communicates the boundary each project owns.

## Marks

| Project | Mark | Meaning | Accent |
| --- | --- | --- | --- |
| ModePot | [`public/modepot-mark.svg`](public/modepot-mark.svg) | A geometric vessel carrying the ModePot M monogram | `#F2B84B` |
| Dexpot | [`public/marks/dexpot-mark.svg`](public/marks/dexpot-mark.svg) | Parallel execution lanes | `#66D9FF` |
| Intpot | [`public/marks/intpot-mark.svg`](public/marks/intpot-mark.svg) | One typed source branching into three interfaces | `#F2B84B` |
| Summonpot | [`public/marks/summonpot-mark.svg`](public/marks/summonpot-mark.svg) | An agent-owned decision inside an explicit boundary | `#A987FF` |
| LifePot | [`public/marks/lifepot-mark.svg`](public/marks/lifepot-mark.svg) | A growing cellular system | `#77E5BD` |

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
