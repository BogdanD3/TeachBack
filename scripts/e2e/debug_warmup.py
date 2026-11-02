"""Dev-server reload-loop probe: after each API warm-up POST, load /auth/signup and count how often it reloads."""
from playwright.sync_api import sync_playwright
from common import BASE, launch

APIS = ["/api/auth/signup", "/api/teach/x/message", "/api/teach/x/finish", "/api/live/x/book", "/api/reviews",
        "/api/community/threads", "/api/checkout/promo", "/api/checkout", "/api/referral/claim"]

with sync_playwright() as p:
    b = launch(p)
    for api in APIS:
        ctx = b.new_context()
        page = ctx.new_page()
        r = page.request.post(BASE + api, data="{}", headers={"Content-Type": "application/json"}, timeout=90000)
        loads = []
        page.on("request", lambda req: req.resource_type == "document" and loads.append(req.url))
        try:
            page.goto(BASE + "/auth/signup", wait_until="load", timeout=60000)
            page.wait_for_timeout(3000)
        except Exception as e:
            loads.append("error " + str(e)[:60])
        print(f"{'LOOP' if len(loads) > 2 else 'ok  '} after POST {api} ({r.status}): {len(loads)} document loads")
        ctx.close()
    b.close()
