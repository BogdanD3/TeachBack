"""Phase 7: forcing a BotLens verdict shows the right UI on every protected action.
Uses the dev-only `botlens_force` cookie (see lib/botlens.ts)."""
import json
import time
from playwright.sync_api import sync_playwright
from common import BASE, check, launch, login

with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": 375, "height": 900})
    page = ctx.new_page()

    def force(value):
        # Overwrite in place ("off" is ignored by the server); clearing would also drop the session.
        ctx.add_cookies([{"name": "botlens_force", "value": value or "off", "url": BASE}])

    def expect(kind, action):
        try:
            page.wait_for_selector(f"dialog#botlens-{kind}[open]", timeout=10000)
        except Exception:
            print("debug dialogs:", page.evaluate("[...document.querySelectorAll('dialog')].map(d => d.id + ':' + d.open)"))
            print("debug cookies:", ctx.cookies())
            print("debug url:", page.url)
            raise
        check(True, f"{action}: {kind} modal shown")

    def close():
        page.keyboard.press("Escape")
        page.wait_for_selector("dialog[open]", state="detached", timeout=5000)

    # Warm up: compile every API route and page first, so the dev server doesn't reload pages mid-test.
    for path in ["/api/auth/signup", "/api/teach/x/message", "/api/teach/x/finish", "/api/live/x/book", "/api/reviews",
                 "/api/community/threads", "/api/checkout/promo", "/api/checkout", "/api/referral/claim"]:
        page.request.post(BASE + path, data="{}", headers={"Content-Type": "application/json"})
    for path in ["/auth/signup", "/auth/login", "/teach/photosynthesis", "/live", "/library/photosynthesis", "/community/new", "/checkout", "/referral"]:
        page.goto(BASE + path, wait_until="networkidle")

    # Raw API contract
    for kind, status, err in (("block", 403, "blocked"), ("challenge", 429, "challenge")):
        force(f"{kind}@login")
        r = page.request.post(BASE + "/api/auth/login", data=json.dumps({"email": "x@y.z", "password": "x"}), headers={"Content-Type": "application/json"})
        check(r.status == status and r.json().get("error") == err, f"API: {kind} → HTTP {r.status} {r.json()}")

    # signup (challenge) and login (block) before logging in
    force("challenge@signup")
    page.goto(BASE + "/auth/signup", wait_until="networkidle")
    page.fill("#signup-name", "Bot Probe")
    page.fill("#signup-email", f"probe.{int(time.time())}@example.com")
    page.fill("#signup-password", "a-proper-password")
    page.click('[data-action="signup"]')
    expect("challenge", "signup")
    close()

    force("block@login")
    page.goto(BASE + "/auth/login", wait_until="networkidle")
    page.fill("#login-email", "demo@teachback.app")
    page.fill("#login-password", "demo1234")
    page.click('[data-action="login"]')
    expect("blocked", "login")
    close()

    force(None)
    login(page)

    # ai_message: challenge, then "I'm human, try again" retries and succeeds.
    force("challenge@ai_message")
    page.goto(BASE + "/teach/photosynthesis", wait_until="networkidle")
    page.fill("#teach-message", "Chlorophyll is the green pigment that catches light.")
    page.keyboard.press("Enter")
    expect("challenge", "ai_message")
    force(None)
    page.click('[data-action="botlens_verify"]')
    page.wait_for_selector("text=solar panel")
    check(True, "ai_message: retry after verification succeeds")

    force("block@leaderboard_submit")
    page.click('[data-action="finish_session"]')
    expect("blocked", "leaderboard_submit (finish session)")
    close()

    steps = [
        ("challenge@book_seat", "/live", lambda: page.click('#newtons-third-law-weekly [data-action="book_seat"]'), "challenge"),
        ("block@post_review", "/library/photosynthesis", lambda: (page.locator("#review-form label").nth(4).click(), page.fill("#review-text", "Testing the blocked review path."), page.click('[data-action="post_review"]')), "blocked"),
        ("challenge@post_forum", "/community/new", lambda: (page.fill("#thread-title", "A probe thread title"), page.fill("#thread-body", "This should be challenged by BotLens."), page.click('[data-action="post_forum"]')), "challenge"),
        ("block@apply_promo", "/checkout?plan=pro", lambda: (page.fill("#promo-code", "WELCOME20"), page.click('[data-action="apply_promo"]')), "blocked"),
        ("challenge@checkout", "/checkout?plan=pro", lambda: (page.fill("#checkout-card-number", "4242424242424242"), page.fill("#checkout-card-expiry", "1230"), page.fill("#checkout-card-cvc", "123"), page.click('[data-action="checkout"]')), "challenge"),
        ("block@referral_claim", "/referral", lambda: page.click('[data-action="referral_claim"]'), "blocked"),
    ]
    for cookie, path, act, kind in steps:
        force(cookie)
        page.goto(BASE + path, wait_until="networkidle")
        act()
        expect(kind, cookie.split("@")[1])
        close()
    b.close()
