"""Phase 10.4: lessons reachable from the dashboard, the Understanding Map and topic pages (demo account, seeded lesson)."""
import os
from playwright.sync_api import sync_playwright
from common import BASE, OUT, check, launch, login

W = int(os.environ.get("WIDTH", "375"))

with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": W, "height": 900}).new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    login(page)

    page.goto(BASE + "/dashboard", wait_until="networkidle")
    section = page.locator("section[aria-labelledby=lessons-h]")
    check(section.locator('[data-action="open_lesson"]').count() >= 1, "dashboard: 'Your lessons' lists the seeded lesson")
    weak = page.locator('a[data-action="fix_gap"]')
    check(weak.count() >= 1 and "/lesson/" in (weak.first.get_attribute("href") or ""), "dashboard: weakest concepts link to their lessons")
    section.scroll_into_view_if_needed()
    page.screenshot(path=f"{OUT}/dashboard-lessons-{W}.png")
    lesson_href = section.locator('[data-action="open_lesson"]').first.get_attribute("href")

    page.goto(BASE + "/map", wait_until="networkidle")
    node = page.locator('button[aria-label*=": gap."], button[aria-label*=": shaky."]').first
    node.click()
    dlg = page.locator("dialog[open]")
    dlg.wait_for()
    fix = dlg.locator('[data-action="fix_gap"]')
    check(fix.inner_text() == "Fix this gap" and "/lesson/" in (fix.get_attribute("href") or ""), "map: shaky/gap concept shows 'Fix this gap' → lesson")
    page.screenshot(path=f"{OUT}/map-fix-{W}.png")
    page.keyboard.press("Escape")

    found = False
    for slug in ("water-cycle", "supply-and-demand", "recursion"):
        page.goto(f"{BASE}/library/{slug}", wait_until="networkidle")
        links = page.locator("section[aria-labelledby=my-lessons-h] a")
        if links.count() and any(links.nth(i).get_attribute("href") == lesson_href for i in range(links.count())):
            found = True
            page.locator("section[aria-labelledby=my-lessons-h]").scroll_into_view_if_needed()
            page.screenshot(path=f"{OUT}/topic-lessons-{W}.png")
            break
    check(found, "topic page lists the user's lesson for that topic")
    page.goto(BASE + "/library/photosynthesis", wait_until="networkidle")
    check(page.locator("section[aria-labelledby=my-lessons-h]").count() == 0, "topic without lessons shows no lessons section")

    page.goto(BASE + lesson_href)
    page.wait_for_selector("text=/the gap/i", timeout=30000)
    check(True, "seeded lesson opens")
    check(not errors, f"no page errors {errors[:2]}")
    b.close()
