from playwright.sync_api import sync_playwright

def verify_lesson(page):
    print("Navigating to root...")
    page.goto("http://localhost:5173/")
    page.wait_for_timeout(2000)

    # Check if we are on profiles page
    if "/profiles" in page.url:
        print("On profiles page")
        try:
            if page.locator(".add-profile").is_visible():
                print("Clicking Add Player")
                page.locator(".add-profile").click()
                page.wait_for_timeout(500)
                page.fill("#profile-name", "TestUser")
                page.get_by_role("button", name="Let's Play!").click()
                page.wait_for_url("http://localhost:5173/", timeout=5000)
            elif page.locator(".profile-content-btn").count() > 0:
                print("Selecting existing profile")
                page.locator(".profile-content-btn").first.click()
                page.wait_for_url("http://localhost:5173/", timeout=5000)
        except Exception as e:
            print(f"Profile selection failed: {e}")
            raise e

    # Verify Lesson 1 (ExploreBoard)
    print("Navigating to lesson 1...")
    page.goto("http://localhost:5173/lesson/1")
    page.wait_for_selector(".lesson-page", timeout=10000)
    if page.get_by_role("button", name="Let's Practice!").is_visible():
        page.get_by_role("button", name="Let's Practice!").click()
        page.wait_for_timeout(1000)
    page.screenshot(path="verification/lesson_1_board.png")

    # Verify Lesson 2 (ChessBoard)
    print("Navigating to lesson 2...")
    page.goto("http://localhost:5173/lesson/2")
    page.wait_for_selector(".lesson-page", timeout=10000)
    if page.get_by_role("button", name="Let's Practice!").is_visible():
        page.get_by_role("button", name="Let's Practice!").click()
        page.wait_for_timeout(1000)

    # Wait for board pieces to load (svg elements)
    page.wait_for_selector("svg", timeout=5000)
    page.screenshot(path="verification/lesson_2_board.png")
    print("Lesson 2 screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_lesson(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
