import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Enter credentials into the 'Operator Email' and 'Password' fields and click the 'SIGN IN' button to log in.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Enter credentials into the 'Operator Email' and 'Password' fields and click the 'SIGN IN' button to log in.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Enter credentials into the 'Operator Email' and 'Password' fields and click the 'SIGN IN' button to log in.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '7. INVENTORY AND PHARMACOVIGILANCE' module tile to open the inventory workspace.
        # 7. Inventory and Pharmacovigilance button
        elem = page.get_by_role('button', name='7. Inventory and Pharmacovigilance', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Items' button to open the stocked items list and verify items are displayed.
        # Items button
        elem = page.get_by_test_id('pharm-tab-items')
        await elem.click(timeout=10000)
        
        # -> Click the 'Lots & Expiry' tab to view lot-level information for stocked items.
        # Lots & Expiry button
        elem = page.get_by_test_id('pharm-tab-lots')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify pharmacy items are displayed
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[1]").nth(0).scroll_into_view_if_needed()
        # Assert: Pharmacy item 'Test Medication Alpha' (first row) is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[1]").nth(0)).to_be_visible(timeout=15000), "Pharmacy item 'Test Medication Alpha' (first row) is visible."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[2]/td[1]").nth(0).scroll_into_view_if_needed()
        # Assert: Pharmacy item 'Test Medication Alpha' (second row) is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[2]/td[1]").nth(0)).to_be_visible(timeout=15000), "Pharmacy item 'Test Medication Alpha' (second row) is visible."
        
        # --> Verify lot details are displayed
        # Assert: The first lot row displays the item name 'Test Medication Alpha'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[1]").nth(0)).to_have_text("Test Medication Alpha", timeout=15000), "The first lot row displays the item name 'Test Medication Alpha'."
        # Assert: The first lot row displays the lot number 'LOT-NEW-012'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[2]").nth(0)).to_have_text("LOT-NEW-012", timeout=15000), "The first lot row displays the lot number 'LOT-NEW-012'."
        # Assert: The first lot row shows quantity '1'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[5]").nth(0)).to_have_text("1", timeout=15000), "The first lot row shows quantity '1'."
        # Assert: The first lot row shows the expiry date '2027-07-03'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[7]").nth(0)).to_have_text("2027-07-03", timeout=15000), "The first lot row shows the expiry date '2027-07-03'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    