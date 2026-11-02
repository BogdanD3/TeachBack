"""Phase 5: library → teach → finish → report → lesson → teach again → map (demo account)."""
import os
from playwright.sync_api import sync_playwright
from common import BASE, OUT, check, launch, login

os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get("WIDTH", "375"))

with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": W, "height": 800}).new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    login(page)

    page.goto(BASE + "/library?q=photo", wait_until="networkidle")
    check(page.locator("article").count() == 1, "library search finds Photosynthesis")
    page.click("text=Photosynthesis")
    page.wait_for_url("**/library/photosynthesis")
    check(page.locator("h1").inner_text() == "Photosynthesis", "topic detail renders")
    page.locator('[data-action="start_teach"]').first.click()
    page.wait_for_url("**/teach/photosynthesis")
    page.wait_for_selector("text=I've heard about Photosynthesis")
    check(True, "teach session opens with Pip's fixed opening")

    msgs = [
        "Photosynthesis is how plants make food. Chlorophyll, the green pigment in leaves, captures light energy.",
        "They take in water through the roots and carbon dioxide from the air through little pores called stomata.",
        "The oxygen comes from splitting water molecules during the light-dependent reactions.",
    ]
    for i, m in enumerate(msgs):
        page.fill("#teach-message", m)
        page.keyboard.press("Enter")
        page.wait_for_function(
            f"document.querySelectorAll('ul[aria-label=\"Conversation with Pip\"] > li').length >= {3 + 2 * i}"
            " && !document.body.innerText.includes('Pip is thinking')"
        )
    page.wait_for_timeout(300)
    progress = page.locator("header").inner_text()
    check("2 of 7" in progress or "3 of 7" in progress, f"progress updates ({progress.split(chr(10))[-1].strip()})")
    page.screenshot(path=f"{OUT}/flow-teach-{W}.png", full_page=False)

    page.click('[data-action="finish_session"]')
    page.wait_for_url("**/report/**", timeout=30000)
    page.wait_for_load_state("networkidle")
    body = page.locator("main").inner_text()
    check("5 of 7 concepts solid" in body, "report shows score ring text")
    check("Calvin cycle" in body and "Fix this gap" in body, "report lists the Calvin cycle gap with a fix button")
    check("points" in body, "points awarded")
    page.screenshot(path=f"{OUT}/flow-report-{W}.png", full_page=True)

    page.locator('[data-action="fix_gap"]').first.click()
    page.wait_for_url("**/lesson/**", timeout=30000)
    page.wait_for_load_state("networkidle")
    check("the gap" in page.locator("main").inner_text().lower(), "lesson shows gap box")
    page.locator('[data-action="lesson_answer"]').nth(1).click()
    page.wait_for_selector("text=Right.")
    check(True, "check question gives instant feedback")
    page.screenshot(path=f"{OUT}/flow-lesson-{W}.png", full_page=True)

    page.locator('[data-action="teach_again"]').click()
    page.wait_for_url("**/teach/photosynthesis")
    page.wait_for_selector("text=I've heard about Photosynthesis")
    check(page.locator('ul[aria-label="Conversation with Pip"] > li').count() == 1, "teach again starts a fresh session")

    page.goto(BASE + "/map", wait_until="networkidle")
    check(page.locator("#map-photosynthesis").count() == 1, "map now includes Photosynthesis")
    page.locator('button[aria-label^="Calvin cycle: gap"]').click()
    page.wait_for_selector("dialog[open]")
    check(True, "map node opens details")
    page.screenshot(path=f"{OUT}/flow-map-{W}.png", full_page=True)

    page.goto(BASE + "/dashboard", wait_until="networkidle")
    check("Continue session" in page.locator("main").inner_text(), "dashboard offers to continue the open session")
    check(not errors, f"no page errors {errors[:2]}")
    b.close()
