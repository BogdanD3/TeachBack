"""Debug helper: send one teach message and print network + DOM state."""
from playwright.sync_api import sync_playwright
from common import BASE, OUT, launch, login

with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": 375, "height": 800}).new_page()
    page.on("console", lambda m: print("console:", m.type, m.text[:200]))
    page.on("response", lambda r: print("resp:", r.status, r.url) if "/api/" in r.url else None)
    login(page)
    page.goto(BASE + "/teach/photosynthesis", wait_until="networkidle")
    page.fill("#teach-message", "Chlorophyll, the green pigment in leaves, captures light energy.")
    page.keyboard.press("Enter")
    page.wait_for_timeout(4000)
    print("items:", page.locator('ul[aria-label="Conversation with Pip"] > li').count())
    print(page.locator("main").inner_text()[:800])
    page.screenshot(path=f"{OUT}/debug-teach.png")
    b.close()
