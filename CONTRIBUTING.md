# Contributing to Three.js AI Skills

First off — thank you! This project exists because of people who care about AI agents writing _correct_ Three.js, not hallucinated nonsense.

---

## Ways to Contribute

| Type                      | Example                                                      |
| ------------------------- | ------------------------------------------------------------ |
| Fix a hallucinated API    | An agent keeps using a method that doesn't exist             |
| Add a missing skill       | `threejs-particles`, `threejs-terrain`, `threejs-instancing` |
| Improve a description     | The wrong skill keeps triggering (or the right one doesn't)  |
| Add an example            | Minimal working demo in `examples/`                          |
| Fix outdated code         | Something changed in r155, r160, r165...                     |
| Add a Copilot instruction | Path-specific `.github/instructions/` files                  |

---

## Getting Started

```bash
# Fork + clone
git clone https://github.com/YOUR_FORK/threejs-skills
cd threejs-skills

# Create a feature branch
git checkout -b feat/threejs-terrain-skill
```

No build step, no dependencies — this is pure markdown + a few JS examples.

---

## Skill Authoring Rules

### Required

Every new skill folder needs:

```
threejs-skills/skills/threejs-your-domain/
└── SKILL.md   ← required, must have valid YAML frontmatter
```

**Valid `SKILL.md` frontmatter:**

```yaml
---
name: threejs-your-domain
description: One or two sentences. What does this skill do? When should an agent use it? Include trigger keywords.
---
```

**Frontmatter constraints:**

- `name`: max 64 chars, lowercase + hyphens only, no XML tags, no "anthropic" or "claude"
- `description`: max 1024 chars, no XML tags, non-empty, written in third person

### Strongly Recommended

- Keep `SKILL.md` body **under 500 lines**. Move detail to `REFERENCE.md`, `EXAMPLES.md`, etc.
- Link additional files **one level deep only** (from `SKILL.md` → `MAPS.md`, never from `MAPS.md` → `DETAIL.md`)
- Reference files should have a **table of contents** if they exceed 100 lines
- Use forward slashes in all paths
- No Windows-style paths

### Code Style in Examples

```js
// ✓ Good — modern Three.js (r160+), clear, no redundant comments
const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ roughness: 0.4 });

// ✗ Bad — legacy pattern
const geo = new THREE.BoxBufferGeometry(1, 1, 1); // removed in r160
```

- Always use `three/addons/` imports, not `three/examples/jsm/`
- Always call `controls.update()` in the render loop if `enableDamping` is true
- Always handle resize: update `camera.aspect`, `camera.updateProjectionMatrix()`, `renderer.setSize()`
- Prefer `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` over unclamped DPR

---

## Updating `llms.txt`

After adding a skill, update `skills/llms.txt`:

```
threejs-your-domain | Brief one-line description | trigger keywords comma separated
```

---

## Pull Request Process

1. **Branch name**: `feat/skill-name`, `fix/skill-name`, `docs/readme-update`
2. **One skill per PR** (unless tightly related)
3. **Test it**: Load the skill in a fresh Claude Code or Cursor session. Run a representative task. Confirm the output is correct.
4. **PR description**: What skill / change? Why? What did you test?

### PR Checklist

- [ ] `SKILL.md` has valid YAML frontmatter
- [ ] `name` is unique in the repo
- [ ] Description is in third person and includes trigger keywords
- [ ] Body is under 500 lines
- [ ] No deeply nested references
- [ ] All linked files exist
- [ ] `llms.txt` updated
- [ ] Example tested with at least one AI agent
- [ ] No hallucinated Three.js APIs
- [ ] No Windows-style paths

---

## What We Won't Merge

- Skills that teach incorrect Three.js patterns
- Skills that reference removed APIs without noting removal version
- Skills that hallucinate method names or class names
- Overly verbose skills that bloat the context window
- Skills for non-Three.js topics

---

## Reporting Issues

Use GitHub Issues with one of these labels:

- `hallucination` — the skill teaches a wrong/nonexistent API
- `outdated` — code uses a deprecated or removed pattern
- `missing-skill` — a Three.js domain isn't covered
- `trigger-mismatch` — wrong skill fires, or correct skill doesn't fire
- `docs` — readme / contributing / agents.md issue

---

## Code of Conduct

Be respectful. The only bad contribution is a hallucinated API presented as fact. Everything else is fixable.

---

## License

By contributing, you agree your contributions will be licensed under MIT.
