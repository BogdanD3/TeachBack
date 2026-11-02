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

def send(page, i):
    page.fill("#teach-message", MESSAGES[i])
    page.keyboard.press("Enter")
    if i == 0:
        page.wait_for_selector("[data-streaming]")  # answer streams in
    wait_pip(page, 3 + 2 * i)


with sync_playwright() as p:
    b = launch(p, ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"])
    page = b.new_context(viewport={"width": 1280, "height": 900}, permissions=["microphone"]).new_page()
    page.goto(BASE + "/", wait_until="networkidle")
    check(page.locator("text=Learn it by").count() > 0, "1 landing page")
    login(page)
    check("/dashboard" in page.url, "2 demo login → dashboard")
    page.goto(BASE + "/library", wait_until="networkidle")
    page.click("text=Photosynthesis")
    page.click('[data-action="open_primer"]')
    page.wait_for_selector("text=Now teach it to Pip", timeout=30000)
    check(page.locator("section[id^=concept-]").count() == 7, "3 quick primer with 7 concepts")
    page.locator('main [data-action="start_teach"]').click()
    page.wait_for_selector("text=I've heard about Photosynthesis")
    # Message 1 by voice: the demo transcript is exactly message 1.
    page.click('[data-action="voice_input"]')
    page.wait_for_selector("#voice-status >> text=Recording")
    page.wait_for_timeout(1200)
    page.click('[data-action="voice_input"]')
    page.wait_for_function(f"document.querySelector('#teach-message').value === {MESSAGES[0]!r}", timeout=20000)
    page.keyboard.press("Enter")
    page.wait_for_selector("[data-streaming]")
    wait_pip(page, 3)
    check(True, "4 message 1 dictated with the mic, reply streamed")
    for i in (1, 2):
        send(page, i)
    page.click('[data-action="peek"]')
    page.wait_for_selector("#peek-hint >> text=Light-dependent reactions", timeout=10000)
    check(True, "5 peek hints at light-dependent reactions (−5 points)")
    page.click('[aria-label="Close hint"]')
    for i in (3, 4, 5):
        send(page, i)
    header = page.locator("header").inner_text()
    check("6 of 7" in header, "5 six messages → 6 of 7 concepts covered")
    page.click('[data-action="finish_session"]')
    page.wait_for_selector("text=concepts solid", timeout=30000)
    body = page.locator("main").inner_text()
    check("5 of 7 concepts solid" in body and "+50 points" in body, "6 report: 5 of 7 solid, +50 points")
    check(page.locator("li:has-text('Calvin cycle') >> text=Gap").count() >= 1, "6 report: Calvin cycle is the gap")
    check(page.locator("li:has-text('Light-dependent reactions') >> text=Peeked").count() == 1, "6 report: Peeked badge on light-dependent reactions")
    page.screenshot(path=f"{OUT}/demo-report.png", full_page=True)
    page.click('[data-action="fix_gap"]')
    page.wait_for_selector("text=/the gap/i", timeout=30000)
    page.locator("li:has-text('Q1') [data-action='lesson_answer']").nth(1).click()
    page.locator("li:has-text('Q2') [data-action='lesson_answer']").nth(2).click()
    page.wait_for_selector("text=2 of 2 right")
    check(True, "7 lesson: B then C → 2 of 2 right")
    page.click('[data-action="teach_again"]')
    page.wait_for_selector("text=I've heard about Photosynthesis")
    page.goto(BASE + "/map", wait_until="networkidle")
    page.locator('button[aria-label^="Calvin cycle: gap"]').click()
    page.wait_for_selector("dialog[open] >> text=Your lesson is ready")
    page.click('dialog[open] [data-action="fix_gap"]')
    page.wait_for_selector("text=/the gap/i", timeout=30000)
    page.goto(BASE + "/dashboard", wait_until="networkidle")
    check(page.locator("section[aria-labelledby=lessons-h] >> text=Calvin cycle").count() >= 1, "8 map → lesson, dashboard lists the Calvin cycle lesson")

    page.goto(BASE + "/live", wait_until="networkidle")
    card = page.locator("#photosynthesis-live-explain-off")
    btn = card.locator('[data-action="book_seat"]')
    if btn.is_disabled():
        btn.locator("xpath=self::*[not(@disabled)]").wait_for(timeout=150_000)
        check(True, "9 live: 'Opens in…' until booking opens")
    seats_before = card.locator("text=seats left").inner_text()
    btn.click()
    card.locator("text=You're booked").wait_for()
    check(True, f"9 live: seat booked ({seats_before})")
    page.goto(BASE + "/leaderboard", wait_until="networkidle")
    check(page.locator("tr[aria-current=true]").count() == 1, "10 leaderboard highlights Jordan")
    b.close()
