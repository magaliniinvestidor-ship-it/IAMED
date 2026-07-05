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
        
        # -> Fill the Operator Email with 'testesprite@gmail.com' and Password with 'testesprite123', then click the 'Sign In' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill the Operator Email with 'testesprite@gmail.com' and Password with 'testesprite123', then click the 'Sign In' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill the Operator Email with 'testesprite@gmail.com' and Password with 'testesprite123', then click the 'Sign In' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '7. INVENTORY AND PHARMACOVIGILANCE' module tile on the Modular Applications Dashboard.
        # 7. Inventory and Pharmacovigilance button
        elem = page.get_by_role('button', name='7. Inventory and Pharmacovigilance', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Inventory' button to open the Inventory section so a new inventory count can be started.
        # Inventory button
        elem = page.get_by_text('New Item', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Inventory', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Select...' dropdown in the Register Count form to choose an item for the inventory count.
        # Select... Test Medication Alpha ( Total : 1 )... dropdown
        elem = page.get_by_text('Select... Test Medication Alpha (Total: 1) Test Medication Alpha (Total: 10)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the item "Test Medication Alpha (Total: 1)" from the Name dropdown in the Register Count form.
        # Select... Test Medication Alpha ( Total : 1 )... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div/div[2]/div/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select the lot 'LOT-NEW-012 ( Qty : 1 , Expiry... )' from the 'Lot' dropdown in the Register Count form.
        # Select... LOT-NEW-012 ( Qty : 1 , Expiry... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div/div[2]/div/div/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select 'LOT-NEW-012 (Qty: 1, Expiry: 2027-07-03)' from the Lot dropdown in the Register Count form.
        # Select... LOT-NEW-012 ( Qty : 1 , Expiry... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div/div[2]/div/div/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Enter '1' into the 'Counted Quantity' field and click the 'Register Count' button.
        # 0 number field
        elem = page.get_by_placeholder('0', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("1")
        
        # -> Enter '1' into the 'Counted Quantity' field and click the 'Register Count' button.
        # Register Count button
        elem = page.get_by_role('button', name='Register Count', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Items' button in the Inventory header to open the Items page so the 'Test Medication Alpha' record can be located and its stock verified.
        # Items button
        elem = page.get_by_test_id('pharm-tab-items')
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Medication Alpha' item row that shows Total = 1 to view item details and verify the counted stock (lot-level quantity) is 1.
        # Test Medication Alpha
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/div/table/tbody/tr/td')
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Medication Alpha' item row that shows Total = 1 by clicking its name in the first row to view item details and verify lot-level counted stock.
        # Test Medication Alpha
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/div/table/tbody/tr/td')
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Medication Alpha' item row that shows Total = 1 by clicking the first item row so the item details and lot-level quantities can be verified.
        # Test Medication Alpha Over the Counter...
        elem = page.get_by_text('Test Medication Alpha Over the Counter DIN-123-ALPHA 1 10 1', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Medication Alpha' item row that shows Total = 1 to view item details and verify lot-level quantities.
        # Test Medication Alpha
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/div/table/tbody/tr/td')
        await elem.click(timeout=10000)
        
        # -> Open the 'Test Medication Alpha' row that shows Total = 1 by clicking the row to view lot-level quantities.
        # Test Medication Alpha Over the Counter...
        elem = page.get_by_text('Test Medication Alpha Over the Counter DIN-123-ALPHA 1 10 1', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Test Medication Alpha' row that shows '1' in the Total column to open the item's details and inspect lot-level quantities.
        # Test Medication Alpha Over the Counter...
        elem = page.get_by_text('Test Medication Alpha Over the Counter DIN-123-ALPHA 1 10 1', exact=True)
        await elem.click(timeout=10000)
        
        # -> Use the 'Search by name, lot, DINAVISA registration...' search field to filter for 'Test Medication Alpha' and then open the item row that shows Total = 1 to inspect lot-level quantities.
        # Search by name, lot, DINAVISA registration... text field
        elem = page.get_by_placeholder('Search by name, lot, DINAVISA registration...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Medication Alpha")
        
        # --> Assertions to verify final state
        
        # --> Verify the counted stock is reflected in the item records
        # Assert: The item's Total column for Test Medication Alpha displays '1'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/div/table/tbody/tr[1]/td[4]").nth(0)).to_have_text("1", timeout=15000), "The item's Total column for Test Medication Alpha displays '1'."
        # Assert: The item's lot-level quantity for Test Medication Alpha displays '1'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/div[2]/div/table/tbody/tr[1]/td[7]").nth(0)).to_have_text("1", timeout=15000), "The item's lot-level quantity for Test Medication Alpha displays '1'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    