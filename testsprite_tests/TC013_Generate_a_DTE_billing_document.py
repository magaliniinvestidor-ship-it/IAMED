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
        
        # -> Fill 'testesprite@gmail.com' into the 'Operator Email' field and sign in using the login form.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill 'testesprite@gmail.com' into the 'Operator Email' field and sign in using the login form.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill 'testesprite@gmail.com' into the 'Operator Email' field and sign in using the login form.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '5. ELECTRONIC INVOICING & BILLING' tile to open Electronic Billing.
        # 5. Electronic Invoicing & Billing button
        elem = page.get_by_role('button', name='5. Electronic Invoicing & Billing', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Emitir Novo DTE' button to open the New DTE form.
        # Emitir Novo DTE button
        elem = page.get_by_role('button', name='Emitir Novo DTE', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'explore-test-123' into the 'Paciente / Receptor' field and wait for the suggestions dropdown to appear.
        # Nome do paciente text field
        elem = page.get_by_placeholder('Nome do paciente', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("explore-test-123")
        
        # -> Click the 'Adicionar' button to add the selected procedure, then click 'Assinar Digitalmente & Transmitir ao SIFEN' to sign and transmit the new DTE.
        # Adicionar button
        elem = page.get_by_role('button', name='Adicionar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Adicionar' button to add the selected procedure, then click 'Assinar Digitalmente & Transmitir ao SIFEN' to sign and transmit the new DTE.
        # Assinar Digitalmente & Transmitir ao SIFEN button
        elem = page.get_by_role('button', name='Assinar Digitalmente & Transmitir ao SIFEN', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Ver XML' button for the newly created document 001-001-0000014 to open its XML and verify it contains CDC data.
        # Ver XML button
        elem = page.get_by_text('001-001-0000014', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Ver XML', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the new billing document is created with XML and CDC data
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div").nth(0).scroll_into_view_if_needed()
        # Assert: The signed XML modal is visible for the created DTE.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div").nth(0)).to_be_visible(timeout=15000), "The signed XML modal is visible for the created DTE."
        # Assert: The XML includes the CDC/security code dCodSeg = 92786864.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/pre").nth(0)).to_contain_text("<dCodSeg>92786864</dCodSeg>", timeout=15000), "The XML includes the CDC/security code dCodSeg = 92786864."
        # Assert: The XML contains the document series/number 001-001-0000014.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div[2]/div/pre").nth(0)).to_contain_text("<dSerieNum>001-001-0000014</dSerieNum>", timeout=15000), "The XML contains the document series/number 001-001-0000014."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    