# Project Working Rules

This file defines the default development rules for `xianma-new-ai-design`.
Future code changes, bug fixes, and refactors should follow these rules unless a task explicitly says otherwise.

## Project references

- Architecture and extension boundaries: `ARCHITECTURE.md`
- UI tokens, component states, layout, and page status: `UI_SPEC.md`
- Runtime token definitions: `src/app/globals.css`
- Navigation and route metadata: `src/config/navigation.js`

## 1. First principles

- Start from facts: target, constraints, invariants, acceptance criteria.
- Do not guess when the repo can answer the question.
- Keep the scope to the smallest affected surface.

## 2. Change discipline

- Prefer the repo's existing patterns, structure, and helpers.
- Avoid unrelated cleanup in the same change.
- Keep page logic thin; move reusable UI or behavior into components.
- New routes must register labels, hierarchy, and delivery status in `src/config/navigation.js`.
- Use `PageShell` for subpages and `PlaceholderState` for unfinished content.
- Do not mix product refactors with bug fixes unless necessary.

## 3. Testing and verification

- Any behavior change should include a regression test when practical.
- Before declaring a fix done, rerun the affected path.
- Run `npm run lint` for all code changes.
- Run `npm run build` for routing, layout, hook, or shared UI changes.
- If tests are missing, state the gap clearly and use the next best executable verification.

## 4. Bug-fix workflow

1. Reproduce the issue.
2. Find the root cause.
3. Make the smallest safe fix.
4. Add or update tests.
5. Verify lint/build/test results.
6. Re-check the diff for accidental scope creep.

## 5. GitHub / PR workflow

- One PR should solve one coherent problem.
- Review the final diff before merging.
- Address review comments with code or evidence, not assumptions.
- If a change is partial, document what remains.

## 6. UI / frontend rules

- Use the existing design tokens and UI patterns in `UI_SPEC.md`.
- Prefer `next/image` or the local `SafeImage` wrapper over raw `<img>`.
- Keep text and layout responsive; do not let content overflow its container.
- Preserve clear loading, empty, error, and disabled states.
- For dialogs and floating panels, make the size responsive to the viewport and render them in a top-level layer or Portal so parent sidebars, scroll containers, `overflow`, and stacking contexts cannot clip them.
- Dialogs may cover left/right navigation when needed; constrain position to the viewport, and only scroll the dialog body when the viewport cannot fit the full content. Keep the header and action area visible.
- Verify responsive dialog behavior at desktop, `1280px`, `1024px`, and narrow viewports, including edge positioning, overlaying sidebars, internal scrolling, close behavior, and keyboard interaction.

## 7. Safety and product truthfulness

- Do not present prototype or placeholder behavior as shipped capability.
- Keep demo data, mock data, and real data separate.
- Demo data belongs under `src/data/demo/`; do not put personal or internal values directly in page components.
- Remove or isolate hardcoded personal, internal, or sensitive information from user-facing surfaces.

## 8. Output standard

- Report: conclusion first, then evidence, then risks, then next steps.
- State uncertainty explicitly.
- If you changed code, name the files and summarize the verification that was run.

## UI maintenance

- Follow the primitive -> semantic -> component token layers in `src/app/globals.css`.
- New JSX should use semantic/component tokens instead of new raw hex or rgba values.
- Existing prototype-only visual fixtures may retain local values until the affected component is promoted to product use; record that boundary in the change description.
