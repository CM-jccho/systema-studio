# Verification

2026-11-24, SYSTEMA Studio v1.0.1.

| Check | Result |
|---|---|
| `npm run build` (tsc --noEmit + vite build) | pass |
| `tests/e2e.py` (Playwright, production build) | 48 / 48 |
| `tests/astryx.py` (accessibility, security, responsive) | 25 / 25 |
| Hallmark `sloplint.mjs src --scope app --genre editorial` | 0 FAIL, 0 REFLEX, 0 WARN |
| Hallmark render tier on the live URL (1280, 1440, 1920, 375) | 0 FAIL, 0 REFLEX, 0 WARN |
| Live console errors | 0 |
| Live failed requests | 0 |
| Horizontal overflow 320 to 1920 | 0 px |
| Live URL | https://cm-jccho.github.io/systema-studio/ |

## E2E coverage

Preset seeding, Korean first load, bilingual switch and persistence, blank system creation, context coverage, rule add / toggle / edit / version note / history, four-lens review record, growth pass count and level, export preview, clipboard, Markdown and JSON downloads, JSON import, malformed JSON rejection, tab keyboard navigation, BYOK missing-key guard, OpenAI request headers and prompt, Anthropic request headers and content parsing, key not persisted without consent, delete confirmation, mobile system selector, Pro modal open and close, responsive overflow, console errors.

## Astryx coverage

No `dangerouslySetInnerHTML`, StrictMode, error boundary, reduced-motion fallback, token-only colour (no `#000`/`#fff`, no gradients), document lang/title/description/viewport, no cookies, accessible names on every control, heading order with a single h1, AA contrast on small text, visible focus ring, native modal dialog with focus and Escape, 44px touch targets at 390, no overflow from 320 to 1920, local-only storage, no external requests at rest, no console errors.

## Notes

- The render tier ran with a local copy of the Hallmark script whose only change is `--no-sandbox`, required by this Linux sandbox; the gates and thresholds are unchanged.
- The BYOK calls in tests are mocked at the browser route; no real API spend occurred.
- Fonts are self-hosted (Pretendard OFL, Instrument Serif OFL). There are no analytics, trackers or cookies.
