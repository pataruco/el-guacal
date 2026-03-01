from playwright.sync_api import Page, expect, sync_playwright

def test_login_page(page: Page):
    page.goto("http://localhost:5173/auth/login")
    expect(page.get_by_role("heading", name="Login")).to_be_visible()
    expect(page.get_by_role("button", name="Login with Google")).to_be_visible()
    page.screenshot(path="verification/login_page.png")

def test_header_links(page: Page):
    page.goto("http://localhost:5173/")
    header = page.locator("header")
    expect(header.get_by_role("link", name="Home")).to_be_visible()
    expect(header.get_by_role("link", name="About")).to_be_visible()
    expect(header.get_by_role("link", name="Login")).to_be_visible()
    page.screenshot(path="verification/header_home.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_login_page(page)
            test_header_links(page)
        finally:
            browser.close()
