"""Shared Playwright helpers for the e2e scripts."""
import glob
import os

BASE = os.environ.get("BASE", "http://localhost:3000")
OUT = os.environ.get("SHOTS", "screenshots")


def launch(p):
    # System Chromium first (CLAUDE.md). Inside the Claude sandbox it aborts on a
    # socket restriction, so fall back to Playwright's cached headless shell.
    try:
        return p.chromium.launch(executable_path="/usr/bin/chromium", headless=True)
    except Exception:
        shells = glob.glob(os.path.expanduser("~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell"))
        if not shells:
            return p.chromium.launch(headless=True)
        return p.chromium.launch(executable_path=sorted(shells)[-1], headless=True)


def check(cond, msg):
    if not cond:
        raise SystemExit(f"FAIL: {msg}")
    print(f"ok   {msg}")


CHAT = 'ul[aria-label="Conversation with Pip"]'


def wait_pip(page, min_items):
    """Wait until the chat has `min_items` bubbles and Pip has finished streaming (aria-busy off)."""
    page.wait_for_function(
        f"document.querySelectorAll('{CHAT} > li').length >= {min_items}"
        f" && document.querySelector('{CHAT}')?.getAttribute('aria-busy') === 'false'"
    )


def login(page, email="demo@teachback.app", password="demo1234"):
    page.goto(BASE + "/auth/login", wait_until="networkidle")
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.click('[data-action="login"]')
    page.wait_for_url(lambda u: "/auth/login" not in u, timeout=15000)
