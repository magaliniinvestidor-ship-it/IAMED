-- ============================================================
-- SNOMED-CT correção de seed (bug de deduplicação do v1)
-- ============================================================
-- O seed v1 (20260812_snomed_ct.sql) usava concept_ids repetidos
-- para conceitos distintos e o DISTINCT ON (concept_id) descartou
-- 64 conceitos. Estes são reinseridos aqui com IDs placeholder
-- sequenciais únicos (prefixo 1019). Os 9 medicamentos que o v2 já
-- cobre (Ibuprofeno, Metformina, etc.) não são duplicados.
--
-- Também corrige:
--   • Conflito v1×v2: 39579001 era 'Pharyngitis' (v1) e 'Anaphylaxis'
--     (v2, ID oficial correto). A Faringite recebe seu ID oficial
--     363746003, liberando 39579001 para a Anafilaxia.
--   • Inconsistência de eixo da rinite alérgica (v1=disorder,
--     v2=finding) — alinhado para 'disorder' (usado no diagnóstico).
-- ============================================================

-- 1) Corrigir o ID da Faringite (conflito com Anaphylaxis no v2)
-- Se o v2 JÁ rodou, a linha 39579001 foi sobrescrita pela Anafilaxia —
-- então a Faringite precisa ser INSERIDA com seu ID oficial (363746003).
-- Se o v2 ainda NÃO rodou, o UPDATE move a Faringite de 39579001.
-- As duas linhas juntas tornam a migration idempotente nos dois cenários.
UPDATE public.snomed_concepts
SET concept_id = 363746003,
    updated_at = timezone('utc'::text, now())
WHERE concept_id = 39579001
  AND preferred_term = 'Pharyngitis';

INSERT INTO public.snomed_concepts
  (concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis)
VALUES
  (363746003, 'Pharyngitis', 'Faringite', 'Faringitis', 'Pharyngitis', 'J02', 'disorder')
ON CONFLICT (concept_id) DO NOTHING;

-- 2) Reinserir os conceitos perdidos pelo DISTINCT ON do v1
INSERT INTO public.snomed_concepts
  (concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis)
VALUES
  (1019000001, 'Stroke', 'AVC / Acidente vascular cerebral', 'ACV / Accidente cerebrovascular', 'Stroke', 'I64', 'disorder'),
  (1019000002, 'Parkinson disease', 'Doença de Parkinson', 'Enfermedad de Parkinson', 'Parkinson disease', 'G20', 'disorder'),
  (1019000003, 'Gastroesophageal reflux', 'Refluxo gastroesofágico', 'Reflujo gastroesofágico', 'Gastroesophageal reflux', 'K21', 'disorder'),
  (1019000004, 'Panic disorder', 'Transtorno do pânico', 'Trastorno de pánico', 'Panic disorder', 'F41', 'disorder'),
  (1019000005, 'Constipation', 'Constipação', 'Estreñimiento', 'Constipation', 'K59', 'finding'),
  (1019000006, 'Cirrhosis of liver', 'Cirrose hepática', 'Cirrosis hepática', 'Cirrhosis of liver', 'K74', 'disorder'),
  (1019000007, 'Anemia in pregnancy', 'Anemia na gestação', 'Anemia en el embarazo', 'Anemia in pregnancy', 'O99', 'disorder'),
  (1019000008, 'Conjunctivitis', 'Conjuntivite', 'Conjuntivitis', 'Conjunctivitis', 'H10', 'disorder'),
  (1019000009, 'Inflammatory disorder', 'Doença inflamatória', 'Trastorno inflamatorio', 'Inflammatory disorder', 'M79', 'disorder'),
  (1019000010, 'Hemorrhoids', 'Hemorroidas', 'Hemorroides', 'Hemorrhoids', 'I84', 'disorder'),
  (1019000011, 'Fungal infection', 'Micoses', 'Micosis', 'Fungal infection', 'B35', 'disorder'),
  (1019000012, 'Dermatitis', 'Dermatite', 'Dermatitis', 'Dermatitis', 'L30', 'disorder'),
  (1019000013, 'Eczema', 'Eczema', 'Eccema', 'Eczema', 'L20', 'disorder'),
  (1019000014, 'Gestational diabetes', 'Diabetes gestacional', 'Diabetes gestacional', 'Gestational diabetes', 'O24', 'disorder'),
  (1019000015, 'Preeclampsia', 'Pré-eclâmpsia', 'Preeclampsia', 'Preeclampsia', 'O14', 'disorder'),
  (1019000016, 'Eclampsia', 'Eclâmpsia', 'Eclampsia', 'Eclampsia', 'O15', 'disorder'),
  (1019000017, 'Spontaneous abortion', 'Aborto espontâneo', 'Aborto espontáneo', 'Spontaneous abortion', 'O03', 'disorder'),
  (1019000018, 'Postpartum hemorrhage', 'Hemorragia pós-parto', 'Hemorragia posparto', 'Postpartum hemorrhage', 'O72', 'disorder'),
  (1019000019, 'Premature birth', 'Parto prematuro', 'Parto prematuro', 'Premature birth', 'O60', 'disorder'),
  (1019000020, 'Ectopic pregnancy', 'Gravidez ectópica', 'Embarazo ectópico', 'Ectopic pregnancy', 'O00', 'disorder'),
  (1019000021, 'Placenta previa', 'Placenta prévia', 'Placenta previa', 'Placenta previa', 'O44', 'disorder'),
  (1019000022, 'Placental abruption', 'Descolamento prematuro da placenta', 'Desprendimiento prematuro de placenta', 'Placental abruption', 'O45', 'disorder'),
  (1019000023, 'Depression in pregnancy', 'Depressão na gestação', 'Depresión en el embarazo', 'Depression in pregnancy', 'O99', 'disorder'),
  (1019000024, 'Prolonged pregnancy', 'Gestação prolongada', 'Embarazo prolongado', 'Prolonged pregnancy', 'O48', 'disorder'),
  (1019000025, 'Prostate carcinoma', 'Carcinoma de próstata', 'Carcinoma de próstata', 'Prostate carcinoma', 'C61', 'disorder'),
  (1019000026, 'Colorectal carcinoma', 'Carcinoma colorretal', 'Carcinoma colorrectal', 'Colorectal carcinoma', 'C18', 'disorder'),
  (1019000027, 'Skin carcinoma', 'Carcinoma de pele', 'Carcinoma de piel', 'Skin carcinoma', 'C44', 'disorder'),
  (1019000028, 'Thyroid carcinoma', 'Carcinoma de tireoide', 'Carcinoma de tiroides', 'Thyroid carcinoma', 'C73', 'disorder'),
  (1019000029, 'Bronchitis', 'Bronquite', 'Bronquitis', 'Bronchitis', 'J20', 'disorder'),
  (1019000030, 'Influenza', 'Influenza / Gripe', 'Influenza / Gripe', 'Influenza', 'J10', 'disorder'),
  (1019000031, 'Acute respiratory infection', 'Infecção respiratória aguda', 'Infección respiratoria aguda', 'Acute respiratory infection', 'J22', 'disorder'),
  (1019000032, 'COVID-19', 'COVID-19', 'COVID-19', 'COVID-19', 'U07', 'disorder'),
  (1019000042, 'Measles', 'Sarampo', 'Sarampión', 'Measles', 'B05', 'disorder'),
  (1019000043, 'Syphilis', 'Sífilis', 'Sífilis', 'Syphilis', 'A53', 'disorder'),
  (1019000044, 'HIV infection', 'Infecção por HIV', 'Infección por VIH', 'HIV infection', 'B20', 'disorder'),
  (1019000045, 'Cholera', 'Cólera', 'Cólera', 'Cholera', 'A00', 'disorder'),
  (1019000046, 'Dengue', 'Dengue', 'Dengue', 'Dengue', 'A90', 'disorder'),
  (1019000047, 'Malaria', 'Malária', 'Malaria', 'Malaria', 'B54', 'disorder'),
  (1019000048, 'Leishmaniasis', 'Leishmaniose', 'Leishmaniasis', 'Leishmaniasis', 'B55', 'disorder'),
  (1019000049, 'Chagas disease', 'Doença de Chagas', 'Enfermedad de Chagas', 'Chagas disease', 'B57', 'disorder'),
  (1019000050, 'Yellow fever', 'Febre amarela', 'Fiebre amarilla', 'Yellow fever', 'A95', 'disorder'),
  (1019000051, 'Psoriasis', 'Psoríase', 'Psoriasis', 'Psoriasis', 'L40', 'disorder'),
  (1019000052, 'Anemia in newborn', 'Anemia neonatal', 'Anemia neonatal', 'Anemia in newborn', 'P61', 'disorder'),
  (1019000053, 'Jaundice in newborn', 'Icterícia neonatal', 'Ictericia neonatal', 'Jaundice in newborn', 'P59', 'disorder'),
  (1019000054, 'Neonatal sepsis', 'Sepse neonatal', 'Sepsis neonatal', 'Neonatal sepsis', 'P36', 'disorder'),
  (1019000055, 'Cesarean section', 'Cesárea', 'Cesárea', 'Cesarean section', 'O82', 'procedure'),
  (1019000056, 'Hysterectomy', 'Histerectomia', 'Histerectomía', 'Hysterectomy', 'Y83', 'procedure'),
  (1019000057, 'Mastectomy', 'Mastectomia', 'Mastectomía', 'Mastectomy', 'Y83', 'procedure'),
  (1019000058, 'Gastrectomy', 'Gastrectomia', 'Gastrectomía', 'Gastrectomy', 'Y83', 'procedure'),
  (1019000059, 'Colectomy', 'Colectomia', 'Colectomía', 'Colectomy', 'Y83', 'procedure'),
  (1019000060, 'Cholecystectomy with laparoscopy', 'Colecistectomia por laparoscopia', 'Colecistectomía por laparoscopia', 'Laparoscopic cholecystectomy', 'Y83', 'procedure'),
  (1019000061, 'Hernia repair', 'Correção de hérnia', 'Reparación de hernia', 'Hernia repair', 'Y83', 'procedure'),
  (1019000062, 'Tonsillectomy', 'Amigdalectomia', 'Amigdalectomía', 'Tonsillectomy', 'Y83', 'procedure'),
  (1019000063, 'Appendectomy (open)', 'Apendicectomia (aberta)', 'Apendicectomía (abierta)', 'Appendectomy (open)', 'Y83', 'procedure'),
  (1019000064, 'Coronary artery bypass graft', 'Revascularização miocárdica', 'Revascularización miocárdica', 'Coronary artery bypass graft', 'Y83', 'procedure')
ON CONFLICT (concept_id) DO NOTHING;

-- 3) Alinhar eixo semântico da rinite alérgica (duplicada v1/v2)
UPDATE public.snomed_concepts
SET semantic_axis = 'disorder',
    updated_at    = timezone('utc'::text, now())
WHERE concept_id IN (19471005, 1806006)
  AND semantic_axis <> 'disorder';

-- ============================================================
-- NOTA OPERACIONAL
-- ============================================================
-- Os IDs 1019000001..1019000064 são PLACEHOLDERS do IAMED.
-- Substitua pelos IDs oficiais do release MLDS/DATASUS na
-- importação definitiva (\COPY), usando inn/atc_code/rxnorm_code
-- como referência cruzada.
-- ============================================================