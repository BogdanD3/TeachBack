"""Phase 10.3: topic start options → primer (quick + full) → teach → Peek → report notes peeks (demo account)."""
import os
from playwright.sync_api import sync_playwright
from common import BASE, OUT, check, launch, login, wait_pip

W = int(os.environ.get("WIDTH", "375"))

with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": W, "height": 800}).new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    login(page)

    page.goto(BASE + "/library/photosynthesis", wait_until="networkidle")
    for action in ("start_teach", "open_primer", "open_primer_full"):
        check(page.locator(f'[data-action="{action}"]').count() == 1, f"topic page offers {action}")
    page.click('[data-action="open_primer"]')
    page.wait_for_selector("text=Now teach it to Pip", timeout=30000)
    body = page.locator("main").inner_text()
    check(page.locator("section[id^=concept-]").count() == 7, "quick primer: one section per concept (7)")
    check("min read" in body.lower() and "Common mistake" not in body, "quick primer: read time, no deep-dive extras")
    page.screenshot(path=f"{OUT}/primer-quick-{W}.png", full_page=True)

    page.click('[data-action="open_primer_full"]')
    page.wait_for_url("**/learn?depth=full")
    page.wait_for_selector("text=Common mistake", timeout=30000)
    check(page.locator("text=Going deeper").count() == 7, "full primer: 'Going deeper' for every concept")
    page.screenshot(path=f"{OUT}/primer-full-{W}.png", full_page=True)

    page.locator('main [data-action="start_teach"]').click()
    page.wait_for_url("**/teach/photosynthesis")
    page.wait_for_selector("text=I've heard about Photosynthesis")

    page.click('[data-action="peek"]')
    page.wait_for_selector("#peek-hint")
    hint = page.locator("#peek-hint").inner_text()
    check("Chlorophyll captures light" in hint.replace("\n", " ") or "chlorophyll captures light" in hint.lower(), "first peek hints at the first concept")
    check("−5 points" in hint, f"first peek costs 5 points ({hint.splitlines()[-1]})")
    page.click('[data-action="peek"]')
    page.wait_for_selector("#peek-hint >> text=Already peeked")
    check(True, "peeking the same concept again is free")
    page.screenshot(path=f"{OUT}/peek-{W}.png")
    page.click('[aria-label="Close hint"]')

    page.fill("#teach-message", "Chlorophyll, the green pigment in leaves, captures light energy from the sun.")
    page.keyboard.press("Enter")
    wait_pip(page, 3)
    page.click('[data-action="peek"]')
    page.wait_for_selector("#peek-hint >> text=−5 points")
    second = page.locator("#peek-hint").inner_text()
    check("chlorophyll captures light" not in second.lower(), f"after covering it, peek moves to another concept ({second.splitlines()[0]})")
    check(page.locator("text=2 peeks used").count() == 1, "peek counter shows 2")

    page.click('[data-action="finish_session"]')
    page.wait_for_selector("text=concepts solid", timeout=30000)
    check(page.locator("li >> text=Peeked").count() == 2, "report marks 2 peeked concepts")
    check(page.locator("text=You peeked at 2 concepts").count() == 1, "report summarises peeks")
    page.screenshot(path=f"{OUT}/report-peeks-{W}.png", full_page=True)
    check(not errors, f"no page errors {errors[:2]}")
    b.close()
