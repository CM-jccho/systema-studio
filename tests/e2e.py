#!/usr/bin/env python3
"""End-to-end checks for SYSTEMA Studio against the production build."""
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
DIST = os.path.join(ROOT, "dist")
PORT = int(os.environ.get("PORT", str(4800 + os.getpid() % 300)))
BASE = f"http://127.0.0.1:{PORT}/"
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
    if httpd is None:
        raise RuntimeError("no port")
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{candidate}/", timeout=1):
                return httpd, f"http://127.0.0.1:{candidate}/"
        except Exception:
            time.sleep(0.25)
    raise RuntimeError("server not ready")


def main():
    httpd, base = serve()
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                accept_downloads=True,
                permissions=["clipboard-read", "clipboard-write"],
            )
            page = context.new_page()
            page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(400)

            # 1. seed
            seeded = page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')||'{}')")
            check("seeds three preset systems", len(seeded.get("systems", [])) == 3)
            check("opens in Korean", page.locator("#tab-context").inner_text() == "컨텍스트")
            check("hero name rendered", page.locator(".title-input").input_value() == "B2B 제휴 사업개발")
            check("preview shows work system tag", "<work_system" in page.locator(".aside .preview").inner_text())

            # 2. create blank system
            page.get_by_role("button", name="새 시스템").click()
            page.fill("#new-name", "테스트 업무 시스템")
            page.get_by_role("button", name="시스템 만들기").click()
            page.wait_for_timeout(200)
            check("blank system created", page.locator(".title-input").input_value() == "테스트 업무 시스템")
            check("system count is four", page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')).systems.length") == 4)

            # 3. context coverage
            page.fill("#ctx-goal", "첫 회의에서 다음 단계를 합의한다.")
            page.fill("#ctx-background", "지난 시도는 자료 없이 시작해 실패했다.")
            page.wait_for_timeout(150)
            check("coverage counts filled fields", page.locator(".coverage-value").inner_text().strip() == "2 / 4")

            # 3b. tab keyboard navigation
            page.focus("#tab-context")
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(150)
            check("arrow keys move tabs", page.locator("#tab-rulebook").get_attribute("aria-selected") == "true")
            page.click("#tab-context")
            page.wait_for_timeout(100)

            # 4. rulebook
            page.click("#tab-rulebook")
            check("empty state before rules", page.locator(".empty-title").count() == 1)
            page.get_by_role("button", name="규칙 추가").first.click()
            page.fill("#new-rule", "회의 전에 상대의 최근 공지를 한 번 읽는다.")
            page.get_by_role("button", name="규칙 저장").click()
            page.wait_for_timeout(150)
            check("rule added", page.locator(".rule").count() == 1)
            page.locator(".rule .toggle").click()
            check("toggle switches off", page.locator(".rule .toggle").get_attribute("aria-checked") == "false")
            page.locator(".rule .toggle").click()
            page.get_by_role("button", name="편집").click()
            page.fill(".rule-edit textarea", "회의 전에 상대의 최근 공지와 실적을 한 번 읽는다.")
            page.fill(".rule-edit input.input", "공지와 실적까지 확인하도록 넓힘")
            page.get_by_role("button", name="수정 저장").click()
            page.wait_for_timeout(150)
            check("version bumped", "버전 2" in page.locator(".rule-meta").inner_text())
            page.get_by_role("button", name="버전 기록").click()
            check("version note stored", "공지와 실적" in page.locator(".version-list").inner_text())

            # 5. redteam record
            page.click("#tab-redteam")
            boxes = page.locator(".lens input[type=checkbox]")
            boxes.nth(0).check()
            boxes.nth(1).check()
            page.select_option(".record-box select", "pass")
            page.fill("#review-notes", "가격 근거만 다시 확인하면 된다.")
            page.get_by_role("button", name="검증 기록 남기기").click()
            page.wait_for_timeout(200)
            check("review recorded", page.locator(".history-list li").count() == 1)
            check("review notes shown", "가격 근거" in page.locator(".history").inner_text())
            check("checked counter reset", page.locator(".review-progress").inner_text().startswith("0 /"))

            # 6. growth reflects the pass
            page.click("#tab-growth")
            values = page.locator(".figure-value").all_inner_texts()
            check("pass count on growth", values[1].strip() == "1", str(values))
            check("level two reached", "2" in values[0])

            # 7. export copy + download
            page.click("#tab-export")
            preview = page.locator(".preview-block .preview").inner_text()
            check("export uses active name", "테스트 업무 시스템" in preview)
            check("export includes rules", "최근 공지와 실적" in preview)
            page.locator(".export-actions").get_by_role("button", name="패키지 복사").click()
            page.wait_for_timeout(300)
            clip = page.evaluate("navigator.clipboard.readText()")
            check("clipboard holds package", clip.startswith("<role>") and "테스트 업무 시스템" in clip)
            with page.expect_download() as dl:
                page.locator(".export-actions").get_by_role("button", name="Markdown 다운로드").click()
            download = dl.value
            path = download.path()
            text = open(path, encoding="utf-8").read()
            check("markdown download content", "테스트 업무 시스템" in text and download.suggested_filename.endswith(".md"))
            with page.expect_download() as dl2:
                page.locator(".export-actions").get_by_role("button", name="JSON 다운로드").click()
            json_path = dl2.value.path()
            payload = json.load(open(json_path, encoding="utf-8"))
            check("json download schema", payload.get("schema") == 1 and payload["system"]["name"]["ko"] == "테스트 업무 시스템")

            # 8. import the exported json
            page.set_input_files(".file-input", json_path)
            page.wait_for_timeout(300)
            check("import adds a system", page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')).systems.length") == 5)
            check("imported system is active", page.locator(".title-input").input_value() == "테스트 업무 시스템")

            # 8b. malformed import is rejected
            page.click("#tab-export")
            page.wait_for_timeout(200)
            bad = os.path.join(ROOT, ".tmp-bad.json")
            open(bad, "w", encoding="utf-8").write('{"hello": 1}')
            page.set_input_files(".file-input", bad)
            page.wait_for_timeout(400)
            check("malformed json rejected", "읽을 수 없습니다" in page.locator(".toast").inner_text())
            os.remove(bad)

            # 9. language switch
            page.get_by_role("button", name="EN").click()
            page.wait_for_timeout(200)
            check("english tab labels", page.locator("#tab-context").inner_text() == "Context")
            page.click("#tab-context")
            page.wait_for_timeout(150)
            check("english section heading", page.locator(".section-intro h2").first.inner_text() == "Context box")
            page.get_by_role("button", name="한국어").click()
            page.wait_for_timeout(150)
            check("back to Korean", page.locator("#tab-context").inner_text() == "컨텍스트")

            # 10. persistence across reload
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(300)
            check("system count persists", page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')).systems.length") == 5)
            check("active system persists", page.locator(".title-input").input_value() == "테스트 업무 시스템")

            # 11. BYOK guard rails
            page.click("#tab-redteam")
            page.get_by_role("button", name="내 API 키로 실행").click()
            page.get_by_role("button", name="AI로 검증 실행").click()
            page.wait_for_timeout(150)
            check("missing key is reported", "API 키를" in page.locator(".byok .error-line").inner_text())

            # 11b. BYOK request is well formed and the key is not persisted without consent
            captured = {}

            def handle_route(route):
                captured["auth"] = route.request.headers.get("authorization", "")
                captured["body"] = json.loads(route.request.post_data or "{}")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"choices": [{"message": {"content": "[고객] 남은 반론: 가격 근거가 약하다."}}]}),
                )

            page.route("https://api.openai.com/v1/chat/completions", handle_route)
            page.fill(".byok input[type=password]", "sk-test-only")
            page.get_by_role("button", name="AI로 검증 실행").click()
            page.wait_for_timeout(700)
            check("byok output rendered", "남은 반론" in page.locator(".byok-output").inner_text())
            check("byok sends bearer key", captured.get("auth") == "Bearer sk-test-only")
            check("byok sends a four-lens prompt", "고객" in json.dumps(captured.get("body", {}), ensure_ascii=False))
            check("key not saved without consent", page.evaluate("localStorage.getItem('systema.studio.keys.v1')") is None)
            page.unroute("https://api.openai.com/v1/chat/completions")

            # 11c. Anthropic path uses the browser-access header and parses content blocks
            captured.clear()

            def handle_anthropic(route):
                captured["key"] = route.request.headers.get("x-api-key", "")
                captured["version"] = route.request.headers.get("anthropic-version", "")
                captured["browser"] = route.request.headers.get("anthropic-dangerous-direct-browser-access", "")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"content": [{"type": "text", "text": "[재무] 남은 반론: 단위 마진이 낮다."}]}),
                )

            page.route("https://api.anthropic.com/v1/messages", handle_anthropic)
            page.get_by_role("button", name="Anthropic").click()
            page.fill(".byok input[type=password]", "sk-ant-test-only")
            page.get_by_role("button", name="AI로 검증 실행").click()
            page.wait_for_timeout(700)
            check("anthropic output rendered", "단위 마진" in page.locator(".byok-output").inner_text())
            check("anthropic key header", captured.get("key") == "sk-ant-test-only")
            check("anthropic browser access header", captured.get("browser") == "true")
            check("anthropic version header", captured.get("version") == "2023-06-01")
            page.unroute("https://api.anthropic.com/v1/messages")

            # 12. delete with confirmation
            before = page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')).systems.length")
            page.locator(".workhead-actions button", has_text="삭제").click()
            page.get_by_role("button", name="영구 삭제").click()
            page.wait_for_timeout(200)
            after = page.evaluate("JSON.parse(localStorage.getItem('systema.studio.v1')).systems.length")
            check("delete removes one system", after == before - 1, f"{before}->{after}")
            check("confirmation does not carry to the next system", page.locator(".confirm").count() == 0)

            # 13. mobile selector and overflow
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(200)
            options = page.locator(".rail-select option")
            check("mobile system selector", options.count() >= 2)
            page.select_option(".rail-select select", index=1)
            page.wait_for_timeout(200)
            check("mobile switch changes system", page.locator(".title-input").input_value() != "")
            overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check("no horizontal overflow at 390", overflow <= 0, str(overflow))
            page.set_viewport_size({"width": 1920, "height": 1080})
            page.wait_for_timeout(200)
            wide = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check("no horizontal overflow at 1920", wide <= 0, str(wide))

            # 14. pro modal
            page.click(".pro-link")
            page.wait_for_timeout(300)
            check("pro modal opens", page.locator("dialog.modal").count() == 1 and page.locator(".pack").count() == 12)
            page.click(".modal .icon-btn")
            page.wait_for_timeout(200)
            check("pro modal closes", page.locator("dialog.modal").count() == 0)

            check("no console errors", len([e for e in errors if not e.startswith("warning")]) == 0, "; ".join(errors[:3]))
            browser.close()
    finally:
        httpd.shutdown()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
