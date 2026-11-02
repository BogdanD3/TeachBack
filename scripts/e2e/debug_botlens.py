"""Debug helper: force a signup challenge and dump what the page shows."""
import time
from playwright.sync_api import sync_playwright
from common import BASE, OUT, launch

with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": 375, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda m: print("console:", m.type, m.text[:200]))
    page.on("response", lambda r: print("resp:", r.status, r.url) if "/api/" in r.url else None)
    ctx.add_cookies([{"name": "botlens_force", "value": "challenge@signup", "url": BASE}])
    page.goto(BASE + "/auth/signup", wait_until="networkidle")
    page.fill("#signup-name", "Bot Probe")
    page.fill("#signup-email", f"probe.{int(time.time())}@example.com")
    page.fill("#signup-password", "a-proper-password")
    page.click('[data-action="signup"]')
    page.wait_for_timeout(2500)
    print("dialogs:", page.evaluate("[...document.querySelectorAll('dialog')].map(d => d.id + ':' + d.open)"))
    print("url:", page.url)
    page.screenshot(path=f"{OUT}/debug-botlens.png")
    b.close()
