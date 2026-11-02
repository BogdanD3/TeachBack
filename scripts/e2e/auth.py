"""Phase 4: sign up, log out, log in with demo account, protected pages redirect, referral link."""
import time
from playwright.sync_api import sync_playwright
from common import BASE, check, launch, login

with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()

    page.goto(BASE + "/dashboard", wait_until="networkidle")
    check("/auth/login?next=%2Fdashboard" in page.url, f"protected page redirects to login ({page.url})")

    page.fill("#login-email", "demo@teachback.app")
    page.fill("#login-password", "wrong-password")
    page.click('[data-action="login"]')
    page.wait_for_selector("text=That email and password don't match")
    check(True, "wrong password shows an error")

    page.fill("#login-password", "demo1234")
    page.click('[data-action="login"]')
    page.wait_for_url("**/dashboard")
    check(page.locator("h1").inner_text().startswith("Hi, Jordan"), "demo login lands on dashboard")
    cookie = [c for c in ctx.cookies() if c["name"] == "tb_session"][0]
    check(cookie["httpOnly"], "session cookie is HTTP-only")

    page.click('button[aria-haspopup="menu"]')
    page.click('[data-action="logout"]:visible')
    page.wait_for_url(BASE + "/")
    page.goto(BASE + "/dashboard", wait_until="networkidle")
    check("/auth/login" in page.url, "logout ends the session")

    page.goto(BASE + "/signup?ref=JORDAN26", wait_until="networkidle")
    check("/auth/signup?ref=JORDAN26" in page.url and page.locator("text=Jordan invited you").count() == 1, "referral link shows inviter")
    email = f"e2e.{int(time.time())}@example.com"
    page.fill("#signup-name", "Robin Achterberg")
    page.fill("#signup-email", email)
    page.fill("#signup-password", "short")
    page.click('[data-action="signup"]')
    page.wait_for_selector("text=Use at least 8 characters")
    check(True, "short password rejected with field error")
    page.fill("#signup-password", "a-proper-password")
    page.click('[data-action="signup"]')
    page.wait_for_url("**/library?welcome=1")
    check(True, f"signup logs in and redirects ({email})")
    page.goto(BASE + "/dashboard", wait_until="networkidle")
    check(page.locator("h1").inner_text().startswith("Hi, Robin"), "new user can open protected page")
    b.close()
