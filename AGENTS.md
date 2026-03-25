# AGENTS.md — Guidance for AI Agents Editing This Repo

This file is for AI coding agents (Claude, Copilot, Cursor, Codex, etc.) that have write access to this repository.

## Purpose of This Repo

This repo contains **AI Skills for Three.js** — structured markdown files that teach AI agents how to use Three.js correctly. The goal is concise, accurate, non-hallucinated Three.js knowledge.

## When Editing Skills

- **Do not hallucinate APIs.** If you are unsure whether a method exists in Three.js, say so or omit it. Do not invent method names, parameter names, or class names.
- **Pin to Three.js r160+ unless explicitly noted.** The Three.js API changes frequently. Always note the version if you reference something that changed.
- **Keep SKILL.md under 500 lines.** Move detailed reference to separate `.md` files in the same folder and link to them.
- **Use forward slashes** in all file paths (`scripts/helper.py`, not `scripts\helper.py`).
- **Prefer one recommended approach** over listing 5 equivalent options. Include an escape hatch if a secondary approach is commonly needed.
- **Do not add time-sensitive information** like "as of March 2024" — this will become stale.

## Naming Conventions

- Skill folders: `threejs-{domain}` (lowercase, hyphens only)
- Reference files: `UPPERCASE.md` (e.g., `SHADOWS.md`, `GLSL.md`)
- Example files: `kebab-case.js` or `kebab-case.jsx`
- Scripts: `snake_case.py` or `camelCase.js`

## Structure Rules

- Every skill folder must contain exactly one `SKILL.md`
- `SKILL.md` must have valid YAML frontmatter with `name` and `description`
- All reference files linked from `SKILL.md` must exist in the same folder
- No nested references (don't link from `SHADOWS.md` → `CASCADES.md` — link everything from `SKILL.md`)

## What Not to Do

- Do not add marketing language or fluff to skills
- Do not over-explain what Three.js is — Claude already knows
- Do not add redundant comments in code examples (`// This creates a box` above `new THREE.BoxGeometry()`)
- Do not copy-paste full Three.js source code into skills — reference and explain patterns instead

## Testing

Before committing skill changes, test with:

1. A fresh Claude Code session with the skill loaded
2. Ask a representative task (see `examples/` for reference)
3. Verify Claude's output is correct, uses modern APIs, and doesn't hallucinate

## Contact

Open an issue or PR if you spot a hallucinated API, outdated pattern, or missing skill domain.
