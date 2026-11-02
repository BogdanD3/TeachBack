"""Screenshots of the streaming bubble and the gap-report progress screen (finish request delayed in the browser)."""
import time
from playwright.sync_api import sync_playwright
from common import BASE, OUT, launch, login, wait_pip

with sync_playwright() as p:
    b = launch(p)
    for w in (375, 1280):
        page = b.new_context(viewport={"width": w, "height": 800}).new_page()
        login(page)
        page.goto(BASE + "/teach/photosynthesis?new=1")
        page.wait_for_selector("text=I've heard about Photosynthesis")
        page.fill("#teach-message", "Chlorophyll, the green pigment in leaves, captures light energy from the sun.")
        page.keyboard.press("Enter")
        page.wait_for_selector("[data-streaming]")
        page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/stream-{w}.png")
        wait_pip(page, 3)

        held = []
        page.route("**/finish", lambda route: held.append(route))  # hold the request open
        page.click('[data-action="finish_session"]')
        page.wait_for_timeout(5500)
        page.screenshot(path=f"{OUT}/progress-{w}.png")
        held[0].continue_()
        page.wait_for_url("**/report/**", timeout=30000)
        page.close()
    b.close()
    print("ok   screenshots written")
