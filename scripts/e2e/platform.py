"""Phase 6: live booking + polling, leaderboard, community, reviews, checkout, referral, profile."""
import os
import time
from playwright.sync_api import sync_playwright
from common import BASE, OUT, check, launch, login

W = int(os.environ.get("WIDTH", "375"))


def signup(page, name, email):
    page.goto(BASE + "/auth/signup", wait_until="networkidle")
    page.fill("#signup-name", name)
    page.fill("#signup-email", email)
    page.fill("#signup-password", "a-proper-password")
    page.click('[data-action="signup"]')
    page.wait_for_url("**/library?welcome=1")


def flow(page, who, review_topic, promo, referral_weeks):
    # Live: book the open Newton challenge.
    page.goto(BASE + "/live", wait_until="networkidle")
    newton = page.locator("#newtons-third-law-weekly")
    before = newton.locator("text=seats left").inner_text()
    newton.locator('[data-action="book_seat"]').click()
    newton.locator("text=You're booked").wait_for()
    check(True, f"{who}: booked a seat ({before})")
    check(page.locator("#compound-interest-sold-out [data-action='book_seat']").inner_text() == "Sold out", f"{who}: sold-out event can't be booked")
    check(page.locator("#photosynthesis-live-explain-off [data-action='book_seat']").is_disabled(), f"{who}: demo event shows 'Opens in…' until booking opens")

    page.goto(BASE + "/leaderboard", wait_until="networkidle")
    check(page.locator("tbody tr").count() >= 10, f"{who}: leaderboard has rows")

    # Review
    page.goto(BASE + f"/library/{review_topic}", wait_until="networkidle")
    page.locator('#review-form label').nth(3).click()
    page.fill("#review-text", "Pip caught me skipping a step I always skip. Really useful.")
    page.click('[data-action="post_review"]')
    page.wait_for_selector("text=you reviewed this topic")
    check(True, f"{who}: review posted")

    # Community
    page.goto(BASE + "/community/new", wait_until="networkidle")
    page.fill("#thread-title", f"How do you explain stomata simply? ({who})")
    page.fill("#thread-body", "Pip keeps asking where the air gets in and my answer is always too vague.")
    page.click('[data-action="post_forum"]')
    page.wait_for_url("**/community/c*")
    page.fill("#reply-body", "Answering myself: tiny doors on the underside of the leaf.")
    page.click('[data-action="post_forum"]')
    page.wait_for_selector("text=tiny doors on the underside")
    check(True, f"{who}: thread + reply posted")

    # Checkout
    page.goto(BASE + "/checkout?plan=pro", wait_until="networkidle")
    page.fill("#promo-code", "NOPE123")
    page.click('[data-action="apply_promo"]')
    page.wait_for_selector("text=doesn't exist")
    page.fill("#promo-code", promo)
    page.click('[data-action="apply_promo"]')
    page.wait_for_selector("text=Discount")
    check(True, f"{who}: promo {promo} applied")
    page.fill("#checkout-card-number", "4242 4242 4242 4241")
    page.fill("#checkout-card-expiry", "12/30")
    page.fill("#checkout-card-cvc", "123")
    page.click('[data-action="checkout"]')
    page.wait_for_selector("text=doesn't look right")
    page.fill("#checkout-card-number", "4242 4242 4242 4242")
    page.click('[data-action="checkout"]')
    page.wait_for_url("**/checkout/success**")
    check("Welcome to Pro" in page.locator("h1").inner_text(), f"{who}: fake payment upgrades plan")

    # Referral
    page.goto(BASE + "/referral", wait_until="networkidle")
    check("/signup?ref=" in page.input_value("#referral-link"), f"{who}: referral link shown")
    if referral_weeks:
        page.click('[data-action="referral_claim"]')
        page.wait_for_selector("text=free week added")
        check(True, f"{who}: claimed {referral_weeks} free week")
    else:
        check(page.locator('[data-action="referral_claim"]').is_disabled(), f"{who}: nothing to claim yet")

    page.goto(BASE + "/profile", wait_until="networkidle")
    check("Pro" in page.locator("#plan-h").inner_text(), f"{who}: profile shows Pro plan")
    page.screenshot(path=f"{OUT}/platform-profile-{who}-{W}.png", full_page=True)


with sync_playwright() as p:
    b = launch(p)
    demo = b.new_context(viewport={"width": W, "height": 900}).new_page()
    login(demo)
    flow(demo, "demo", "photosynthesis", "WELCOME20", 1)

    fresh = b.new_context(viewport={"width": W, "height": 900}).new_page()
    signup(fresh, "Noor Haddadi", f"noor.{int(time.time())}@example.com")

    # Polling: demo watches /live while the new user books; demo's count must drop without reload.
    demo.goto(BASE + "/live", wait_until="networkidle")
    seats_before = demo.locator("#newtons-third-law-weekly >> text=seats left").inner_text()
    flow(fresh, "new", "recursion", "STUDENT50", 0)
    demo.wait_for_timeout(2500)
    seats_after = demo.locator("#newtons-third-law-weekly >> text=seats left").inner_text()
    check(seats_before != seats_after, f"seat count updates live ({seats_before} → {seats_after})")
    b.close()
