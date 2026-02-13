from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen to console logs
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

    print("Navigating to root...")
    page.goto("http://localhost:5173/")

    # Check if we are on profile select page
    try:
        page.wait_for_selector("h1:has-text('Chess Kids')", timeout=3000)
        print("On Profile Select Page")

        existing_profiles = page.locator(".profile-content-btn")
        count = existing_profiles.count()
        print(f"Found {count} existing profiles")

        if count > 0:
            print("Selecting first profile...")
            existing_profiles.first.click()
        else:
            print("Creating new profile...")
            if page.locator(".add-profile").count() > 0:
                page.click(".add-profile")

            # Fill name
            page.wait_for_selector("input#profile-name")
            page.fill("input#profile-name", "TestUser")

            # Click Let's Play
            page.click("button:has-text(\"Let's Play!\")")

    except Exception as e:
        print(f"Not on profile select or error: {e}")

    print("Navigating to Lesson 2...")
    page.goto("http://localhost:5173/lesson/2")

    print("Waiting for story button...")
    try:
        page.wait_for_selector("button:has-text(\"Let's Practice!\")", timeout=5000)
        page.click("button:has-text(\"Let's Practice!\")")
        print("Clicked story button.")
    except Exception as e:
        print(f"Story button not found or error: {e}")

    print("Waiting for chess board...")
    try:
        page.wait_for_selector(".chess-board-container", timeout=5000)
        print("Found chess board container.")
    except Exception as e:
        print("Timed out waiting for chess board.")
        page.screenshot(path="verification/error_screenshot.png")
        raise e

    time.sleep(2)
    print("Taking screenshot...")
    page.screenshot(path="verification/lesson_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
