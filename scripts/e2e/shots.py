"""Screenshot pages at 375 and 1280; report status, horizontal overflow and console errors.
Usage: shots.py [--login] /path1 /path2 ...   (screenshots go to $SHOTS, default ./screenshots)
"""
import os
import sys
from playwright.sync_api import sync_playwright
from common import BASE, OUT, launch, login

args = sys.argv[1:]
do_login = "--login" in args
paths = [a for a in args if a != "--login"]
os.makedirs(OUT, exist_ok=True)
problems = 0

with sync_playwright() as p:
    browser = launch(p)
    for width in (375, 1280):
        ctx = browser.new_context(viewport={"width": width, "height": 900})
        page = ctx.new_page()
        if do_login:
            login(page)
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        for path in paths:
            errors.clear()
            resp = page.goto(BASE + path, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(400)
            sw = page.evaluate("document.documentElement.scrollWidth")
            name = path.strip("/").replace("/", "_").replace("?", "_").replace("=", "-") or "home"
            page.screenshot(path=f"{OUT}/{name}-{width}.png", full_page=True)
            status = resp.status if resp else "?"
            bad = sw > width or errors or (isinstance(status, int) and status >= 400)
            problems += bool(bad)
            print(f"{'PROBLEM' if bad else 'ok     '} {width} {path} status={status} scrollWidth={sw} errors={errors[:3]}")
        ctx.close()
    browser.close()
sys.exit(1 if problems else 0)
