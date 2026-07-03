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
        await page.goto("https://iamedcenter.netlify.app/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Operator Email' and 'Password' fields with the provided credentials and click the 'SIGN IN' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill the 'Operator Email' and 'Password' fields with the provided credentials and click the 'SIGN IN' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill the 'Operator Email' and 'Password' fields with the provided credentials and click the 'SIGN IN' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '1. PATIENT RECEPTION AND INTAKE' module card on the dashboard to open the Recepção e Admissão module page.
        # 1. Patient Reception and Intake button
        elem = page.get_by_role('button', name='1. Patient Reception and Intake', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Nome Completo' field with 'Test Patient QA', then fill 'Número Doc' and click the 'Contato/End.' tab to reveal phone/contact fields.
        # Ex: Carlos Alberto Duarte Gómez text field
        elem = page.get_by_placeholder('Ex: Carlos Alberto Duarte Gómez', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Patient QA")
        
        # -> Fill the 'Nome Completo' field with 'Test Patient QA', then fill 'Número Doc' and click the 'Contato/End.' tab to reveal phone/contact fields.
        # Número do Documento text field
        elem = page.get_by_placeholder('Número do Documento', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("12345678")
        
        # -> Fill the 'Nome Completo' field with 'Test Patient QA', then fill 'Número Doc' and click the 'Contato/End.' tab to reveal phone/contact fields.
        # Contato/End. button
        elem = page.get_by_test_id('reception-tab-contact')
        await elem.click(timeout=10000)
        
        # -> Fill the 'Celular (+595)' field with a phone number and click the 'Próximo' button to submit the patient registration.
        # +595 981 123 456 text field
        elem = page.get_by_placeholder('+595 981 123 456', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+595 981 000 111")
        
        # -> Fill the 'Celular (+595)' field with a phone number and click the 'Próximo' button to submit the patient registration.
        # Validar WhatsApp button
        elem = page.get_by_role('button', name='Validar WhatsApp', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Celular (+595)' field with a phone number and click the 'Próximo' button to submit the patient registration.
        # Próximo button
        elem = page.get_by_test_id('reception-next-tab')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The Recepção module page is displayed with a form to register patients
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[1]/div[1]/div[2]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: Expected the 'Identificação' tab to be visible on the Recepção module page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[1]/div[1]/div[2]/button[1]").nth(0)).to_be_visible(timeout=15000), "Expected the 'Identifica\u00e7\u00e3o' tab to be visible on the Recep\u00e7\u00e3o module page."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[1]/div[1]/form/div[2]/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: Expected the 'Próximo' (Next) button of the patient registration form to be visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[1]/div[1]/form/div[2]/button[2]").nth(0)).to_be_visible(timeout=15000), "Expected the 'Pr\u00f3ximo' (Next) button of the patient registration form to be visible."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div[2]/div[1]/input").nth(0).scroll_into_view_if_needed()
        # Assert: Expected the patient search input ('Buscar paciente por nome, tel ou Cédula...') to be visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div[2]/div[1]/input").nth(0)).to_be_visible(timeout=15000), "Expected the patient search input ('Buscar paciente por nome, tel ou C\u00e9dula...') to be visible."
        
        # --> A success message appears or the new patient is added to the patient list
        # Assert: Expected the patient list to include the new patient 'Test Patient QA'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div[3]/div[1]/div[1]/div[1]").nth(0)).to_contain_text("Test Patient QA", timeout=15000), "Expected the patient list to include the new patient 'Test Patient QA'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    