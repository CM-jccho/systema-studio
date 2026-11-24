#!/usr/bin/env python3
"""Verify and capture the live GitHub Pages deployment."""
import json
import os

from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs/lib/x86_64-linux-gnu:"
    "/workspace/.local/chromelibs:" + os.environ.get("LD_LIBRARY_PATH", "")
)

BASE = "https://cm-jccho.github.io/systema-studio/"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "screenshots")
os.makedirs(OUT, exist_ok=True)

errors = []
failed = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("requestfailed", lambda r: failed.append(r.url))
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(OUT, "live-desktop-context.png"))
    page.screenshot(path=os.path.join(OUT, "live-desktop-context-full.png"), full_page=True)
    page.click("#tab-rulebook")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, "live-desktop-rulebook.png"))
    page.click("#tab-growth")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, "live-desktop-growth.png"))
    page.click(".pro-link")
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(OUT, "live-desktop-pro.png"))
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)

    page.get_by_role("button", name="EN").click()
    page.set_viewport_size({"width": 1280, "height": 800})
    page.click("#tab-context")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, "live-en-1280.png"))
    page.get_by_role("button", name="한국어").click()

    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, "live-mobile-context.png"))
    page.screenshot(path=os.path.join(OUT, "live-mobile-context-full.png"), full_page=True)
    page.click("#tab-redteam")
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, "live-mobile-redteam.png"))

    info = page.evaluate(
        """() => ({
          title: document.title,
          lang: document.documentElement.lang,
          systems: JSON.parse(localStorage.getItem('systema.studio.v1') || 'null')?.systems?.length,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
        })"""
    )
    browser.close()

print(json.dumps({"info": info, "errors": errors, "failed_requests": failed}, ensure_ascii=False, indent=2))
