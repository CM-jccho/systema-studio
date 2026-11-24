#!/usr/bin/env python3
"""Astryx-style (React 19 design conventions) review for SYSTEMA Studio.

Checks what can be measured in the DOM and the source: token-only colour,
AA contrast, touch targets, accessible names, heading order, native dialog
focus, reduced motion, document head, local-only storage and console errors.
"""
import functools
import http.server
import os
import re
import socketserver
import sys
import threading
import time
import urllib.request

from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs:" + os.environ.get("LD_LIBRARY_PATH", "")
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
PORT = int(os.environ.get("PORT", str(5200 + os.getpid() % 300)))
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS  " if ok else "FAIL  ") + name + (f" | {detail}" if detail else ""))


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = None
    for candidate in range(PORT, PORT + 12):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", candidate), handler)
            break
        except OSError:
            continue
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{candidate}/", timeout=1):
                return httpd, f"http://127.0.0.1:{candidate}/"
        except Exception:
            time.sleep(0.25)
    raise RuntimeError("server not ready")


CONTRAST_JS = """
() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const parse = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    let node = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      node = node.parentElement;
    }
    return 'rgb(255, 255, 255)';
  };
  const selectors = ['.field-hint', '.system-meta', '.muted-line', '.tab', '.rule-meta', '.meta-btn',
    '.preview', '.aside-note', '.figure-label', '.ladder-detail', '.timeline-note', '.verdict-conditional',
    '.verdict-pass', '.byok-warning', '.field-count', '.rail-note', '.workhead-meta', '.pack-body p'];
  const out = [];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    const bg = parse(bgOf(el));
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    out.push({ sel, ratio: Math.round(ratio * 100) / 100, size: parseFloat(cs.fontSize), color: cs.color });
  }
  return out;
}
"""


def main():
    httpd, base = serve()
    errors = []
    external = set()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            context = browser.new_context(viewport={"width": 1440, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
            page = context.new_page()
            page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
            page.on("request", lambda req: external.add(req.url.split("/")[2]) if req.url.split("/")[2].split(":")[0] not in ("127.0.0.1", "localhost") else None)
            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(400)

            # source checks
            sources = []
            for dirpath, _, names in os.walk(os.path.join(ROOT, "src")):
                for name in names:
                    if name.endswith((".ts", ".tsx")):
                        sources.append(open(os.path.join(dirpath, name), encoding="utf-8").read())
            joined = "\n".join(sources)
            check("no dangerouslySetInnerHTML", "dangerouslySetInnerHTML" not in joined)
            check("React StrictMode enabled", "StrictMode" in joined)
            check("error boundary present", "componentDidCatch" in joined)
            check("reduced motion fallback", "prefers-reduced-motion" in open(os.path.join(ROOT, "src/styles/tokens.css"), encoding="utf-8").read())
            css = open(os.path.join(ROOT, "src/styles/tokens.css"), encoding="utf-8").read()
            app_css = open(os.path.join(ROOT, "src/styles/app.css"), encoding="utf-8").read()
            check("no pure black or white token", "#000" not in css and "#fff" not in css)
            check("no gradient in app css", "gradient(" not in app_css)

            # document head
            head = page.evaluate("({lang: document.documentElement.lang, title: document.title, desc: document.querySelector('meta[name=description]')?.content||'', viewport: document.querySelector('meta[name=viewport]')?.content||'', csp: !!document.querySelector('meta[http-equiv=Content-Security-Policy]')})")
            check("html lang is set", head["lang"] == "ko", head["lang"])
            check("title and description", len(head["title"]) > 10 and len(head["desc"]) > 40)
            check("viewport meta", "width=device-width" in head["viewport"])
            check("no cookie storage", page.evaluate("document.cookie") == "", page.evaluate("document.cookie"))

            # accessible names
            unnamed = page.evaluate("""() => {
              const els = [...document.querySelectorAll('button, input, select, textarea, a[href]')];
              return els.filter(el => {
                const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
                const labelled = el.id && document.querySelector(`label[for="${el.id}"]`);
                const wrapped = el.closest('label');
                const title = el.getAttribute('title');
                return !name && !labelled && !wrapped && !title;
              }).map(el => el.tagName + '.' + el.className).slice(0, 6);
            }""")
            check("all controls have accessible names", not unnamed, str(unnamed))

            # heading order
            headings = page.evaluate("""() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]))""")
            ok_order = True
            prev = 0
            for level in headings:
                if prev and level > prev + 1:
                    ok_order = False
                    break
                prev = level
            check("no skipped heading levels", ok_order, str(headings))
            check("one h1 on the screen", headings.count(1) == 1, str(headings.count(1)))

            # contrast
            contrast = page.evaluate(CONTRAST_JS)
            weak = [c for c in contrast if c["ratio"] < (3.0 if c["size"] >= 24 else 4.5)]
            check("AA contrast on small text", not weak, str(weak[:4]))
            check("contrast samples collected", len(contrast) >= 8, str(len(contrast)))

            # keyboard focus
            page.keyboard.press("Tab")
            page.keyboard.press("Tab")
            focus = page.evaluate("""() => {
              const el = document.activeElement;
              const cs = getComputedStyle(el);
              return {tag: el.tagName, name: (el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,20), outline: cs.outlineStyle, width: cs.outlineWidth};
            }""")
            check("focus ring appears on tab", focus["outline"] != "none" and focus["width"] not in ("0px", "0"), str(focus))

            # dialog behaviour
            page.click(".pro-link")
            page.wait_for_timeout(300)
            dialog = page.evaluate("""() => {
              const d = document.querySelector('dialog');
              return {open: d.open, label: d.getAttribute('aria-labelledby'), inside: d.contains(document.activeElement), modal: d.matches(':modal')};
            }""")
            check("dialog is modal with a label", dialog["open"] and dialog["modal"] and bool(dialog["label"]), str(dialog))
            check("focus moves into dialog", dialog["inside"], str(dialog["inside"]))
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            check("escape closes dialog", page.locator("dialog").count() == 0)

            # touch targets at 390
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(300)
            small = page.evaluate("""() => {
              const els = [...document.querySelectorAll('button, a[href], input, select, textarea')];
              return els.filter(el => {
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return false;
                if (getComputedStyle(el).position === 'absolute') return false;
                if (el.tagName === 'INPUT' && ['radio', 'checkbox'].includes(el.type)) return false;
                return r.height < 44;
              }).map(el => el.tagName + '.' + (el.className||'').toString().split(' ')[0] + ':' + Math.round(el.getBoundingClientRect().height)).slice(0, 8);
            }""")
            check("touch targets at least 44px", not small, str(small))

            # overflow at widths
            overflows = {}
            for width in [320, 375, 768, 1024, 1440, 1920]:
                page.set_viewport_size({"width": width, "height": 900})
                page.wait_for_timeout(200)
                overflows[width] = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check("no horizontal overflow 320 to 1920", all(v <= 0 for v in overflows.values()), str(overflows))

            # language switch updates lang attribute
            page.set_viewport_size({"width": 1440, "height": 900})
            page.get_by_role("button", name="EN").click()
            page.wait_for_timeout(200)
            check("lang attribute follows locale", page.evaluate("document.documentElement.lang") == "en")
            page.get_by_role("button", name="한국어").click()
            page.wait_for_timeout(200)

            # persistence is local only
            keys = page.evaluate("Object.keys(localStorage)")
            check("store and keys are local only", all(k.startswith("systema.studio") for k in keys), str(keys))
            check("no external requests at rest", not external, str(sorted(external)))
            check("no console errors", not [e for e in errors if not e.startswith("warning")], "; ".join(errors[:3]))

            browser.close()
    finally:
        httpd.shutdown()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
