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
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and the 'Password' field with testesprite123, then click the 'SIGN IN' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and the 'Password' field with testesprite123, then click the 'SIGN IN' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com and the 'Password' field with testesprite123, then click the 'SIGN IN' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '2. SCHEDULING AND MEDICAL APPOINTMENTS' tile on the dashboard to open the appointment scheduling module.
        # 2. Scheduling and Medical Appointments button
        elem = page.get_by_role('button', name='2. Scheduling and Medical Appointments', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Novo Agendamento' button to open the New Appointment dialog.
        # Novo Agendamento button
        elem = page.get_by_role('button', name='Novo Agendamento', exact=True)
        await elem.click(timeout=10000)
        
        # -> Set the 'Horário' (time) field to '08:00' in the New Appointment dialog.
        # time field
        elem = page.locator('xpath=/html/body/div[4]/div/form/div[3]/div[2]/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("08:00")
        
        # -> Open the 'Médico' dropdown and select a doctor from the list (so specialty/availability can be set).
        # Selecionar... Dr. Adriano Lima - Ortopedia Dr... dropdown
        elem = page.locator('xpath=/html/body/div[4]/div/form/div[2]/div/select')
        await elem.click(timeout=10000)
        
        # -> Select 'Dr. Adriano Lima - Ortopedia' from the Médico dropdown in the New Appointment dialog.
        # Selecionar... Dr. Adriano Lima - Ortopedia Dr... dropdown
        elem = page.locator("xpath=/html/body/div[4]/div/form/div[2]/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Open the 'Paciente' dropdown and prepare to select an existing patient (for example 'Roberto de Oliveira Cruz').
        # Selecionar paciente... Roberto de Oliveira Cruz... dropdown
        elem = page.locator('xpath=/html/body/div[4]/div/form/div/select')
        await elem.click(timeout=10000)
        
        # -> Select 'Roberto de Oliveira Cruz - Particular' from the 'Paciente' dropdown and click the 'Criar Agendamento' button to save the appointment.
        # Selecionar paciente... Roberto de Oliveira Cruz... dropdown
        elem = page.locator("xpath=/html/body/div[4]/div/form/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select 'Roberto de Oliveira Cruz - Particular' from the 'Paciente' dropdown and click the 'Criar Agendamento' button to save the appointment.
        # Criar Agendamento button
        elem = page.get_by_role('button', name='Criar Agendamento', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the appointment appears on the agenda
        # Assert: The agenda shows an appointment at 08:00.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/table/tbody/tr[2]/td[1]").nth(0)).to_have_text("08:00", timeout=15000), "The agenda shows an appointment at 08:00."
        # Assert: The appointment card displays the patient name 'Roberto de Oliveira Cruz' on the agenda.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/table/tbody/tr[2]/td[2]").nth(0)).to_contain_text("Roberto de Oliveira Cruz", timeout=15000), "The appointment card displays the patient name 'Roberto de Oliveira Cruz' on the agenda."
        # Assert: The appointment card lists the specialty 'Clínica Geral' on the agenda.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/table/tbody/tr[2]/td[2]").nth(0)).to_contain_text("Cl\u00ednica Geral", timeout=15000), "The appointment card lists the specialty 'Cl\u00ednica Geral' on the agenda."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    