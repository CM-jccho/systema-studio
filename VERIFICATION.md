# Verification

2026-11-24, SYSTEMA Studio v1.0.3 (Pro pack on sale, store links and after-purchase guide).

## What changed in this version

- `PRO_PACK_AVAILABLE` is `true`: the Pro pack is on sale, so the modal no longer shows "판매 준비 중".
- Store links split by locale: Korean → Rapide (`latpeed.com/products/4cJga`, ₩12,900), English → Gumroad (`jaechul4.gumroad.com/l/systema-pro-work-systems-pack`, $9.99). The other storefront stays one line away in both languages.
- The Pro modal now carries "구매 후 사용법 / Using it after you buy" (two ways: JSON import into the studio, Markdown paste into Notion/Obsidian/team wiki, five steps each) and "실전 활용 Tip / Practical tips" (four items), in both languages.
- Heading of the document title no longer uses an em dash (`SYSTEMA Studio: …`).

## Checks

| Check | Result |
|---|---|
| `npm run build` (tsc --noEmit + vite build) | pass |
| `tests/e2e.py` (Playwright, production build) | 54 / 54 |
| `tests/astryx.py` (accessibility, security, responsive) | 25 / 25 |
| Hallmark `sloplint.mjs src --scope app --genre editorial` | 0 FAIL, 0 REFLEX, 0 WARN |
| Live console errors | 0 |
| Live failed requests | 0 |
| Horizontal overflow 320 to 1920 | 0 px |
| Live URL | https://cm-jccho.github.io/systema-studio/ |

## E2E coverage

Preset seeding, Korean first load, bilingual switch and persistence, blank system creation, context coverage, rule add / toggle / edit / version note / history, four-lens review record, growth pass count and level, export preview, clipboard, Markdown and JSON downloads, JSON import, malformed JSON rejection, tab keyboard navigation, BYOK missing-key guard, OpenAI request headers and prompt, Anthropic request headers and content parsing, key not persisted without consent, delete confirmation, mobile system selector, Pro modal open and close, Pro how-to (two ways, five steps each), Pro tips (four), locale store links (Rapide primary in Korean, Gumroad secondary, both `_blank` + `noreferrer`), no "coming soon" marker, responsive overflow, console errors.

## Astryx coverage

No `dangerouslySetInnerHTML`, StrictMode, error boundary, reduced-motion fallback, token-only colour (no `#000`/`#fff`, no gradients), document lang/title/description/viewport, no cookies, accessible names on every control, heading order with a single h1, AA contrast on small text, visible focus ring, native modal dialog with focus and Escape, 44px touch targets at 390, no overflow from 320 to 1920, local-only storage, no external requests at rest, no console errors.

## Notes

- The BYOK calls in tests are mocked at the browser route; no real API spend occurred.
- Fonts are self-hosted (Pretendard OFL, Instrument Serif OFL). There are no analytics, trackers or cookies.
- Prices written into the modal buttons were taken from both store pages on 2026-11-24. If a price changes on the store, the button copy and `src/i18n.ts` need the same edit.
