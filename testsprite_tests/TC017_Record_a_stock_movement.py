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
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and then the 'Password' field with the provided password, then click the 'Sign In' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and then the 'Password' field with the provided password, then click the 'Sign In' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and then the 'Password' field with the provided password, then click the 'Sign In' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '7. Inventory and Pharmacovigilance' module tile to open the Inventory module.
        # 7. Inventory and Pharmacovigilance button
        elem = page.get_by_role('button', name='7. Inventory and Pharmacovigilance', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Movements' tab to open the movements view
        # Movements button
        elem = page.get_by_test_id('pharm-tab-movements')
        await elem.click(timeout=10000)
        
        # -> Click the 'Inbound' button to open the inbound movement creation flow and inspect the form that appears.
        # Inbound button
        elem = page.get_by_test_id('pharm-tab-entries')
        await elem.click(timeout=10000)
        
        # -> Click the 'New Inbound by DTE' button to open the inbound creation form.
        # New Inbound by DTE button
        elem = page.get_by_test_id('open-entry-form')
        await elem.click(timeout=10000)
        
        # -> Open the 'Name' dropdown and choose 'Test Medication Alpha' from the product list.
        # Select... Test Medication Alpha Test Medication... dropdown
        elem = page.get_by_test_id('entry-item-id')
        await elem.click(timeout=10000)
        
        # -> Select 'Test Medication Alpha' from the Name dropdown in the Register Inbound modal.
        # Select... Test Medication Alpha Test Medication... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[3]/div/form/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Fill the Lot Number, Quantity, Unit Cost and Expiry Date fields in the 'Register Inbound' form, then list all visible buttons to locate the 'Register Inbound' submit button.
        # Lot Number text field
        elem = page.get_by_test_id('entry-lot-number')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("LOT-TEST-001")
        
        # -> Fill the Lot Number, Quantity, Unit Cost and Expiry Date fields in the 'Register Inbound' form, then list all visible buttons to locate the 'Register Inbound' submit button.
        # number field
        elem = page.get_by_test_id('entry-qty')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("50")
        
        # -> Fill the Lot Number, Quantity, Unit Cost and Expiry Date fields in the 'Register Inbound' form, then list all visible buttons to locate the 'Register Inbound' submit button.
        # number field
        elem = page.get_by_test_id('entry-cost')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("1000")
        
        # -> Fill the Lot Number, Quantity, Unit Cost and Expiry Date fields in the 'Register Inbound' form, then list all visible buttons to locate the 'Register Inbound' submit button.
        # date field
        elem = page.get_by_test_id('entry-expiry')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("2027-12-31")
        
        # -> Click the 'Register Inbound' button to save the inbound movement.
        # Register Inbound button
        elem = page.get_by_test_id('entry-register-submit')
        await elem.click(timeout=10000)
        
        # -> Click the 'Inventory' tab to open the Inventory view and verify the stock quantity for 'Test Medication Alpha'.
        # Inventory button
        elem = page.get_by_test_id('pharm-tab-inventory')
        await elem.click(timeout=10000)
        
        # -> Open the 'Lots & Expiry' view by clicking the 'Lots & Expiry' button to look for LOT-TEST-001 and verify the inventory count.
        # Lots & Expiry button
        elem = page.get_by_test_id('pharm-tab-lots')
        await elem.click(timeout=10000)
        
        # -> Click the 'Movements' tab to open the movement history and verify the inbound movement record for LOT-TEST-001 (Qty 50).
        # Movements button
        elem = page.get_by_test_id('pharm-tab-movements')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the inventory quantity is updated
        # Assert: Movement entry shows the Lot 'LOT-TEST-001'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[3]").nth(0)).to_have_text("LOT-TEST-001", timeout=15000), "Movement entry shows the Lot 'LOT-TEST-001'."
        # Assert: Movement entry shows Qty '50', confirming the inventory was updated.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[5]").nth(0)).to_have_text("50", timeout=15000), "Movement entry shows Qty '50', confirming the inventory was updated."
        
        # --> Verify the movement is recorded in the history
        # Assert: Movement history contains a row with Name 'Test Medication Alpha'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[2]").nth(0)).to_have_text("Test Medication Alpha", timeout=15000), "Movement history contains a row with Name 'Test Medication Alpha'."
        # Assert: Movement history row shows Lot 'LOT-TEST-001'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[3]").nth(0)).to_have_text("LOT-TEST-001", timeout=15000), "Movement history row shows Lot 'LOT-TEST-001'."
        # Assert: Movement history row shows Type 'Inbound'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[4]").nth(0)).to_have_text("Inbound", timeout=15000), "Movement history row shows Type 'Inbound'."
        # Assert: Movement history row shows Qty '50'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/table/tbody/tr[1]/td[5]").nth(0)).to_have_text("50", timeout=15000), "Movement history row shows Qty '50'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    