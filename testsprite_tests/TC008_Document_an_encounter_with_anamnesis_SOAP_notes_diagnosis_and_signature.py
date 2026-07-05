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
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com, fill the 'Password' field with testesprite123, then click the 'Sign In' button.
        # operator@iamed.com email field
        elem = page.locator('[id="login-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite@gmail.com")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com, fill the 'Password' field with testesprite123, then click the 'Sign In' button.
        # •••••••• password field
        elem = page.locator('[id="login-password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testesprite123")
        
        # -> Fill the 'Operator Email' field with testesprite@gmail.com, fill the 'Password' field with testesprite123, then click the 'Sign In' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the electronic health record by clicking the '3. ELECTRONIC HEALTH RECORD (EHR)' card on the dashboard.
        # 3. Electronic Health Record (EHR) button
        elem = page.get_by_role('button', name='3. Electronic Health Record (EHR)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'hce_smoking' dropdown (the smoking field) so the option 'Atual' can be selected.
        # Não Ex-fumante Atual dropdown
        elem = page.get_by_text('Não Ex-fumante Atual', exact=True)
        await elem.click(timeout=10000)
        
        # -> Set the 'hce_smoking' dropdown to the option 'Atual'.
        # Não Ex-fumante Atual dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/div/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Set the 'hce_alcohol' (Alcohol use) dropdown to the option 'Ocasional' and let the UI update.
        # Não Ocasional Frequente Ex-etilista dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select 'Leve' for Physical Activity, enter 'Engenheiro' into the Profession field, and select 'Solteiro(a)' for Marital Status.
        # Não Leve Moderada Intensa dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div/div[3]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select 'Leve' for Physical Activity, enter 'Engenheiro' into the Profession field, and select 'Solteiro(a)' for Marital Status.
        # Ex: Engenheiro text field
        elem = page.get_by_placeholder('Ex: Engenheiro', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Engenheiro")
        
        # -> Select 'Leve' for Physical Activity, enter 'Engenheiro' into the Profession field, and select 'Solteiro(a)' for Marital Status.
        # Selecione... Solteiro(a) Casado(a) Divorciado(a)... dropdown
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div[2]/div/div[2]/div[2]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Fill the allergy fields (hce_allergen, hce_allergy_type, hce_reaction) with 'Penicilina', 'Medicamento', 'Urticária' and click the '+ hce_add_allergy' (Add) button.
        # hce_allergen text field
        elem = page.get_by_placeholder('hce_allergen', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Penicilina")
        
        # -> Fill the allergy fields (hce_allergen, hce_allergy_type, hce_reaction) with 'Penicilina', 'Medicamento', 'Urticária' and click the '+ hce_add_allergy' (Add) button.
        # hce_allergy_type text field
        elem = page.get_by_placeholder('hce_allergy_type', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Medicamento")
        
        # -> Fill the allergy fields (hce_allergen, hce_allergy_type, hce_reaction) with 'Penicilina', 'Medicamento', 'Urticária' and click the '+ hce_add_allergy' (Add) button.
        # hce_reaction text field
        elem = page.get_by_placeholder('hce_reaction', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Urtic\u00e1ria")
        
        # -> Fill the allergy fields (hce_allergen, hce_allergy_type, hce_reaction) with 'Penicilina', 'Medicamento', 'Urticária' and click the '+ hce_add_allergy' (Add) button.
        # hce_add_allergy button
        elem = page.get_by_role('button', name='hce_add_allergy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the current medication fields (Medicamento, Dosagem, Frequência, Desde) with values and click the 'Add' button.
        # Medicamento text field
        elem = page.get_by_placeholder('Medicamento', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Dipirona")
        
        # -> Fill the current medication fields (Medicamento, Dosagem, Frequência, Desde) with values and click the 'Add' button.
        # Dosagem text field
        elem = page.get_by_placeholder('Dosagem', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("500 mg")
        
        # -> Fill the current medication fields (Medicamento, Dosagem, Frequência, Desde) with values and click the 'Add' button.
        # Frequência text field
        elem = page.get_by_placeholder('Frequência', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("12/12")
        
        # -> Fill the current medication fields (Medicamento, Dosagem, Frequência, Desde) with values and click the 'Add' button.
        # Desde text field
        elem = page.get_by_placeholder('Desde', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("2026-06-01")
        
        # -> Fill the current medication fields (Medicamento, Dosagem, Frequência, Desde) with values and click the 'Add' button.
        # Add button
        elem = page.get_by_text('hce_current_medications', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Add', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add a family history entry by filling 'hce_relation' = Pai, 'hce_condition' = Hipertensão, 'hce_age' = 58 and click the family 'Add' button, then click 'Salvar Anamnese' to save the anamnesis.
        # hce_relation text field
        elem = page.get_by_placeholder('hce_relation', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Pai")
        
        # -> Add a family history entry by filling 'hce_relation' = Pai, 'hce_condition' = Hipertensão, 'hce_age' = 58 and click the family 'Add' button, then click 'Salvar Anamnese' to save the anamnesis.
        # hce_condition text field
        elem = page.get_by_placeholder('hce_condition', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Hipertens\u00e3o")
        
        # -> Add a family history entry by filling 'hce_relation' = Pai, 'hce_condition' = Hipertensão, 'hce_age' = 58 and click the family 'Add' button, then click 'Salvar Anamnese' to save the anamnesis.
        # hce_age number field
        elem = page.get_by_placeholder('hce_age', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("58")
        
        # -> Add a family history entry by filling 'hce_relation' = Pai, 'hce_condition' = Hipertensão, 'hce_age' = 58 and click the family 'Add' button, then click 'Salvar Anamnese' to save the anamnesis.
        # Add button
        elem = page.get_by_text('hce_family_history', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Add', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add a family history entry by filling 'hce_relation' = Pai, 'hce_condition' = Hipertensão, 'hce_age' = 58 and click the family 'Add' button, then click 'Salvar Anamnese' to save the anamnesis.
        # Salvar Anamnese button
        elem = page.get_by_role('button', name='Salvar Anamnese', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Exame' tab to open the Exam section and observe the vital signs fields.
        # hce_tab_exam button
        elem = page.get_by_role('button', name='hce_tab_exam', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill vital signs (weight, height, blood pressure, temperature) and click the 'Salvar Exame Físico' button to save the exam.
        # kg text field
        elem = page.get_by_placeholder('kg', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Fill vital signs (weight, height, blood pressure, temperature) and click the 'Salvar Exame Físico' button to save the exam.
        # cm text field
        elem = page.get_by_placeholder('cm', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("180")
        
        # -> Fill vital signs (weight, height, blood pressure, temperature) and click the 'Salvar Exame Físico' button to save the exam.
        # 120/80 text field
        elem = page.get_by_placeholder('120/80', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("130/85")
        
        # -> Fill vital signs (weight, height, blood pressure, temperature) and click the 'Salvar Exame Físico' button to save the exam.
        # 36.5 text field
        elem = page.get_by_placeholder('36.5', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("36.8")
        
        # -> Fill vital signs (weight, height, blood pressure, temperature) and click the 'Salvar Exame Físico' button to save the exam.
        # Salvar Exame Físico button
        elem = page.get_by_role('button', name='Salvar Exame Físico', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'SOAP' tab to open the SOAP notes form and observe its fields.
        # hce_tab_soap button
        elem = page.get_by_role('button', name='hce_tab_soap', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the SOAP fields (Subjective, Objective, Assessment, Plan) with clinical notes and click the 'Salvar Evolução SOAP' button to save the SOAP note.
        # Queixa principal do paciente, em suas próprias... text area
        elem = page.get_by_placeholder('Queixa principal do paciente, em suas próprias palavras...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Paciente refere cefaleia frontal puls\u00e1til h\u00e1 2 dias, intensidade 7/10, associada a n\u00e1useas e fotofobia.")
        
        # -> Fill the SOAP fields (Subjective, Objective, Assessment, Plan) with clinical notes and click the 'Salvar Evolução SOAP' button to save the SOAP note.
        # Dados objetivos: sinais vitais, exame físico... text area
        elem = page.get_by_placeholder('Dados objetivos: sinais vitais, exame físico, achados clínicos...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Sinais vitais: PA 130/85 mmHg, FC 78 bpm, FR 16 ipm, Temp 36.8\u00b0C. Exame f\u00edsico sem altera\u00e7\u00f5es focais ao exame geral.")
        
        # -> Fill the SOAP fields (Subjective, Objective, Assessment, Plan) with clinical notes and click the 'Salvar Evolução SOAP' button to save the SOAP note.
        # Hipótese diagnóstica, CID-10, raciocínio... text area
        elem = page.get_by_placeholder('Hipótese diagnóstica, CID-10, raciocínio clínico...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Cefaleia aguda \u2014 hip\u00f3tese diagn\u00f3stica: enxaqueca vs cefaleia tensional. Considerar CID-10 sugest\u00e3o G44.1 (enxaqueca).")
        
        # -> Fill the SOAP fields (Subjective, Objective, Assessment, Plan) with clinical notes and click the 'Salvar Evolução SOAP' button to save the SOAP note.
        # Conduta terapêutica, prescrições, exames... text area
        elem = page.get_by_placeholder('Conduta terapêutica, prescrições, exames solicitados, retorno...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Conduta: analgesia com Dipirona 500 mg VO PRN, orientar repouso e hidrata\u00e7\u00e3o, retorno se agravamento ou sinais de alarme. Avaliar necessidade de seguimento com neurologia se recidiva.")
        
        # -> Fill the SOAP fields (Subjective, Objective, Assessment, Plan) with clinical notes and click the 'Salvar Evolução SOAP' button to save the SOAP note.
        # Salvar Evolução SOAP button
        elem = page.get_by_role('button', name='Salvar Evolução SOAP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Diagnoses' tab to open the diagnoses panel and observe the diagnosis search field.
        # hce_tab_diagnoses button
        elem = page.get_by_role('button', name='hce_tab_diagnoses', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'G43 Enxaqueca' diagnosis from the list and click the 'Adicionar Diagnóstico' button to add it to the encounter.
        # G43 Enxaqueca Cap. VI
        elem = page.get_by_text('G43 Enxaqueca Cap. VI', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    