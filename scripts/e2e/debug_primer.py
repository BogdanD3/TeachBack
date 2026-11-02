"""Viewport screenshots of the topic start options and the primer (top + end) at 375 and 1280."""
from playwright.sync_api import sync_playwright
from common import BASE, OUT, launch, login

with sync_playwright() as p:
    b = launch(p)
    for w in (375, 1280):
        page = b.new_context(viewport={"width": w, "height": 900}).new_page()
        login(page)
        page.goto(BASE + "/library/photosynthesis", wait_until="networkidle")
        page.locator('[data-action="open_primer"]').scroll_into_view_if_needed()
        page.screenshot(path=f"{OUT}/topic-start-{w}.png")
        page.goto(BASE + "/library/photosynthesis/learn?depth=full")
        page.wait_for_selector("text=Now teach it to Pip")
        page.screenshot(path=f"{OUT}/primer-top-{w}.png")
        page.locator("#concept-6").scroll_into_view_if_needed()
        page.screenshot(path=f"{OUT}/primer-mid-{w}.png")
        page.locator("text=Now teach it to Pip").scroll_into_view_if_needed()
        page.screenshot(path=f"{OUT}/primer-end-{w}.png")
        page.close()
    b.close()
    print("ok   screenshots written")
