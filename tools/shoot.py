#!/usr/bin/env python3
"""Render SYSTEMA Studio at desktop and mobile sizes and collect console errors."""
import functools
import http.server
import json
import os
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
OUT = os.path.join(ROOT, "screenshots")
PORT = int(os.environ.get("PORT", str(4300 + os.getpid() % 500)))
BASE = f"http://127.0.0.1:{PORT}/"
DIST = os.path.join(ROOT, "dist")


def wait_server():
    for _ in range(60):
        try:
            with urllib.request.urlopen(BASE, timeout=1) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def main():
    os.makedirs(OUT, exist_ok=True)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = None
    for candidate in range(PORT, PORT + 12):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", candidate), handler)
            break
        except OSError:
            continue
    if httpd is None:
        print("no free port")
        return 1
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        if not wait_server():
            print("server did not start")
            return 1
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            errors = []
            page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
            page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type in ("error", "warning") else None)
            page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(OUT, "desktop-context.png"), full_page=False)
            page.screenshot(path=os.path.join(OUT, "desktop-context-full.png"), full_page=True)

            for name in ["rulebook", "patterns", "redteam", "evaluator", "export", "growth"]:
                page.click(f"#tab-{name}")
                page.wait_for_timeout(300)
                page.screenshot(path=os.path.join(OUT, f"desktop-{name}.png"))
                page.screenshot(path=os.path.join(OUT, f"desktop-{name}-full.png"), full_page=True)

            page.click("#tab-rulebook")
            page.wait_for_timeout(200)
            page.get_by_role("button", name="규칙 추가").click()
            page.wait_for_timeout(200)
            page.screenshot(path=os.path.join(OUT, "desktop-rulebook-add.png"))

            page.click(".pro-link")
            page.wait_for_timeout(400)
            page.screenshot(path=os.path.join(OUT, "desktop-pro-modal.png"))
            page.click(".modal .icon-btn")

            page.get_by_role("button", name="EN").click()
            page.set_viewport_size({"width": 1280, "height": 800})
            page.click("#tab-context")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, "desktop-en-1280.png"))
            page.click("#tab-rulebook")
            page.wait_for_timeout(200)
            page.screenshot(path=os.path.join(OUT, "desktop-en-rulebook.png"))
            page.get_by_role("button", name="한국어").click()
            page.wait_for_timeout(200)

            page.get_by_role("button", name="새 시스템").click()
            page.wait_for_timeout(250)
            page.screenshot(path=os.path.join(OUT, "desktop-new-system.png"))
            page.locator(".system-item").first.click()
            page.wait_for_timeout(200)

            page.set_viewport_size({"width": 390, "height": 844})
            page.click("#tab-context")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, "mobile-context.png"), full_page=False)
            page.screenshot(path=os.path.join(OUT, "mobile-context-full.png"), full_page=True)
            page.click("#tab-redteam")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, "mobile-redteam.png"))
            page.screenshot(path=os.path.join(OUT, "mobile-redteam-full.png"), full_page=True)
            page.click("#tab-patterns")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, "mobile-patterns.png"))
            page.screenshot(path=os.path.join(OUT, "mobile-patterns-full.png"), full_page=True)
            page.click("#tab-evaluator")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, "mobile-evaluator.png"))
            page.screenshot(path=os.path.join(OUT, "mobile-evaluator-full.png"), full_page=True)

            overflow = page.evaluate("({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
            browser.close()
            print(json.dumps({"console": [e for e in errors if not e.startswith("warning:")], "overflow": overflow}, ensure_ascii=False, indent=2))
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    sys.exit(main())
