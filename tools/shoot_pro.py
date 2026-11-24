#!/usr/bin/env python3
"""Capture the Pro pack modal on the local production build."""
import os
import sys

from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs:" + os.environ.get("LD_LIBRARY_PATH", "")
)

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4180/"
PREFIX = sys.argv[2] if len(sys.argv) > 2 else "local"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "screenshots")
os.makedirs(OUT, exist_ok=True)

errors = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.goto(BASE, wait_until="networkidle")

    for locale, tag in (("ko", "ko"), ("en", "en")):
        if locale == "en":
            page.get_by_role("button", name="EN").click()
            page.wait_for_timeout(300)
        page.click(".pro-link")
        page.wait_for_timeout(500)
        dialog = page.locator("dialog.modal")
        dialog.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-{tag}-dialog.png"))
        page.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-{tag}-viewport.png"))
        # scroll inside the dialog to capture the lower half
        page.evaluate("document.querySelector('.modal-inner').scrollTop = document.querySelector('.modal-inner').scrollHeight")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-{tag}-bottom.png"))
        links = page.eval_on_selector_all(
            ".pro-cta a",
            "els => els.map(a => ({text: a.textContent.trim(), href: a.href, target: a.target, rel: a.rel}))",
        )
        print(locale, links)
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

    page.get_by_role("button", name="한국어").click()
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    page.click(".pro-link")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-mobile-top.png"))
    page.evaluate("document.querySelector('.modal-inner').scrollTop = 900")
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-mobile-mid.png"))
    page.evaluate("document.querySelector('.modal-inner').scrollTop = document.querySelector('.modal-inner').scrollHeight")
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(OUT, f"{PREFIX}-pro-mobile-bottom.png"))
    overflow = page.evaluate(
        "() => { const d = document.querySelector('.modal-inner'); return {doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d.scrollWidth - d.clientWidth, height: d.scrollHeight}; }"
    )
    print("overflow", overflow)
    browser.close()

print("errors", errors)
