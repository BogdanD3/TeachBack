"""Runs DEMO.md start to finish (demo mode). Seed with DEMO_OPENS_IN_MIN=1 so the countdown reaches 0 quickly:
   DEMO_OPENS_IN_MIN=1 bash scripts/e2e.sh demo.py"""
import os
from playwright.sync_api import sync_playwright
from common import BASE, OUT, check, launch, login, wait_pip

MESSAGES = [
    "Photosynthesis is how plants make their own food. Chlorophyll, the green pigment in leaves, captures light energy.",
    "They take in water through their roots and carbon dioxide from the air through tiny pores called stomata.",
    "It all happens inside the chloroplasts in the leaf cells.",
    "In the light-dependent reactions, light energy splits water and makes ATP.",
    "The oxygen we breathe comes from splitting that water.",
    "Then the plant makes glucose, which it uses for energy or stores as starch.",
]

with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": 1280, "height": 900}).new_page()
    page.goto(BASE + "/", wait_until="networkidle")
    check(page.locator("text=Learn it by").count() > 0, "1 landing page")
    login(page)
    check("/dashboard" in page.url, "2 demo login → dashboard")
    page.goto(BASE + "/library", wait_until="networkidle")
    page.click("text=Photosynthesis")
    page.locator('[data-action="start_teach"]').first.click()
    page.wait_for_selector("text=I've heard about Photosynthesis")
    check(True, "3 teach session opened")
    for i, m in enumerate(MESSAGES):
        page.fill("#teach-message", m)
        page.keyboard.press("Enter")
        wait_pip(page, 3 + 2 * i)
    header = page.locator("header").inner_text()
    check("6 of 7" in header, "4 six messages → 6 of 7 concepts covered")
    page.click('[data-action="finish_session"]')
    page.wait_for_selector("text=concepts solid", timeout=30000)
    body = page.locator("main").inner_text()
    check("5 of 7 concepts solid" in body and "+50 points" in body, "5 report: 5 of 7 solid, +50 points")
    check(page.locator("li:has-text('Calvin cycle') >> text=Gap").count() >= 1, "5 report: Calvin cycle is the gap")
    page.screenshot(path=f"{OUT}/demo-report.png", full_page=True)
    page.click('[data-action="fix_gap"]')
    page.wait_for_selector("text=/the gap/i", timeout=30000)
    page.locator("li:has-text('Q1') [data-action='lesson_answer']").nth(1).click()
    page.locator("li:has-text('Q2') [data-action='lesson_answer']").nth(2).click()
    page.wait_for_selector("text=2 of 2 right")
    check(True, "6 lesson: B then C → 2 of 2 right")
    page.click('[data-action="teach_again"]')
    page.wait_for_selector("text=I've heard about Photosynthesis")
    page.goto(BASE + "/map", wait_until="networkidle")
    page.locator('button[aria-label^="Calvin cycle: gap"]').click()
    page.wait_for_selector("dialog[open] >> text=Fix this gap")
    check(True, "7 teach again + map shows Calvin cycle gap")
    page.keyboard.press("Escape")

    page.goto(BASE + "/live", wait_until="networkidle")
    card = page.locator("#photosynthesis-live-explain-off")
    btn = card.locator('[data-action="book_seat"]')
    check(btn.is_disabled(), "8 live: 'Opens in…' before booking opens")
    btn.locator("xpath=self::*[not(@disabled)]").wait_for(timeout=150_000)
    seats_before = card.locator("text=seats left").inner_text()
    btn.click()
    card.locator("text=You're booked").wait_for()
    check(True, f"8 live: countdown hit 0, seat booked ({seats_before})")
    page.goto(BASE + "/leaderboard", wait_until="networkidle")
    check(page.locator("tr[aria-current=true]").count() == 1, "9 leaderboard highlights Jordan")
    b.close()
