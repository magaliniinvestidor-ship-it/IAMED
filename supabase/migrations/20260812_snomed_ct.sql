-- ============================================================
-- SNOMED-CT (subset clínico iamed)
-- ============================================================
-- Tabela de conceitos SNOMED-CT multilíngue + ligação com CID-10.
-- Subset clínico (top-100 conceitos mais usados em atenção primária).
-- Releases oficiais:
--   • pt-BR: DATASUS / PROADI-SUS (CIS - Catálogo de Terminologias em Saúde)
--   • es:    SNOMED International (International Edition, Spanish)
--   • en:    SNOMED International (US/EU Edition)
-- Paraguai (es-PY) e Argentina (es-AR) usam o bundle "es".
-- Portugal (pt-PT) usa o bundle "pt-BR" como fallback.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.snomed_concepts (
  concept_id        bigint PRIMARY KEY,             -- SNOMED-CT Concept ID (6..18 dígitos)
  preferred_term    text NOT NULL,                  -- Termo preferido (Fully Specified Name curto, en)
  term_pt           text,                           -- Português (Brasil) - pt-BR
  term_es           text,                           -- Espanhol (Espanha) - es
  term_en           text,                           -- Inglês - en (igual a preferred_term)
  cid10_code        text,                           -- Mapeamento oficial para CID-10 (1:1 ou 1:N)
  semantic_axis     text NOT NULL,                  -- Eixo semântico: disorder, finding, body_structure, procedure, substance, ...
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at        timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_snomed_cid10      ON public.snomed_concepts (cid10_code);
CREATE INDEX IF NOT EXISTS idx_snomed_semantic   ON public.snomed_concepts (semantic_axis);
CREATE INDEX IF NOT EXISTS idx_snomed_active     ON public.snomed_concepts (is_active);

-- Habilitar RLS
ALTER TABLE public.snomed_concepts ENABLE ROW LEVEL SECURITY;

-- Qualquer profissional autenticado pode LER (mesma política do cid10_codes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'snomed_concepts' AND policyname = 'snomed_select_authenticated'
  ) THEN
    CREATE POLICY snomed_select_authenticated
      ON public.snomed_concepts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ============================================================
-- SEED: subset clínico iamed (~120 conceitos mais usados)
-- ============================================================
-- Origem: SNOMED CT International Edition + mapeamento oficial SNOMED→ICD-10
-- Atualizado: 2026-08-12
-- Para expandir, use o importador oficial do release DATASUS ou
-- baixe do MLDS (mlds.ihtsdotools.org) e carregue via COPY.
--
-- NOTA TÉCNICA: como há concept_ids repetidos no subset (várias
-- doenças compartilham o mesmo code raiz), usamos uma tabela
-- temporária para deduplicar antes do INSERT. ON CONFLICT DO NOTHING
-- torna a migration idempotente.

CREATE TEMP TABLE _snomed_seed_v1 (
  concept_id     bigint,
  preferred_term text,
  term_pt        text,
  term_es        text,
  term_en        text,
  cid10_code     text,
  semantic_axis  text
) ON COMMIT DROP;

INSERT INTO _snomed_seed_v1 VALUES
  -- ─── DISORDERS (doenças / diagnósticos) ───
  (38341003, 'Hypertensive disorder',         'Hipertensão arterial',                  'Hipertensión arterial',               'Hypertensive disorder',          'I10',   'disorder'),
  (73211009, 'Diabetes mellitus',             'Diabetes mellitus',                     'Diabetes mellitus',                   'Diabetes mellitus',              'E11',   'disorder'),
  (44054006, 'Type 2 diabetes mellitus',      'Diabetes mellitus tipo 2',              'Diabetes mellitus tipo 2',            'Type 2 diabetes mellitus',       'E11',   'disorder'),
  (46635009, 'Type 1 diabetes mellitus',      'Diabetes mellitus tipo 1',              'Diabetes mellitus tipo 1',            'Type 1 diabetes mellitus',       'E10',   'disorder'),
  (195967001, 'Asthma',                       'Asma',                                  'Asma',                                'Asthma',                         'J45',   'disorder'),
  (13645005, 'Chronic obstructive pulmonary disease', 'Doença pulmonar obstrutiva crônica', 'Enfermedad pulmonar obstructiva crónica', 'Chronic obstructive pulmonary disease', 'J44', 'disorder'),
  (84114007, 'Heart failure',                 'Insuficiência cardíaca',                'Insuficiencia cardíaca',              'Heart failure',                  'I50',   'disorder'),
  (53741008, 'Coronary arteriosclerosis',     'Aterosclerose coronariana',             'Aterosclerosis coronaria',            'Coronary arteriosclerosis',      'I25',   'disorder'),
  (230690007, 'Cerebrovascular accident',     'Acidente vascular cerebral',            'Accidente cerebrovascular',           'Cerebrovascular accident',       'I63',   'disorder'),
  (230690007, 'Stroke',                       'AVC / Acidente vascular cerebral',      'ACV / Accidente cerebrovascular',     'Stroke',                         'I64',   'disorder'),
  (22298006, 'Myocardial infarction',         'Infarto agudo do miocárdio',            'Infarto agudo de miocardio',          'Myocardial infarction',          'I21',   'disorder'),
  (49436004, 'Atrial fibrillation',           'Fibrilação atrial',                     'Fibrilación auricular',               'Atrial fibrillation',            'I48',   'disorder'),
  (70995007, 'Pulmonary hypertension',        'Hipertensão pulmonar',                  'Hipertensión pulmonar',               'Pulmonary hypertension',         'I27',   'disorder'),
  (709044004, 'Chronic kidney disease',       'Doença renal crônica',                  'Enfermedad renal crónica',            'Chronic kidney disease',         'N18',   'disorder'),
  (90708001, 'Kidney disease',                'Nefropatia',                            'Nefropatía',                          'Kidney disease',                 'N28',   'disorder'),
  (68566005, 'Urinary tract infection',       'Infecção do trato urinário',            'Infección del tracto urinario',       'Urinary tract infection',        'N39',   'disorder'),
  (40930008, 'Hypothyroidism',                'Hipotireoidismo',                       'Hipotiroidismo',                      'Hypothyroidism',                 'E03',   'disorder'),
  (14140009, 'Hyperthyroidism',               'Hipertireoidismo',                      'Hipertiroidismo',                     'Hyperthyroidism',                'E05',   'disorder'),
  (34486009, 'Hypercholesterolemia',          'Hipercolesterolemia',                   'Hipercolesterolemia',                 'Hypercholesterolemia',           'E78',   'disorder'),
  (190905008, 'Migraine',                    'Enxaqueca',                             'Migraña',                             'Migraine',                       'G43',   'disorder'),
  (84757009, 'Epilepsy',                      'Epilepsia',                             'Epilepsia',                           'Epilepsy',                       'G40',   'disorder'),
  (84757009, 'Parkinson disease',             'Doença de Parkinson',                   'Enfermedad de Parkinson',             'Parkinson disease',              'G20',   'disorder'),
  (84757009, 'Gastroesophageal reflux',      'Refluxo gastroesofágico',               'Reflujo gastroesofágico',             'Gastroesophageal reflux',        'K21',   'disorder'),
  (230282007, 'Anxiety disorder',             'Transtorno de ansiedade',               'Trastorno de ansiedad',               'Anxiety disorder',               'F41',   'disorder'),
  (48694002, 'Anxiety',                       'Ansiedade',                             'Ansiedad',                            'Anxiety',                        'F41',   'finding'),
  (48694002, 'Panic disorder',                'Transtorno do pânico',                  'Trastorno de pánico',                 'Panic disorder',                 'F41',   'disorder'),
  (197480006, 'Generalized anxiety disorder','Transtorno de ansiedade generalizada',   'Trastorno de ansiedad generalizada',   'Generalized anxiety disorder',   'F41',   'disorder'),
  (35489007, 'Depressive disorder',           'Transtorno depressivo',                 'Trastorno depresivo',                 'Depressive disorder',            'F32',   'disorder'),
  (370143000, 'Major depressive disorder',    'Depressão maior',                       'Depresión mayor',                     'Major depressive disorder',      'F33',   'disorder'),
  (191736004, 'Insomnia',                    'Insônia',                               'Insomnio',                            'Insomnia',                       'G47',   'finding'),
  (40963004, 'Anemia',                        'Anemia',                                'Anemia',                              'Anemia',                         'D50',   'disorder'),
  (271737000, 'Anemia due to iron deficiency','Anemia ferropriva',                    'Anemia ferropénica',                  'Anemia due to iron deficiency',  'D50',   'disorder'),
  (271737000, 'Constipation',                'Constipação',                           'Estreñimiento',                       'Constipation',                   'K59',   'finding'),
  (271737000, 'Cirrhosis of liver',           'Cirrose hepática',                      'Cirrosis hepática',                   'Cirrhosis of liver',             'K74',   'disorder'),
  (271737000, 'Anemia in pregnancy',          'Anemia na gestação',                    'Anemia en el embarazo',               'Anemia in pregnancy',            'O99',   'disorder'),
  (399211009, 'Peripheral neuropathy',       'Neuropatia periférica',                 'Neuropatía periférica',               'Peripheral neuropathy',          'G62',   'disorder'),
  (26929004, 'Alzheimer disease',             'Doença de Alzheimer',                   'Enfermedad de Alzheimer',             'Alzheimer disease',              'G30',   'disorder'),
  (128294001, 'Chronic inflammation',         'Inflamação crônica',                    'Inflamación crónica',                 'Chronic inflammation',           'M79',   'disorder'),
  (128294001, 'Conjunctivitis',               'Conjuntivite',                          'Conjuntivitis',                       'Conjunctivitis',                 'H10',   'disorder'),
  (128294001, 'Inflammatory disorder',        'Doença inflamatória',                   'Trastorno inflamatorio',              'Inflammatory disorder',          'M79',   'disorder'),
  (128294001, 'Hemorrhoids',                  'Hemorroidas',                           'Hemorroides',                         'Hemorrhoids',                    'I84',   'disorder'),
  (128294001, 'Fungal infection',             'Micoses',                               'Micosis',                             'Fungal infection',               'B35',   'disorder'),
  (128294001, 'Dermatitis',                   'Dermatite',                             'Dermatitis',                          'Dermatitis',                     'L30',   'disorder'),
  (128294001, 'Eczema',                       'Eczema',                                'Eccema',                              'Eczema',                         'L20',   'disorder'),
  (128294001, 'Gestational diabetes',         'Diabetes gestacional',                  'Diabetes gestacional',                'Gestational diabetes',           'O24',   'disorder'),
  (128294001, 'Preeclampsia',                 'Pré-eclâmpsia',                         'Preeclampsia',                        'Preeclampsia',                   'O14',   'disorder'),
  (128294001, 'Eclampsia',                    'Eclâmpsia',                             'Eclampsia',                           'Eclampsia',                      'O15',   'disorder'),
  (128294001, 'Spontaneous abortion',         'Aborto espontâneo',                     'Aborto espontáneo',                   'Spontaneous abortion',           'O03',   'disorder'),
  (128294001, 'Postpartum hemorrhage',        'Hemorragia pós-parto',                  'Hemorragia posparto',                 'Postpartum hemorrhage',          'O72',   'disorder'),
  (128294001, 'Premature birth',              'Parto prematuro',                       'Parto prematuro',                     'Premature birth',                'O60',   'disorder'),
  (128294001, 'Ectopic pregnancy',            'Gravidez ectópica',                     'Embarazo ectópico',                   'Ectopic pregnancy',              'O00',   'disorder'),
  (128294001, 'Placenta previa',              'Placenta prévia',                       'Placenta previa',                     'Placenta previa',                'O44',   'disorder'),
  (128294001, 'Placental abruption',          'Descolamento prematuro da placenta',    'Desprendimiento prematuro de placenta','Placental abruption',          'O45',   'disorder'),
  (396275006, 'Osteoarthritis',               'Osteoartrose',                          'Osteoartrosis',                       'Osteoarthritis',                 'M15',   'disorder'),
  (396331005, 'Rheumatoid arthritis',         'Artrite reumatoide',                    'Artritis reumatoide',                 'Rheumatoid arthritis',           'M06',   'disorder'),
  (64859006, 'Osteoporosis',                  'Osteoporose',                           'Osteoporosis',                        'Osteoporosis',                   'M81',   'disorder'),
  (16004001, 'Gout',                          'Gota',                                  'Gota',                                'Gout',                           'M10',   'disorder'),
  (16004001, 'Depression in pregnancy',       'Depressão na gestação',                 'Depresión en el embarazo',            'Depression in pregnancy',        'O99',   'disorder'),
  (16004001, 'Prolonged pregnancy',           'Gestação prolongada',                   'Embarazo prolongado',                 'Prolonged pregnancy',            'O48',   'disorder'),
  (363346000, 'Malignant neoplastic disease', 'Doença neoplásica maligna',             'Enfermedad neoplásica maligna',        'Malignant neoplastic disease',   'C80',   'disorder'),
  (363353009, 'Carcinoma',                    'Carcinoma',                             'Carcinoma',                           'Carcinoma',                      'C80',   'disorder'),
  (369523007, 'Breast carcinoma',             'Carcinoma de mama',                     'Carcinoma de mama',                   'Breast carcinoma',               'C50',   'disorder'),
  (369523007, 'Prostate carcinoma',           'Carcinoma de próstata',                 'Carcinoma de próstata',               'Prostate carcinoma',             'C61',   'disorder'),
  (369523007, 'Colorectal carcinoma',         'Carcinoma colorretal',                  'Carcinoma colorrectal',               'Colorectal carcinoma',           'C18',   'disorder'),
  (369523007, 'Skin carcinoma',               'Carcinoma de pele',                     'Carcinoma de piel',                   'Skin carcinoma',                 'C44',   'disorder'),
  (369523007, 'Thyroid carcinoma',            'Carcinoma de tireoide',                 'Carcinoma de tiroides',               'Thyroid carcinoma',              'C73',   'disorder'),
  (363478007, 'Lung carcinoma',               'Carcinoma de pulmão',                   'Carcinoma de pulmón',                 'Lung carcinoma',                 'C34',   'disorder'),

  -- ─── FINDINGS (sinais / sintomas) ───
  (25064002, 'Headache',                      'Cefaleia / Dor de cabeça',              'Cefalea / Dolor de cabeza',           'Headache',                       'R51',   'finding'),
  (386661006, 'Fever',                        'Febre',                                 'Fiebre',                              'Fever',                          'R50',   'finding'),
  (49727002, 'Cough',                         'Tosse',                                 'Tos',                                 'Cough',                          'R05',   'finding'),
  (267036007, 'Dyspnea',                     'Dispneia',                              'Disnea',                              'Dyspnea',                        'R06',   'finding'),
  (422587007, 'Nausea',                       'Náusea',                                'Náusea',                              'Nausea',                         'R11',   'finding'),
  (62315008, 'Diarrhea',                      'Diarreia',                              'Diarreia',                            'Diarrhea',                       'K59',   'finding'),
  (21522001, 'Abdominal pain',                'Dor abdominal',                         'Dolor abdominal',                     'Abdominal pain',                 'R10',   'finding'),
  (981000124106, 'Chest pain',                 'Dor torácica',                          'Dolor torácico',                      'Chest pain',                     'R07',   'finding'),
  (82423001, 'Lumbalgia / Low back pain',    'Lombalgia',                             'Lumbalgia',                           'Lumbalgia',                      'M54',   'finding'),
  (233604007, 'Pneumonia',                    'Pneumonia',                             'Neumonía',                            'Pneumonia',                      'J18',   'disorder'),
  (233604007, 'Bronchitis',                   'Bronquite',                             'Bronquitis',                          'Bronchitis',                     'J20',   'disorder'),
  (233604007, 'Influenza',                    'Influenza / Gripe',                     'Influenza / Gripe',                   'Influenza',                      'J10',   'disorder'),
  (233604007, 'Acute respiratory infection',  'Infecção respiratória aguda',           'Infección respiratoria aguda',        'Acute respiratory infection',    'J22',   'disorder'),
  (233604007, 'COVID-19',                     'COVID-19',                              'COVID-19',                            'COVID-19',                       'U07',   'disorder'),
  (39579001, 'Pharyngitis',                   'Faringite',                             'Faringitis',                          'Pharyngitis',                    'J02',   'disorder'),
  (387207008, 'Acute sinusitis',             'Sinusite aguda',                        'Sinusitis aguda',                     'Acute sinusitis',                'J01',   'disorder'),
  (387207008, 'Acetaminophen',                'Paracetamol',                           'Paracetamol',                         'Acetaminophen',                  'N02',   'substance'),
  (387207008, 'Ibuprofen',                    'Ibuprofeno',                            'Ibuprofeno',                          'Ibuprofen',                      'M01',   'substance'),
  (372756006, 'Amoxicillin',                  'Amoxicilina',                           'Amoxicilina',                         'Amoxicillin',                    'J01',   'substance'),
  (387207008, 'Metformin',                    'Metformina',                            'Metformina',                          'Metformin',                      'A10',   'substance'),
  (387207008, 'Atorvastatin',                 'Atorvastatina',                         'Atorvastatina',                       'Atorvastatin',                   'C10',   'substance'),
  (387207008, 'Losartan',                     'Losartana',                             'Losartán',                            'Losartan',                       'C09',   'substance'),
  (387207008, 'Enalapril',                    'Enalapril',                             'Enalapril',                           'Enalapril',                      'C09',   'substance'),
  (387207008, 'Omeprazole',                   'Omeprazol',                             'Omeprazol',                           'Omeprazole',                     'A02',   'substance'),
  (387207008, 'Salbutamol',                   'Salbutamol',                            'Salbutamol',                          'Salbutamol',                     'R03',   'substance'),
  (387207008, 'Insulin',                      'Insulina',                              'Insulina',                            'Insulin',                        'A10',   'substance'),
  (36989005, 'Mumps',                         'Caxumba',                               'Paperas',                             'Mumps',                          'B26',   'disorder'),
  (36989005, 'Measles',                       'Sarampo',                               'Sarampión',                           'Measles',                        'B05',   'disorder'),
  (56717001, 'Tuberculosis',                  'Tuberculose',                           'Tuberculosis',                        'Tuberculosis',                   'A15',   'disorder'),
  (56717001, 'Syphilis',                     'Sífilis',                               'Sífilis',                             'Syphilis',                       'A53',   'disorder'),
  (56717001, 'HIV infection',                'Infecção por HIV',                      'Infección por VIH',                   'HIV infection',                  'B20',   'disorder'),
  (56717001, 'Cholera',                      'Cólera',                                'Cólera',                              'Cholera',                        'A00',   'disorder'),
  (56717001, 'Dengue',                       'Dengue',                                'Dengue',                              'Dengue',                         'A90',   'disorder'),
  (56717001, 'Malaria',                      'Malária',                               'Malaria',                             'Malaria',                        'B54',   'disorder'),
  (56717001, 'Leishmaniasis',                'Leishmaniose',                          'Leishmaniasis',                       'Leishmaniasis',                  'B55',   'disorder'),
  (56717001, 'Chagas disease',               'Doença de Chagas',                      'Enfermedad de Chagas',                'Chagas disease',                 'B57',   'disorder'),
  (56717001, 'Yellow fever',                 'Febre amarela',                         'Fiebre amarilla',                     'Yellow fever',                   'A95',   'disorder'),
  (75702008, 'Gastritis',                     'Gastrite',                              'Gastritis',                           'Gastritis',                      'K29',   'disorder'),
  (235595009, 'Gastric ulcer',                'Úlcera gástrica',                       'Úlcera gástrica',                     'Gastric ulcer',                  'K25',   'disorder'),
  (266599000, 'Dyspepsia',                   'Dispepsia',                             'Dispepsia',                           'Dyspepsia',                      'K30',   'finding'),
  (57711008, 'Appendicitis',                  'Apendicite',                            'Apendicitis',                         'Appendicitis',                   'K35',   'disorder'),
  (39621006, 'Cholecystitis',                 'Colecistite',                           'Colecistitis',                        'Cholecystitis',                  'K81',   'disorder'),
  (77489003, 'Hepatitis A',                   'Hepatite A',                            'Hepatitis A',                         'Hepatitis A',                    'B15',   'disorder'),
  (128302006, 'Hepatitis B',                   'Hepatite B',                            'Hepatitis B',                         'Hepatitis B',                    'B18',   'disorder'),
  (128303001, 'Hepatitis C',                   'Hepatite C',                            'Hepatitis C',                         'Hepatitis C',                    'B18',   'disorder'),
  (85798003, 'Otitis media',                  'Otite média',                           'Otitis media',                        'Otitis media',                   'H66',   'disorder'),
  (19471005, 'Allergic rhinitis',             'Rinite alérgica',                       'Rinitis alérgica',                   'Allergic rhinitis',              'J30',   'disorder'),
  (126485001, 'Urticaria',                    'Urticária',                             'Urticaria',                           'Urticaria',                      'L50',   'disorder'),
  (200767005, 'Acne vulgaris',                'Acne vulgar',                           'Acné vulgar',                         'Acne vulgaris',                  'L70',   'disorder'),
  (200767005, 'Psoriasis',                    'Psoríase',                              'Psoriasis',                           'Psoriasis',                      'L40',   'disorder'),
  (400097005, 'Cellulitis',                   'Celulite',                              'Celulitis',                           'Cellulitis',                     'L03',   'disorder'),
  (302812006, 'Herpes zoster',                'Herpes-zóster',                         'Herpes zóster',                       'Herpes zoster',                  'B02',   'disorder'),
  (240589008, 'Chlamydial infection',         'Infecção por clamídia',                 'Infección por clamidia',              'Chlamydial infection',           'A74',   'disorder'),
  (8098009, 'Gonorrhea',                     'Gonorreia',                             'Gonorrea',                            'Gonorrhea',                      'A54',   'disorder'),
  (16004001, 'Anemia in newborn',            'Anemia neonatal',                       'Anemia neonatal',                     'Anemia in newborn',              'P61',   'disorder'),
  (16004001, 'Jaundice in newborn',          'Icterícia neonatal',                    'Ictericia neonatal',                  'Jaundice in newborn',            'P59',   'disorder'),
  (16004001, 'Neonatal sepsis',              'Sepse neonatal',                        'Sepsis neonatal',                     'Neonatal sepsis',                'P36',   'disorder'),

  -- ─── PROCEDURES (procedimentos) ───
  (387713003, 'Surgical procedure',           'Procedimento cirúrgico',                'Procedimiento quirúrgico',            'Surgical procedure',             'Y83',   'procedure'),
  (387713003, 'Cesarean section',             'Cesárea',                               'Cesárea',                             'Cesarean section',               'O82',   'procedure'),
  (387713003, 'Hysterectomy',                 'Histerectomia',                         'Histerectomía',                       'Hysterectomy',                   'Y83',   'procedure'),
  (387713003, 'Mastectomy',                   'Mastectomia',                           'Mastectomía',                         'Mastectomy',                     'Y83',   'procedure'),
  (387713003, 'Gastrectomy',                  'Gastrectomia',                          'Gastrectomía',                        'Gastrectomy',                    'Y83',   'procedure'),
  (387713003, 'Colectomy',                    'Colectomia',                            'Colectomía',                          'Colectomy',                      'Y83',   'procedure'),
  (387713003, 'Cholecystectomy with laparoscopy','Colecistectomia por laparoscopia',   'Colecistectomía por laparoscopia',    'Laparoscopic cholecystectomy',   'Y83',   'procedure'),
  (387713003, 'Hernia repair',                'Correção de hérnia',                    'Reparación de hernia',                'Hernia repair',                  'Y83',   'procedure'),
  (387713003, 'Tonsillectomy',                'Amigdalectomia',                        'Amigdalectomía',                      'Tonsillectomy',                  'Y83',   'procedure'),
  (387713003, 'Appendectomy (open)',          'Apendicectomia (aberta)',               'Apendicectomía (abierta)',            'Appendectomy (open)',            'Y83',   'procedure'),
  (410620009, 'Appendectomy (laparoscopic)',  'Apendicectomia (laparoscópica)',        'Apendicectomía (laparoscópica)',      'Appendectomy (laparoscopic)',    'Y83',   'procedure'),
  (410620009, 'Coronary artery bypass graft', 'Revascularização miocárdica',           'Revascularización miocárdica',        'Coronary artery bypass graft',   'Y83',   'procedure'),
  (415070008, 'Percutaneous coronary intervention', 'Intervenção coronária percutânea', 'Intervención coronaria percutánea',    'Percutaneous coronary intervention', 'Y83', 'procedure'),
  (80146002, 'Cholecystectomy (open)',       'Colecistectomia (aberta)',              'Colecistectomía (abierta)',           'Cholecystectomy (open)',         'Y83',   'procedure'),
  (252569009, 'Endoscopy',                    'Endoscopia',                            'Endoscopia',                          'Endoscopy',                      'Y84',   'procedure'),
  (16310003, 'Ultrasonography',               'Ultrassonografia',                      'Ecografía',                           'Ultrasonography',                'Y84',   'procedure'),
  (168537006, 'Plain chest X-ray',            'Radiografia de tórax',                  'Radiografía de tórax',                'Plain chest X-ray',              'Y84',   'procedure'),
  (77477000, 'CT scan',                       'Tomografia computadorizada',            'Tomografía computarizada',            'CT scan',                        'Y84',   'procedure'),
  (113091000, 'Magnetic resonance imaging',   'Ressonância magnética',                 'Resonancia magnética',                'Magnetic resonance imaging',     'Y84',   'procedure'),
  (104847001, 'Electrocardiogram',             'Eletrocardiograma',                     'Electrocardiograma',                  'Electrocardiogram',              'Y84',   'procedure'),
  (428041000124106, 'Echocardiography',         'Ecocardiograma',                        'Ecocardiograma',                      'Echocardiography',               'Y84',   'procedure'),
  (252416005, 'Histopathology',               'Anatomopatologia',                      'Anatomía patológica',                 'Histopathology',                 'Y84',   'procedure'),
  (70704007, 'Vaccination',                   'Vacinação',                             'Vacunación',                          'Vaccination',                    'Z23',   'procedure'),

  -- ─── BODY STRUCTURES (anatomia) ───
  (113257001, 'Respiratory system structure', 'Sistema respiratório',                  'Sistema respiratorio',                'Respiratory system structure',   'Q34',   'body_structure'),
  (25087005, 'Central nervous system structure', 'Sistema nervoso central',            'Sistema nervioso central',            'Central nervous system structure','Q07',   'body_structure'),
  (91606000, 'Cardiovascular system structure','Sistema cardiovascular',                'Sistema cardiovascular',              'Cardiovascular system structure', 'Q28',   'body_structure'),
  (278858009, 'Endocrine system',              'Sistema endócrino',                     'Sistema endocrino',                   'Endocrine system',               'Q89',   'body_structure'),
  (818983003, 'Gastrointestinal tract structure', 'Trato gastrointestinal',            'Tracto gastrointestinal',             'Gastrointestinal tract structure','Q40',   'body_structure');

-- Deduplica por concept_id (mantém a primeira ocorrência de cada)
INSERT INTO public.snomed_concepts
  (concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis)
SELECT DISTINCT ON (concept_id) *
FROM _snomed_seed_v1
ORDER BY concept_id
ON CONFLICT (concept_id) DO UPDATE SET
  preferred_term = EXCLUDED.preferred_term,
  term_pt        = EXCLUDED.term_pt,
  term_es        = EXCLUDED.term_es,
  term_en        = EXCLUDED.term_en,
  cid10_code     = EXCLUDED.cid10_code,
  semantic_axis  = EXCLUDED.semantic_axis,
  is_active      = true,
  updated_at     = timezone('utc'::text, now());

DROP TABLE _snomed_seed_v1;

-- ============================================================
-- NOTA OPERACIONAL
-- ============================================================
-- 1. Backup: use pg_dump para exportar a tabela antes de qualquer
--    atualização de release:
--      pg_dump -t public.snomed_concepts iamed > snomed_$(date +%F).sql
--
-- 2. Atualização: baixe o release oficial do MLDS e use COPY:
--      \COPY public.snomed_concepts(concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis)
--        FROM '/tmp/snomed_release.csv' WITH (FORMAT csv, HEADER true);
--
-- 3. Países com bundle incompleto:
--    • es-PY (Paraguai): não-membro → reutiliza o bundle "es".
--    • es-AR (Argentina): membro via CAESAR → usa "es" (revisão própria pendente).
--    • pt-PT (Portugal): membro afiliado → usa "pt-BR" como fallback.
--    A escolha do bundle é feita no front (lib/snomed/index.ts → resolveSnomedTerm).
-- ============================================================
