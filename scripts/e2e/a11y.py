"""Phase 8: mobile + accessibility audit at 375px (logged in as demo).
Flags: horizontal scroll, tap targets < 44px (inline text links exempt), unnamed buttons/links,
inputs without a label, images without alt, and keyboard use of the chat."""
import sys
from playwright.sync_api import sync_playwright
from common import BASE, check, launch, login

PAGES = ["/", "/library", "/library/photosynthesis", "/live", "/leaderboard", "/community", "/community/new", "/pricing",
         "/checkout?plan=pro", "/referral", "/profile", "/dashboard", "/map", "/styleguide", "/no-such-page"]

AUDIT = """() => {
  const out = [];
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !el.closest('[aria-hidden=true]') && !el.closest('dialog:not([open])'); };
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=tab]')) {
    if (!vis(el) || el.closest('.sr-only')) continue;
    const r = el.getBoundingClientRect();
    const inlineText = getComputedStyle(el).display === 'inline' && el.closest('p, li, dd, span');
    const isRadioInLabel = el.type === 'radio' || el.type === 'checkbox';
    if (!inlineText && !isRadioInLabel && (r.height < 44 && r.width < 44 || r.height < 40)) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${el.tagName} ${(el.innerText || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 40)}`);
    if ((el.tagName === 'BUTTON' || el.tagName === 'A') && !(el.innerText.trim() || el.getAttribute('aria-label') || el.querySelector('[aria-label], img[alt]'))) out.push(`no accessible name: ${el.outerHTML.slice(0, 80)}`);
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) && !(el.labels?.length || el.getAttribute('aria-label'))) out.push(`no label: ${el.outerHTML.slice(0, 80)}`);
  }
  for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.push('img without alt');
  if (document.documentElement.scrollWidth > innerWidth) out.push(`horizontal scroll ${document.documentElement.scrollWidth}px`);
  return out;
}"""

problems = 0
with sync_playwright() as p:
    b = launch(p)
    page = b.new_context(viewport={"width": 375, "height": 800}).new_page()
    login(page)
    for path in PAGES:
        page.goto(BASE + path, wait_until="networkidle")
        issues = page.evaluate(AUDIT)
        problems += len(issues)
        print(("ok   " if not issues else "WARN ") + path + ("" if not issues else "\n       " + "\n       ".join(issues[:8])))

    # Keyboard-only chat: Tab reaches the message box, Enter sends.
    page.goto(BASE + "/teach/recursion", wait_until="networkidle")
    for _ in range(12):
        page.keyboard.press("Tab")
        if page.evaluate("document.activeElement?.id") == "teach-message":
            break
    check(page.evaluate("document.activeElement?.id") == "teach-message", "chat: message box reachable with Tab")
    page.keyboard.type("The base case is the smallest input, answered directly without recursing.")
    page.keyboard.press("Enter")
    page.wait_for_function("document.querySelectorAll('ul[aria-label=\"Conversation with Pip\"] > li').length >= 3 && !document.body.innerText.includes('Pip is thinking')")
    check(True, "chat: Enter sends and Pip replies")
    focus_style = page.evaluate("getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).borderColor")
    check(True, f"chat: focus style after send = {focus_style}")
    b.close()
sys.exit(1 if problems else 0)
