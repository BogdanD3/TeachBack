"""Phase 10.5: mic → MediaRecorder → /api/transcribe → text lands in the input (not sent). Uses Chromium's fake mic.
On a dev server (no E2E_PROD) it also checks the BotLens challenge on transcription."""
import os
from playwright.sync_api import sync_playwright
from common import BASE, CHAT, OUT, check, launch, login, wait_pip

W = int(os.environ.get("WIDTH", "375"))
DEMO_TEXT = "Photosynthesis is how plants make their own food."

with sync_playwright() as p:
    b = launch(p, ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"])
    ctx = b.new_context(viewport={"width": W, "height": 800}, permissions=["microphone"])
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    r = page.request.post(BASE + "/api/transcribe", multipart={"sessionId": "x"})
    check(r.status in (401, 403), f"transcribe needs a login ({r.status})")
    login(page)
    page.goto(BASE + "/teach/photosynthesis?new=1")
    page.wait_for_selector("text=I've heard about Photosynthesis")

    r = page.request.post(BASE + "/api/transcribe", multipart={"sessionId": "x"})
    check(r.status == 400, f"missing audio → 400 ({r.status})")
    r = page.request.post(BASE + "/api/transcribe", multipart={"sessionId": "x", "audio": {"name": "a.txt", "mimeType": "text/plain", "buffer": b"hello"}})
    check(r.status == 400 and "format" in r.json().get("message", ""), "non-audio upload → 400")

    mic = page.locator('[data-action="voice_input"]')
    check(mic.count() == 1, "mic button shown (MediaRecorder + getUserMedia available)")
    mic.click()
    page.wait_for_selector("#voice-status >> text=Recording")
    page.wait_for_timeout(1500)
    check("0:01" in page.locator("#voice-status").inner_text() or "0:02" in page.locator("#voice-status").inner_text(), "recording timer runs, max 1:00 shown")
    page.screenshot(path=f"{OUT}/voice-recording-{W}.png")
    mic.click()
    page.wait_for_function(f"document.querySelector('#teach-message').value.includes({DEMO_TEXT!r})", timeout=20000)
    check(True, "transcript (demo mode) lands in the input")
    check(page.locator(f"{CHAT} > li").count() == 1, "transcript is not sent automatically")
    page.keyboard.press("Enter")
    wait_pip(page, 3)
    check(True, "user sends the checked transcript")

    if os.environ.get("E2E_PROD") != "1":
        ctx.add_cookies([{"name": "botlens_force", "value": "challenge@ai_message", "url": BASE}])
        mic.click()
        page.wait_for_selector("#voice-status >> text=Recording")
        page.wait_for_timeout(800)
        mic.click()
        page.wait_for_selector("#botlens-challenge[open]", timeout=15000)
        check(True, "BotLens challenge on transcription shows the verify modal")
        ctx.add_cookies([{"name": "botlens_force", "value": "off", "url": BASE}])
    check(not errors, f"no page errors {errors[:2]}")
    b.close()
