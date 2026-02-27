
import os
import time
from playwright.sync_api import sync_playwright

def verify_lesson():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Wait a bit for the server to start
        time.sleep(5)

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:5173")

            # Wait for content to load
            page.wait_for_selector("h1", timeout=10000)
            print("Home page loaded.")

            # Take screenshot of home page
            if not os.path.exists("verification"):
                os.makedirs("verification")
            page.screenshot(path="verification/home_page.png")

            # Navigate to Lesson 1
            # Assuming there is a link or button to Lesson 1.
            # Based on LessonPage.tsx, it uses /lesson/:id.
            # Let's try navigating directly if UI is complex, or click if we find a link.
            # I'll try direct navigation to ensure we hit the modified LessonPage.
            print("Navigating to Lesson 1...")
            page.goto("http://localhost:5173/lesson/1")

            # Wait for board to load. Look for .chess-board-container or similar
            page.wait_for_selector(".chess-board-container", timeout=10000)
            print("Lesson page loaded.")

            # Take screenshot of lesson page
            page.screenshot(path="verification/lesson_page.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_lesson()
