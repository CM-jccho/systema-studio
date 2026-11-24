# Verification

2026-11-25, SYSTEMA Studio v1.1.0 (SKILL.md export, pattern extractor, evaluator test log).

## What changed in this version

- **SKILL.md export.** The Export tab now carries a second block that turns the system into an official Agent Skills file: YAML frontmatter (`name`, `description`), Context, Rules, Red-team verification with the four-lens checks, and an Evaluator rubric table with the scoring rule. Preview, clipboard copy, and one-click `SKILL.md` download. The skill name is an ASCII slug derived from the English name, because skill names cannot carry Hangul.
- **Pattern extractor (level 2).** A new `패턴` tab holds the two cases (what worked, what did not) and an optional difference you already know, all saved per system in local storage. It builds a comparison prompt that asks for a `DIFFERENCES` block then a `RULES` block, with a check in parentheses for each rule. The answer is pasted back, parsed line by line under `RULES`, stripped of bullets and check notes, guessed into a category, deduplicated against existing rules, and added to the Rulebook in one click. The cases and the pasted answer survive a reload.
- **Evaluator and test log (level 3).** A new `평가` tab builds a rubric from the active rules plus the four-lens checklist (base checks and the preset's own checks). Each item is marked pass or fail, the score is `passed ÷ total × 100` with a verdict (90 pass, 70 conditional, below 70 rework), and a revision memo is recorded with the trial. Trials are kept per system in local storage (newest 50), shown as a bar chart and a list with the delta against the previous trial and a two-step delete. Marks stay after a save so the score does not collapse; when a reload clears the marks, the figures show the last recorded trial instead of an empty 0%.
- Both new tabs and the skill block are bilingual (KO/EN); the tabs sit between Rulebook and Redteam (Patterns) and Redteam and Export (Evaluator), with arrow-key tab navigation extended to seven tabs.
- Stored data stays compatible: `patterns` and `evaluations` are optional fields normalized on load, and JSON import fills them when a file predates this version. Duplicating a system clears its trials, like its reviews.

## Checks

| Check | Result |
|---|---|
| `npm run build` (tsc --noEmit + vite build) | pass |
| `tests/e2e.py` (Playwright, production build) | 89 / 89 |
| `tests/astryx.py` (accessibility, security, heading order, contrast, touch) | 32 / 32 |
| Hallmark `sloplint.mjs src --scope app --genre editorial` | 0 FAIL, 0 REFLEX, 0 WARN |
| Live feature checks (Playwright, https://cm-jccho.github.io/systema-studio/) | 19 / 19 |
| Live console errors | 0 |
| Live failed requests | 0 |
| Horizontal overflow 320 to 1920 | 0 px |
| Live URL | https://cm-jccho.github.io/systema-studio/ |

## E2E coverage

Preset seeding, Korean first load, bilingual switch and persistence, blank system creation, context coverage, tab keyboard navigation, rule add / toggle / edit / version note / history, **pattern prompt carrying both cases and the RULES block, prompt copy, candidate parsing with check-note stripping, adding two rules and their duplicate flags, rulebook reflecting them**, four-lens review record, **evaluator rubric count, unmarked start, pass/fail marking, score percentage, fail-row flag, memo saved with the trial, local-storage payload, bar chart, mark-all, second trial and delta**, growth pass count and level, export preview, clipboard, Markdown and JSON downloads, **SKILL.md frontmatter, slug validity, four sections, rubric table, clipboard and `SKILL.md` download**, last-trial line after reload, JSON import, malformed JSON rejection, BYOK missing-key guard, OpenAI and Anthropic request shapes, key not persisted without consent, delete confirmation, mobile system selector, Pro modal and its how-to, responsive overflow, console errors.

## Astryx coverage

No `dangerouslySetInnerHTML`, StrictMode, error boundary, reduced-motion fallback, token-only colour (no `#000`/`#fff`, no gradients), document lang/title/description/viewport, no cookies, accessible names on every control on the workspace, Patterns and Evaluator tabs, heading order with a single h1 on each, AA contrast on small text in the Evaluator, visible focus ring, native modal dialog with focus and Escape, 44px touch targets at 390 including rubric marks, no overflow from 320 to 1920, local-only storage, no external requests at rest, no console errors.

## Notes

- The Hallmark review ran `sloplint` over `src` with the editorial app scope: 0/0/0. The `--render` tier could not run because no `puppeteer-core` is installed in this environment; the rendered-DOM checks it would cover are covered by `tests/astryx.py` instead.
- The BYOK calls in tests are mocked at the browser route; no real API spend occurred.
- Fonts are self-hosted (Pretendard OFL, Instrument Serif OFL). There are no analytics, trackers or cookies.
- Prices in the Pro modal were taken from both store pages on 2026-11-24 and are unchanged here.
- Live checks built the comparison prompt, added two rules, scored 41 rubric items, recorded and reloaded a trial, copied and downloaded `SKILL.md`, and ran at 390 px without overflow. Screenshots: `screenshots/live-final-patterns-1440.png`, `live-final-evaluator-1440.png`, `live-final-skill-1440.png`, `live-final-patterns-390.png`, `live-final-evaluator-390.png`, `live-final-skill-390.png`, with English versions at `live-final-*-en-1440.png`.
- The deployed build is `index-CsxpGbuF.js` and `index-CZLKT9yj.css`; `main` and `gh-pages` both carry this version.
