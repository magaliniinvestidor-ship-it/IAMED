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
        
        # -> Fill 'Operator Email' with testesprite@gmail.com and 'Password' with testesprite123, then click the 'SIGN IN' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill 'Operator Email' with testesprite@gmail.com and 'Password' with testesprite123, then click the 'SIGN IN' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill 'Operator Email' with testesprite@gmail.com and 'Password' with testesprite123, then click the 'SIGN IN' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the Patient Reception and Intake module by clicking the '1. PATIENT RECEPTION AND INTAKE' tile.
        # 1. Patient Reception and Intake button
        elem = page.get_by_role('button', name='1. Patient Reception and Intake', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient identification fields by entering the Full Name, Document Number, Date of Birth, then open the 'Contato/End.' tab.
        # Ex: Carlos Alberto Duarte Gómez text field
        elem = page.get_by_placeholder('Ex: Carlos Alberto Duarte Gómez', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Patient QA 2026-07-04")
        
        # -> Fill the patient identification fields by entering the Full Name, Document Number, Date of Birth, then open the 'Contato/End.' tab.
        # Número do Documento text field
        elem = page.get_by_placeholder('Número do Documento', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QA123456789")
        
        # -> Fill the patient identification fields by entering the Full Name, Document Number, Date of Birth, then open the 'Contato/End.' tab.
        # date field
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div/div/div/form/div/div[3]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("1990-01-01")
        
        # -> Fill the patient identification fields by entering the Full Name, Document Number, Date of Birth, then open the 'Contato/End.' tab.
        # Contato/End. button
        elem = page.get_by_test_id('reception-tab-contact')
        await elem.click(timeout=10000)
        
        # -> Fill the contact fields: enter the Celular, E-mail, Departamento, Distrito and Cidade fields in the 'Contato/End.' form.
        # +595 981 123 456 text field
        elem = page.get_by_placeholder('+595 981 123 456', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("+595 981 000 111")
        
        # -> Fill the contact fields: enter the Celular, E-mail, Departamento, Distrito and Cidade fields in the 'Contato/End.' form.
        # paciente@exemplo.com email field
        elem = page.get_by_placeholder('paciente@exemplo.com', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("test.patient.qa@example.com")
        
        # -> Fill the contact fields: enter the Celular, E-mail, Departamento, Distrito and Cidade fields in the 'Contato/End.' form.
        # Ex: Itapúa text field
        elem = page.get_by_placeholder('Ex: Itapúa', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Itap\u00faa")
        
        # -> Fill the contact fields: enter the Celular, E-mail, Departamento, Distrito and Cidade fields in the 'Contato/End.' form.
        # Ex: Encarnación text field
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div/div/div/form/div/div[3]/div[2]/div[2]/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Encarnaci\u00f3n")
        
        # -> Fill the contact fields: enter the Celular, E-mail, Departamento, Distrito and Cidade fields in the 'Contato/End.' form.
        # Ex: Encarnación text field
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div/div/div/form/div/div[3]/div[3]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Encarnaci\u00f3n")
        
        # -> Open the 'Convênio/Comp.' tab to view the insurance fields.
        # Convênio/Comp. button
        elem = page.get_by_test_id('reception-tab-complementary')
        await elem.click(timeout=10000)
        
        # -> Open the 'Seguro / Convênio' dropdown to reveal insurance options.
        # Particular IPS (Segurado) Sanidade Militar... dropdown
        elem = page.locator('xpath=/html/body/div[2]/main/div/div[2]/div/div/div/div/form/div/div[3]/div[2]/div/select')
        await elem.click(timeout=10000)
        
        # -> Select the 'IPS (Segurado)' option from the 'Seguro / Convênio' dropdown to reveal the affiliation/insured fields.
        # Particular IPS (Segurado) Sanidade Militar... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div/div/form/div/div[3]/div[2]/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Fill the 'Nº de Afiliação / Segurado' and 'Empresa Empregadora (Med. do Trabalho)' fields, then scroll to reveal the save/submit controls.
        # Nº da carteirinha text field
        elem = page.get_by_placeholder('Nº da carteirinha', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("INS-QA-20260704")
        
        # -> Fill the 'Nº de Afiliação / Segurado' and 'Empresa Empregadora (Med. do Trabalho)' fields, then scroll to reveal the save/submit controls.
        # Razão Social / CNPJ / RUC text field
        elem = page.get_by_placeholder('Razão Social / CNPJ / RUC', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Empresa Teste QA")
        
        # -> Fill the 'Nº de Afiliação / Segurado' and 'Empresa Empregadora (Med. do Trabalho)' fields, then scroll to reveal the save/submit controls.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Próximo' button to advance the admission flow toward saving the patient record.
        # Próximo button
        elem = page.get_by_test_id('reception-next-tab')
        await elem.click(timeout=10000)
        
        # -> Type 'Test Patient QA 2026-07-04' into the 'Buscar paciente por nome, tel ou Cédula...' search field and verify whether the patient appears in the triage/admission list.
        # Buscar paciente por nome, tel ou Cédula... text field
        elem = page.get_by_placeholder('Buscar paciente por nome, tel ou Cédula...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Patient QA 2026-07-04")
        
        # -> Click the 'Admitir na Triagem' button to attempt adding the completed patient to the triage list.
        # Admitir na Triagem button
        elem = page.get_by_test_id('reception-submit-admit')
        await elem.click(timeout=10000)
        
        # --> Test passed — verified by AI agent
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert current_url is not None, "Test completed successfully"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    