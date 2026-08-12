-- ============================================================
-- SNOMED-CT expansão (subset clínico iamed v2)
-- ============================================================
-- Adiciona:
--   1. Substâncias / medicamentos essenciais
--   2. Achados de alergia e efeito adverso
--   3. Vacinas (calendário nacional BR/PY e AR)
--   4. Excipientes / ingredientes inativos comuns
--   5. Colunas: rxnorm_code, inn, atc_code
-- ============================================================

-- 1) Coluna para código RxNorm / INN (princípio ativo) — referência cruzada
ALTER TABLE public.snomed_concepts
  ADD COLUMN IF NOT EXISTS rxnorm_code text,
  ADD COLUMN IF NOT EXISTS inn text,
  ADD COLUMN IF NOT EXISTS atc_code text;

CREATE INDEX IF NOT EXISTS idx_snomed_rxnorm ON public.snomed_concepts (rxnorm_code);
CREATE INDEX IF NOT EXISTS idx_snomed_atc     ON public.snomed_concepts (atc_code);
CREATE INDEX IF NOT EXISTS idx_snomed_inn     ON public.snomed_concepts (inn);

-- ============================================================
-- Tabela temporária para deduplicar antes do INSERT.
-- Cada INN (princípio ativo) tem 1 linha.
-- ============================================================

CREATE TEMP TABLE _snomed_seed_v2 (
  concept_id     bigint,
  preferred_term text,
  term_pt        text,
  term_es        text,
  term_en        text,
  cid10_code     text,
  semantic_axis  text,
  rxnorm_code    text,
  inn            text,
  atc_code       text
) ON COMMIT DROP;

INSERT INTO _snomed_seed_v2 VALUES
  -- ═══ MEDICAMENTOS — ANALGÉSICOS / ANTITÉRMICOS ═══
  (3872070081, 'Paracetamol',                  'Paracetamol',                  'Paracetamol',                  'Paracetamol',                  'N02', 'substance', '161',  'Paracetamol',                  'N02BE01'),
  (3872070082, 'Ibuprofen',                   'Ibuprofeno',                   'Ibuprofeno',                   'Ibuprofen',                    'M01', 'substance', '5640', 'Ibuprofen',                    'M01AE01'),
  (3872070083, 'Dipyrone / Metamizole',        'Dipirona',                     'Dipirona',                     'Dipyrone',                     'N02', 'substance', '32624','Metamizole',                   'N02BB02'),
  (3872070084, 'Aspirin',                      'Ácido acetilsalicílico',       'Ácido acetilsalicílico',       'Aspirin',                      'N02', 'substance', '1191','Acetylsalicylic acid',         'N02BA01'),
  (3872070085, 'Naproxen',                    'Naproxeno',                    'Naproxeno',                    'Naproxen',                     'M01', 'substance', '7258','Naproxen',                     'M01AE02'),
  (3872070086, 'Diclofenac',                   'Diclofenaco',                  'Diclofenaco',                  'Diclofenac',                   'M01', 'substance', '3355','Diclofenac',                   'M01AB05'),
  (3872070087, 'Celecoxib',                   'Celecoxibe',                   'Celecoxib',                    'Celecoxib',                    'M01', 'substance', '140587','Celecoxib',                  'M01AH01'),
  (3872070088, 'Morphine',                    'Morfina',                      'Morfina',                      'Morphine',                     'N02', 'substance', '7052','Morphine',                     'N02AA01'),
  (3872070089, 'Codeine',                     'Codeína',                      'Codeína',                      'Codeine',                      'R05', 'substance', '2670','Codeine',                      'R05DA04'),
  (3872070090, 'Tramadol',                    'Tramadol',                     'Tramadol',                     'Tramadol',                     'N02', 'substance', '10689','Tramadol',                    'N02AX02'),

  -- ═══ MEDICAMENTOS — ANTIBIÓTICOS ═══
  (3727560061, 'Amoxicillin',                 'Amoxicilina',                  'Amoxicilina',                  'Amoxicillin',                  'J01', 'substance', '723',  'Amoxicillin',                  'J01CA04'),
  (3727560062, 'Amoxicillin + Clavulanate',   'Amoxicilina + Clavulanato',    'Amoxicilina + Ácido clavulánico','Amoxicillin + Clavulanate',   'J01', 'substance', '197832','Amoxicillin + Clavulanic acid','J01CR02'),
  (3727560063, 'Azithromycin',                'Azitromicina',                 'Azitromicina',                 'Azithromycin',                 'J01', 'substance', '308136','Azithromycin',               'J01FA10'),
  (3727560064, 'Ciprofloxacin',               'Ciprofloxacino',               'Ciprofloxacino',               'Ciprofloxacin',                'J01', 'substance', '2556','Ciprofloxacin',                'J01MA02'),
  (3727560065, 'Levofloxacin',                'Levofloxacino',                'Levofloxacino',                'Levofloxacin',                 'J01', 'substance', '82122','Levofloxacin',                'J01MA12'),
  (3727560066, 'Doxycycline',                 'Doxiciclina',                  'Doxiciclina',                  'Doxycycline',                  'J01', 'substance', '3640','Doxycycline',                  'J01AA02'),
  (3727560067, 'Cephalexin',                  'Cefalexina',                   'Cefalexina',                   'Cephalexin',                   'J01', 'substance', '2231','Cefalexin',                    'J01DB01'),
  (3727560068, 'Ceftriaxone',                 'Ceftriaxona',                  'Ceftriaxona',                  'Ceftriaxone',                  'J01', 'substance', '3093','Ceftriaxone',                  'J01DD04'),
  (3727560069, 'Sulfamethoxazole + Trimethoprim','Sulfametoxazol + Trimetoprima','Sulfametoxazol + Trimetoprima','Sulfamethoxazole + Trimethoprim','J01','substance','10180','Sulfamethoxazole + Trimethoprim','J01EE01'),
  (3727560070, 'Penicillin V',                'Penicilina V',                 'Penicilina V',                 'Phenoxymethylpenicillin',      'J01', 'substance', '7980','Phenoxymethylpenicillin',      'J01CE02'),
  (3727560071, 'Benzylpenicillin',            'Penicilina G',                 'Penicilina G',                 'Benzylpenicillin',             'J01', 'substance', '7981','Benzylpenicillin',             'J01CE01'),
  (3727560072, 'Metronidazole',               'Metronidazol',                 'Metronidazol',                 'Metronidazole',                'J01', 'substance', '6922','Metronidazole',                'J01XD01'),
  (3727560073, 'Nitrofurantoin',              'Nitrofurantoína',              'Nitrofurantoína',              'Nitrofurantoin',               'J01', 'substance', '7444','Nitrofurantoin',               'J01XE01'),
  (3727560074, 'Isoniazid',                   'Isoniazida',                   'Isoniazida',                   'Isoniazid',                    'J04', 'substance', '6038','Isoniazid',                    'J04AC01'),
  (3727560075, 'Rifampicin',                  'Rifampicina',                  'Rifampicina',                  'Rifampicin',                   'J04', 'substance', '9384','Rifampicin',                   'J04AB02'),

  -- ═══ MEDICAMENTOS — ANTIFÚNGICOS ═══
  (3872070101, 'Fluconazole',                 'Fluconazol',                   'Fluconazol',                   'Fluconazole',                  'J02', 'substance', '4450', 'Fluconazole',                  'J02AC01'),
  (3872070102, 'Itraconazole',                'Itraconazol',                  'Itraconazol',                  'Itraconazole',                 'J02', 'substance', '28049','Itraconazole',                'J02AC02'),
  (3872070103, 'Nystatin',                    'Nistatina',                    'Nistatina',                    'Nystatin',                     'J02', 'substance', '7464', 'Nystatin',                     'A07AA02'),
  (3872070104, 'Terbinafine',                 'Terbinafina',                  'Terbinafina',                  'Terbinafine',                  'D01', 'substance', '13028','Terbinafine',                  'D01BA02'),

  -- ═══ MEDICAMENTOS — ANTIPARASITÁRIOS ═══
  (3872070111, 'Albendazole',                 'Albendazol',                   'Albendazol',                   'Albendazole',                  'P02', 'substance', '4303', 'Albendazole',                  'P02CA03'),
  (3872070112, 'Mebendazole',                 'Mebendazol',                   'Mebendazol',                   'Mebendazole',                  'P02', 'substance', '4477', 'Mebendazole',                  'P02CA01'),
  (3872070113, 'Ivermectin',                  'Ivermectina',                  'Ivermectina',                  'Ivermectin',                   'P02', 'substance', '6058', 'Ivermectin',                   'P02CF01'),

  -- ═══ MEDICAMENTOS — ANTIVIRAIS ═══
  (3872070121, 'Aciclovir',                   'Aciclovir',                    'Aciclovir',                    'Aciclovir',                    'J05', 'substance', '162',  'Aciclovir',                    'J05AB01'),
  (3872070122, 'Oseltamivir',                 'Oseltamivir',                  'Oseltamivir',                  'Oseltamivir',                  'J05', 'substance', '31664','Oseltamivir',                  'J05AH02'),

  -- ═══ MEDICAMENTOS — ANTICOAGULANTES / ANTIAGREGANTES ═══
  (3872070131, 'Warfarin',                    'Varfarina',                    'Warfarina',                    'Warfarin',                     'B01', 'substance', '11289','Warfarin',                     'B01AA03'),
  (3872070132, 'Enoxaparin',                  'Enoxaparina',                  'Enoxaparina',                  'Enoxaparin',                   'B01', 'substance', '67108','Enoxaparin',                   'B01AB05'),
  (3872070133, 'Rivaroxaban',                 'Rivaroxabana',                 'Rivaroxabán',                  'Rivaroxaban',                  'B01', 'substance', '1114198','Rivaroxaban',               'B01AF01'),
  (3872070134, 'Apixaban',                    'Apixabana',                    'Apixabán',                     'Apixaban',                     'B01', 'substance', '1364447','Apixaban',                  'B01AF02'),
  (3872070135, 'Clopidogrel',                 'Clopidogrel',                  'Clopidogrel',                  'Clopidogrel',                  'B01', 'substance', '32968','Clopidogrel',                  'B01AC04'),

  -- ═══ MEDICAMENTOS — CARDIOVASCULARES ═══
  (3872070141, 'Losartan',                    'Losartana',                    'Losartán',                     'Losartan',                     'C09', 'substance', '314075','Losartan',                    'C09CA01'),
  (3872070142, 'Enalapril',                   'Enalapril',                    'Enalapril',                    'Enalapril',                    'C09', 'substance', '29046','Enalapril',                    'C09AA02'),
  (3872070143, 'Captopril',                   'Captopril',                    'Captopril',                    'Captopril',                    'C09', 'substance', '1998', 'Captopril',                    'C09AA01'),
  (3872070144, 'Hydrochlorothiazide',         'Hidroclorotiazida',            'Hidroclorotiazida',            'Hydrochlorothiazide',          'C03', 'substance', '5487', 'Hydrochlorothiazide',          'C03AA03'),
  (3872070145, 'Furosemide',                  'Furosemida',                   'Furosemida',                   'Furosemide',                   'C03', 'substance', '4603', 'Furosemide',                   'C03CA01'),
  (3872070146, 'Spironolactone',              'Espironolactona',              'Espironolactona',              'Spironolactone',               'C03', 'substance', '9997', 'Spironolactone',               'C03DA01'),
  (3872070147, 'Propranolol',                 'Propranolol',                  'Propranolol',                  'Propranolol',                  'C07', 'substance', '8787', 'Propranolol',                  'C07AA05'),
  (3872070148, 'Atenolol',                    'Atenolol',                     'Atenolol',                     'Atenolol',                     'C07', 'substance', '1202', 'Atenolol',                     'C07AB03'),
  (3872070149, 'Carvedilol',                  'Carvedilol',                   'Carvedilol',                   'Carvedilol',                   'C07', 'substance', '20352','Carvedilol',                   'C07AG02'),
  (3872070150, 'Amlodipine',                  'Anlodipino',                   'Amlodipino',                   'Amlodipine',                   'C08', 'substance', '17767','Amlodipine',                   'C08CA01'),
  (3872070151, 'Nifedipine',                  'Nifedipino',                   'Nifedipino',                   'Nifedipine',                   'C08', 'substance', '7417', 'Nifedipine',                   'C08CA05'),
  (3872070152, 'Atorvastatin',                'Atorvastatina',                'Atorvastatina',                'Atorvastatin',                 'C10', 'substance', '83367','Atorvastatin',                 'C10AA05'),
  (3872070153, 'Simvastatin',                 'Sinvastatina',                 'Sinvastatina',                 'Simvastatin',                  'C10', 'substance', '36567','Simvastatin',                  'C10AA01'),
  (3872070154, 'Rosuvastatin',                'Rosuvastatina',                'Rosuvastatina',                'Rosuvastatin',                 'C10', 'substance', '301542','Rosuvastatin',                'C10AA07'),
  (3872070155, 'Digoxin',                     'Digoxina',                     'Digoxina',                     'Digoxin',                      'C01', 'substance', '3407', 'Digoxin',                      'C01AA05'),
  (3872070156, 'Amiodarone',                  'Amiodarona',                   'Amiodarona',                   'Amiodarone',                   'C01', 'substance', '703',  'Amiodarone',                   'C01BD01'),

  -- ═══ MEDICAMENTOS — ENDÓCRINO / METABÓLICO ═══
  (3872070161, 'Metformin',                   'Metformina',                   'Metformina',                   'Metformin',                    'A10', 'substance', '6809',  'Metformin',                    'A10BA02'),
  (3872070162, 'Glibenclamide',               'Glibenclamida',                'Glibenclamida',                'Glibenclamide',                'A10', 'substance', '4815',  'Glibenclamide',                'A10BB01'),
  (3872070163, 'Glimepiride',                 'Glimepirida',                  'Glimepirida',                  'Glimepiride',                  'A10', 'substance', '25789', 'Glimepiride',                  'A10BB12'),
  (3872070164, 'Insulin (regular)',           'Insulina regular',             'Insulina regular',             'Insulin regular',              'A10', 'substance', '253181','Insulin (regular)',            'A10AB01'),
  (3872070165, 'Insulin (NPH)',               'Insulina NPH',                 'Insulina NPH',                 'Insulin NPH',                  'A10', 'substance', '253182','Insulin NPH',                  'A10AC01'),
  (3872070166, 'Levothyroxine',               'Levotiroxina',                 'Levotiroxina',                 'Levothyroxine',                'H03', 'substance', '10582', 'Levothyroxine',                'H03AA01'),
  (3872070167, 'Methimazole',                 'Metimazol',                    'Metimazol',                    'Methimazole',                  'H03', 'substance', '8489',  'Methimazole',                  'H03BB02'),
  (3872070168, 'Prednisone',                  'Prednisona',                   'Prednisona',                   'Prednisone',                   'H02', 'substance', '8640',  'Prednisone',                   'H02AB07'),
  (3872070169, 'Prednisolone',                'Prednisolona',                 'Prednisolona',                 'Prednisolone',                 'H02', 'substance', '8648',  'Prednisolone',                 'H02AB06'),
  (3872070170, 'Dexamethasone',               'Dexametasona',                 'Dexametasona',                 'Dexamethasone',                'H02', 'substance', '32624', 'Dexamethasone',                'H02AB02'),
  (3872070171, 'Hydrocortisone',              'Hidrocortisona',               'Hidrocortisona',               'Hydrocortisone',               'H02', 'substance', '5492',  'Hydrocortisone',               'H02AB09'),
  (3872070172, 'Betamethasone',               'Betametasona',                 'Betametasona',                 'Betamethasone',                'H02', 'substance', '1514',  'Betamethasone',                'H02AB01'),

  -- ═══ MEDICAMENTOS — RESPIRATÓRIO ═══
  (3872070181, 'Salbutamol',                  'Salbutamol',                   'Salbutamol',                   'Salbutamol',                   'R03', 'substance', '745679','Salbutamol',                   'R03AC02'),
  (3872070182, 'Ipratropium bromide',         'Brometo de ipratrópio',        'Bromuro de ipratropio',        'Ipratropium bromide',          'R03', 'substance', '7213',  'Ipratropium bromide',          'R03BB01'),
  (3872070183, 'Beclomethasone dipropionate', 'Dipropionato de beclometasona','Dipropionato de beclometasona','Beclomethasone dipropionate',  'R03', 'substance', '1444',  'Beclomethasone dipropionate',  'R03BA01'),
  (3872070184, 'Budesonide',                  'Budesonida',                   'Budesonida',                   'Budesonide',                   'R03', 'substance', '19831', 'Budesonide',                   'R03BA02'),
  (3872070185, 'Fluticasone',                 'Fluticasona',                  'Fluticasona',                  'Fluticasone',                  'R03', 'substance', '41127', 'Fluticasone',                  'R03BA05'),
  (3872070186, 'Montelukast',                 'Montelucaste',                 'Montelukast',                  'Montelukast',                  'R03', 'substance', '1520',  'Montelukast',                  'R03DC03'),
  (3872070187, 'Loratadine',                  'Loratadina',                   'Loratadina',                   'Loratadine',                   'R06', 'substance', '6172',  'Loratadine',                   'R06AX13'),
  (3872070188, 'Cetirizine',                  'Cetirizina',                   'Cetirizina',                   'Cetirizine',                   'R06', 'substance', '20610', 'Cetirizine',                   'R06AE07'),
  (3872070189, 'Diphenhydramine',             'Difenidramina',                'Difenidramina',                'Diphenhydramine',              'R06', 'substance', '3498',  'Diphenhydramine',              'R06AA02'),
  (3872070190, 'Dextromethorphan',            'Dextrometorfano',              'Dextrometorfano',              'Dextromethorphan',             'R05', 'substance', '3289',  'Dextromethorphan',             'R05DA09'),

  -- ═══ MEDICAMENTOS — GASTROINTESTINAL ═══
  (3872070201, 'Omeprazole',                  'Omeprazol',                    'Omeprazol',                    'Omeprazole',                   'A02', 'substance', '7646',  'Omeprazole',                   'A02BC01'),
  (3872070202, 'Pantoprazole',                'Pantoprazol',                  'Pantoprazol',                  'Pantoprazole',                 'A02', 'substance', '40790', 'Pantoprazole',                 'A02BC02'),
  (3872070203, 'Ranitidine',                  'Ranitidina',                   'Ranitidina',                   'Ranitidine',                   'A02', 'substance', '9143',  'Ranitidine',                   'A02BA02'),
  (3872070204, 'Metoclopramide',              'Metoclopramida',               'Metoclopramida',               'Metoclopramide',               'A03', 'substance', '6915',  'Metoclopramide',               'A03FA01'),
  (3872070205, 'Ondansetron',                 'Ondansetrona',                 'Ondansetrona',                 'Ondansetron',                  'A04', 'substance', '32625', 'Ondansetron',                  'A04AA01'),
  (3872070206, 'Loperamide',                  'Loperamida',                   'Loperamida',                   'Loperamide',                   'A07', 'substance', '6468',  'Loperamide',                   'A07DA03'),
  (3872070207, 'Oral Rehydration Salts (ORS)','Sais para reidratação oral (SRO)','Sales de rehidratación oral (SRO)','Oral Rehydration Salts (ORS)','A07','substance', '312044','ORS',                          'A07CA99'),
  (3872070208, 'Simethicone',                 'Simeticona',                   'Simeticona',                   'Simethicone',                  'A03', 'substance', '9797',  'Simethicone',                  'A03AX13'),

  -- ═══ MEDICAMENTOS — PSICOTRÓPICOS / SNC ═══
  (3872070221, 'Fluoxetine',                  'Fluoxetina',                   'Fluoxetina',                   'Fluoxetine',                   'N06', 'substance', '4493',   'Fluoxetine',                   'N06AB03'),
  (3872070222, 'Sertraline',                  'Sertralina',                   'Sertralina',                   'Sertraline',                   'N06', 'substance', '36437',  'Sertraline',                   'N06AB06'),
  (3872070223, 'Paroxetine',                  'Paroxetina',                   'Paroxetina',                   'Paroxetine',                   'N06', 'substance', '32937',  'Paroxetine',                   'N06AB05'),
  (3872070224, 'Citalopram',                  'Citalopram',                   'Citalopram',                   'Citalopram',                   'N06', 'substance', '2557',   'Citalopram',                   'N06AB04'),
  (3872070225, 'Escitalopram',                'Escitalopram',                 'Escitalopram',                 'Escitalopram',                 'N06', 'substance', '321988', 'Escitalopram',                 'N06AB10'),
  (3872070226, 'Amitriptyline',               'Amitriptilina',                'Amitriptilina',                'Amitriptyline',                'N06', 'substance', '704',    'Amitriptyline',                'N06AA09'),
  (3872070227, 'Imipramine',                  'Imipramina',                   'Imipramina',                   'Imipramine',                   'N06', 'substance', '5691',   'Imipramine',                   'N06AA02'),
  (3872070228, 'Diazepam',                    'Diazepam',                     'Diazepam',                     'Diazepam',                     'N05', 'substance', '3322',   'Diazepam',                     'N05BA01'),
  (3872070229, 'Clonazepam',                  'Clonazepam',                   'Clonazepam',                   'Clonazepam',                   'N03', 'substance', '2598',   'Clonazepam',                   'N03AE01'),
  (3872070230, 'Alprazolam',                  'Alprazolam',                   'Alprazolam',                   'Alprazolam',                   'N05', 'substance', '596',    'Alprazolam',                   'N05BA12'),
  (3872070231, 'Phenobarbital',               'Fenobarbital',                 'Fenobarbital',                 'Phenobarbital',                'N03', 'substance', '8134',   'Phenobarbital',                'N03AA02'),
  (3872070232, 'Phenytoin',                   'Fenitoína',                    'Fenitoína',                    'Phenytoin',                    'N03', 'substance', '8183',   'Phenytoin',                    'N03AB02'),
  (3872070233, 'Carbamazepine',               'Carbamazepina',                'Carbamazepina',                'Carbamazepine',                'N03', 'substance', '2002',   'Carbamazepine',                'N03AF01'),
  (3872070234, 'Valproic acid',               'Ácido valproico',              'Ácido valproico',              'Valproic acid',                'N03', 'substance', '11118',  'Valproic acid',                'N03AG01'),
  (3872070235, 'Haloperidol',                 'Haloperidol',                  'Haloperidol',                  'Haloperidol',                  'N05', 'substance', '5093',   'Haloperidol',                  'N05AD01'),
  (3872070236, 'Risperidone',                 'Risperidona',                  'Risperidona',                  'Risperidone',                  'N05', 'substance', '32626',  'Risperidone',                  'N05AX08'),
  (3872070237, 'Quetiapine',                  'Quetiapina',                   'Quetiapina',                   'Quetiapine',                   'N05', 'substance', '32627',  'Quetiapine',                   'N05AH04'),
  (3872070238, 'Lithium',                     'Lítio',                        'Litio',                        'Lithium',                      'N05', 'substance', '6448',   'Lithium',                      'N05AN01'),

  -- ═══ MEDICAMENTOS — METABOLISMO / OUTROS ═══
  (3872070241, 'Glucagon',                    'Glucagon',                     'Glucagón',                     'Glucagon',                     'H04', 'substance', '4832',  'Glucagon',                     'H04AA01'),
  (3872070242, 'Allopurinol',                 'Alopurinol',                   'Alopurinol',                   'Allopurinol',                  'M04', 'substance', '519',   'Allopurinol',                  'M04AA01'),
  (3872070243, 'Colchicine',                  'Colchicina',                   'Colchicina',                   'Colchicine',                   'M04', 'substance', '3009',  'Colchicine',                   'M04AC01'),

  -- ═══ MEDICAMENTOS — OBSTETRÍCIA / GINECOLOGIA ═══
  (3872070251, 'Misoprostol',                 'Misoprostol',                  'Misoprostol',                  'Misoprostol',                  'G02', 'substance', '6810',  'Misoprostol',                  'G02AD06'),
  (3872070252, 'Mifepristone',                'Mifepristona',                 'Mifepristona',                 'Mifepristone',                 'G03', 'substance', '13737', 'Mifepristone',                 'G03XB01'),
  (3872070253, 'Medroxyprogesterone',         'Medroxiprogesterona',          'Medroxiprogesterona',          'Medroxyprogesterone',          'G03', 'substance', '6811',  'Medroxyprogesterone',          'G03AC06'),
  (3872070254, 'Levonorgestrel',              'Levonorgestrel',               'Levonorgestrel',               'Levonorgestrel',               'G03', 'substance', '6373',  'Levonorgestrel',               'G03AC03'),
  (3872070255, 'Estradiol',                   'Estradiol',                    'Estradiol',                    'Estradiol',                    'G03', 'substance', '4083',  'Estradiol',                    'G03CA03'),
  (3872070256, 'Conjugated estrogens',        'Estrogênios conjugados',       'Estrógenos conjugados',        'Conjugated estrogens',         'G03', 'substance', '4084',  'Conjugated estrogens',         'G03CA57'),
  (3872070257, 'Oxytocin',                    'Ocitocina',                    'Oxitocina',                    'Oxytocin',                     'H01', 'substance', '7832',  'Oxytocin',                     'H01BB02'),
  (3872070258, 'Ergometrine',                 'Ergometrina',                  'Ergometrina',                  'Ergometrine',                  'G02', 'substance', '4177',  'Ergometrine',                  'G02AB03'),
  (3872070259, 'Magnesium sulfate',           'Sulfato de magnésio',          'Sulfato de magnesio',          'Magnesium sulfate',            'B05', 'substance', '9943',  'Magnesium sulfate',            'B05XA05'),
  (3872070260, 'Folic acid',                  'Ácido fólico',                 'Ácido fólico',                 'Folic acid',                   'B03', 'substance', '6360',  'Folic acid',                   'B03BB01'),
  (3872070261, 'Ferrous sulfate',             'Sulfato ferroso',              'Sulfato ferroso',              'Ferrous sulfate',              'B03', 'substance', '4440',  'Ferrous sulfate',              'B03AA07'),
  (3872070262, 'Iron sucrose',                'Sacarose de ferro',            'Sacarosa de hierro',           'Iron sucrose',                 'B03', 'substance', '23653', 'Iron sucrose',                 'B03AC02'),
  (3872070263, 'Cyanocobalamin (B12)',        'Cianocobalamina (B12)',        'Cianocobalamina (B12)',        'Cyanocobalamin (B12)',         'B03', 'substance', '11119', 'Cyanocobalamin',               'B03BA01'),

  -- ═══ MEDICAMENTOS — DERMATOLÓGICOS ═══
  (3872070271, 'Mupirocin',                   'Mupirocina',                   'Mupirocina',                   'Mupirocin',                    'D06', 'substance', '5924',  'Mupirocin',                    'D06AX09'),
  (3872070272, 'Fusidic acid',                'Ácido fusídico',               'Ácido fusídico',               'Fusidic acid',                 'D06', 'substance', '4459',  'Fusidic acid',                 'D06AX01'),
  (3872070273, 'Ketoconazole (topical)',      'Cetoconazol (tópico)',         'Ketoconazol (tópico)',         'Ketoconazole (topical)',       'D01', 'substance', '6130',  'Ketoconazole',                 'D01AC08'),
  (3872070274, 'Clotrimazole',                'Clotrimazol',                  'Clotrimazol',                  'Clotrimazole',                 'D01', 'substance', '2582',  'Clotrimazole',                 'D01AC01'),
  (3872070275, 'Permethrin',                  'Permetrina',                   'Permetrina',                   'Permethrin',                   'P03', 'substance', '7981',  'Permethrin',                   'P03AC04'),
  (3872070276, 'Benzoyl peroxide',            'Peróxido de benzoíla',         'Peróxido de benzoilo',         'Benzoyl peroxide',             'D10', 'substance', '1292',  'Benzoyl peroxide',             'D10AE01'),
  (3872070277, 'Tretinoin',                   'Tretinoína',                   'Tretinoína',                   'Tretinoin',                    'D10', 'substance', '10734', 'Tretinoin',                    'D10AD01'),
  (3872070278, 'Hydroquinone',                'Hidroquinona',                 'Hidroquinona',                 'Hydroquinone',                 'D11', 'substance', '5517',  'Hydroquinone',                 'D11AX11'),
  (3872070279, 'Silver sulfadiazine',         'Sulfadiazina de prata',        'Sulfadiazina de plata',        'Silver sulfadiazine',          'D06', 'substance', '10181', 'Silver sulfadiazine',          'D06BA01'),

  -- ═══ MEDICAMENTOS — ANESTÉSICOS / CONTRASTE ═══
  (3872070281, 'Lidocaine',                   'Lidocaína',                    'Lidocaína',                    'Lidocaine',                    'N01', 'substance', '6387',  'Lidocaine',                    'N01BB02'),
  (3872070282, 'Bupivacaine',                 'Bupivacaína',                  'Bupivacaína',                  'Bupivacaine',                  'N01', 'substance', '1809',  'Bupivacaine',                  'N01BB01'),
  (3872070283, 'Propofol',                    'Propofol',                     'Propofol',                     'Propofol',                     'N01', 'substance', '8782',  'Propofol',                     'N01AX10'),
  (3872070284, 'Ketamine',                    'Cetamina',                     'Ketamina',                     'Ketamine',                     'N01', 'substance', '6812',  'Ketamine',                     'N01AX03'),
  (3872070285, 'Sevoflurane',                 'Sevoflurano',                  'Sevoflurano',                  'Sevoflurane',                  'N01', 'substance', '11120', 'Sevoflurane',                  'N01AB08'),
  (3872070286, 'Iopamidol',                   'Iopamidol',                    'Iopamidol',                    'Iopamidol',                    'V08', 'substance', '5992',  'Iopamidol',                    'V08AB04'),
  (3872070287, 'Iohexol',                     'Iohexol',                      'Iohexol',                      'Iohexol',                      'V08', 'substance', '6039',  'Iohexol',                      'V08AB02'),
  (3872070288, 'Gadolinium-based contrast',   'Contraste à base de gadolínio','Contraste a base de gadolinio', 'Gadolinium-based contrast',    'V08', 'substance', '5692',  'Gadolinium',                   'V08CA01'),

  -- ═══ MEDICAMENTOS — ANTIMALÁRICOS ═══
  (3872070291, 'Artemether + Lumefantrine',   'Arteméter + Lumefantrina',     'Arteméter + Lumefantrina',     'Artemether + Lumefantrine',    'P01', 'substance', '1047253','Artemether + Lumefantrine',   'P01BF01'),
  (3872070292, 'Chloroquine',                 'Cloroquina',                   'Cloroquina',                   'Chloroquine',                  'P01', 'substance', '2393',  'Chloroquine',                  'P01BA01'),

  -- ═══ MEDICAMENTOS — IMUNOSSUPRESSORES ═══
  (3872070301, 'Azathioprine',                'Azatioprina',                  'Azatioprina',                  'Azathioprine',                 'L04', 'substance', '1256',  'Azathioprine',                 'L04AX01'),
  (3872070302, 'Methotrexate',                'Metotrexato',                  'Metotrexato',                  'Methotrexate',                 'L01', 'substance', '6851',  'Methotrexate',                 'L01BA01'),
  (3872070303, 'Cyclosporine',                'Ciclosporina',                 'Ciclosporina',                 'Cyclosporine',                 'L04', 'substance', '3008',  'Cyclosporine',                 'L04AD01'),

  -- ═══ MEDICAMENTOS — EMERGÊNCIA ═══
  (3872070311, 'Epinephrine / Adrenaline',    'Epinefrina / Adrenalina',      'Epinefrina / Adrenalina',      'Epinephrine / Adrenaline',     'C01', 'substance', '3992',  'Epinephrine',                  'C01CA24'),
  (3872070312, 'Norepinephrine',              'Norepinefrina',                'Norepinefrina',                'Norepinephrine',               'C01', 'substance', '7512',  'Norepinephrine',               'C01CA03'),
  (3872070313, 'Atropine',                    'Atropina',                     'Atropina',                     'Atropine',                     'A03', 'substance', '1223',  'Atropine',                     'A03BA01'),
  (3872070314, 'Sodium bicarbonate',          'Bicarbonato de sódio',         'Bicarbonato de sodio',         'Sodium bicarbonate',           'B05', 'substance', '9863',  'Sodium bicarbonate',           'B05CB04'),

  -- ═══ ALERGIAS / EFEITOS ADVERSOS ═══
  (419076003, 'Allergic reaction',           'Reação alérgica',                     'Reacción alérgica',                    'Allergic reaction',                'T78', 'finding', NULL, NULL, NULL),
  (247472004, 'Hives / Urticaria',           'Urticária',                           'Urticaria',                            'Hives / Urticaria',                'L50',  'finding', NULL, NULL, NULL),
  (39579001,  'Anaphylaxis',                 'Anafilaxia',                          'Anafilaxia',                           'Anaphylaxis',                      'T78',  'finding', NULL, NULL, NULL),
  (271807003, 'Eruption of skin',            'Erupção cutânea',                     'Erupción cutánea',                     'Eruption of skin',                 'L27',  'finding', NULL, NULL, NULL),
  (126485002, 'Urticarial rash',             'Exantema urticariforme',              'Exantema urticariforme',               'Urticarial rash',                  'L50',  'finding', NULL, NULL, NULL),
  (91175000,  'Anaphylactic shock',          'Choque anafilático',                  'Shock anafiláctico',                   'Anaphylactic shock',               'T78',  'finding', NULL, NULL, NULL),
  (200877005, 'Contact dermatitis',          'Dermatite de contato',                'Dermatitis de contacto',               'Contact dermatitis',               'L23',  'finding', NULL, NULL, NULL),
  (24079001,  'Atopic dermatitis',           'Dermatite atópica',                   'Dermatitis atópica',                   'Atopic dermatitis',                'L20',  'finding', NULL, NULL, NULL),
  (1806006,   'Allergic rhinitis',           'Rinite alérgica',                     'Rinitis alérgica',                     'Allergic rhinitis',                'J30',  'finding', NULL, NULL, NULL),
  (195967002, 'Drug-induced asthma',         'Asma induzida por medicamentos',      'Asma inducida por medicamentos',       'Drug-induced asthma',              'J45',  'finding', NULL, NULL, NULL),
  (292731003, 'Adverse drug reaction',       'Reação adversa a medicamento (RAM)',  'Reacción adversa a medicamento (RAM)',  'Adverse drug reaction',            'Y57',  'finding', NULL, NULL, NULL),

  -- ═══ VACINAS (Calendário Nacional BR + PAI-OPS PY + Argentina) ═══
  (871833000, 'BCG vaccine',                  'Vacina BCG',                              'Vacuna BCG',                              'BCG vaccine',                  NULL, 'substance', NULL, 'BCG', NULL),
  (396435001, 'Hepatitis B vaccine',          'Vacina Hepatite B',                       'Vacuna Hepatitis B',                      'Hepatitis B vaccine',          NULL, 'substance', NULL, 'HBsAg', NULL),
  (412530001, 'DTPa vaccine (acellular)',     'Vacina DTPa (acelular)',                  'Vacuna DTPa (acelular)',                  'DTPa vaccine (acellular)',     NULL, 'substance', NULL, 'DTaP', NULL),
  (412530002, 'DTP vaccine (whole cell)',     'Vacina DTP (célula inteira)',             'Vacuna DTP (célula entera)',              'DTP vaccine (whole cell)',     NULL, 'substance', NULL, 'DTP', NULL),
  (412530003, 'Tetanus toxoid vaccine',       'Vacina Toxóide Tetânico',                 'Vacuna Toxoide Tetánico',                 'Tetanus toxoid vaccine',       NULL, 'substance', NULL, 'TT', NULL),
  (412530004, 'Hib vaccine',                  'Vacina Hib',                              'Vacuna Hib',                              'Hib vaccine',                  NULL, 'substance', NULL, 'Hib', NULL),
  (396435002, 'Polio vaccine (IPV)',          'Vacina Pólio inativada (IPV)',            'Vacuna Polio inactivada (IPV)',           'Polio vaccine (IPV)',          NULL, 'substance', NULL, 'IPV', NULL),
  (396435003, 'Polio vaccine (OPV)',          'Vacina Pólio oral (OPV)',                 'Vacuna Polio oral (OPV)',                 'Polio vaccine (OPV)',          NULL, 'substance', NULL, 'OPV', NULL),
  (396435004, 'Pneumococcal conjugate',       'Vacina Pneumocócica conjugada',           'Vacuna Neumocócica conjugada',            'Pneumococcal conjugate',       NULL, 'substance', NULL, 'PCV', NULL),
  (396435005, 'Pneumococcal polysaccharide',  'Vacina Pneumocócica polissacarídica',     'Vacuna Neumocócica polisacárida',         'Pneumococcal polysaccharide',  NULL, 'substance', NULL, 'PPSV23', NULL),
  (396435006, 'Meningococcal C',              'Vacina Meningocócica C',                  'Vacuna Meningocócica C',                  'Meningococcal C',              NULL, 'substance', NULL, 'MenC', NULL),
  (396435007, 'Meningococcal ACWY',           'Vacina Meningocócica ACWY',               'Vacina Meningocócica ACWY',               'Meningococcal ACWY',           NULL, 'substance', NULL, 'MenACWY', NULL),
  (396435008, 'Rotavirus vaccine',            'Vacina Rotavírus',                        'Vacuna Rotavirus',                        'Rotavirus vaccine',            NULL, 'substance', NULL, 'RV', NULL),
  (396435009, 'Yellow fever vaccine',         'Vacina Febre Amarela',                    'Vacuna Fiebre Amarilla',                  'Yellow fever vaccine',         NULL, 'substance', NULL, 'YF', NULL),
  (396435010, 'MMR vaccine',                  'Vacina Tríplice Viral (SCR)',             'Vacuna Triple Viral (SRP)',               'MMR vaccine',                  NULL, 'substance', NULL, 'MMR', NULL),
  (396435011, 'Varicella vaccine',            'Vacina Varicela',                         'Vacina Varicela',                         'Varicella vaccine',            NULL, 'substance', NULL, 'VAR', NULL),
  (396435012, 'Hepatitis A vaccine',          'Vacina Hepatite A',                       'Vacuna Hepatitis A',                      'Hepatitis A vaccine',          NULL, 'substance', NULL, 'HAV', NULL),
  (396435013, 'HPV vaccine (Quadrivalent)',   'Vacina HPV (Quadrivalente)',              'Vacuna VPH (Tetravalente)',               'HPV vaccine (Quadrivalent)',   NULL, 'substance', NULL, 'HPV4', NULL),
  (396435014, 'HPV vaccine (Nonavalent)',     'Vacina HPV (Nonavalente)',                'Vacuna VPH (Nonavalente)',                'HPV vaccine (Nonavalent)',     NULL, 'substance', NULL, 'HPV9', NULL),
  (396435015, 'Influenza (inactivated)',      'Vacina Influenza (inativada)',            'Vacuna Influenza (inactivada)',           'Influenza (inactivated)',      NULL, 'substance', NULL, 'IIV', NULL),
  (396435016, 'Influenza (LAIV)',             'Vacina Influenza (atenuada - LAIV)',      'Vacuna Influenza (atenuada - LAIV)',      'Influenza (LAIV)',             NULL, 'substance', NULL, 'LAIV', NULL),
  (396435017, 'COVID-19 mRNA vaccine',        'Vacina COVID-19 (mRNA)',                  'Vacuna COVID-19 (mRNA)',                  'COVID-19 mRNA vaccine',        NULL, 'substance', NULL, 'mRNA', NULL),
  (396435018, 'COVID-19 viral vector',        'Vacina COVID-19 (vetor viral)',           'Vacuna COVID-19 (vector viral)',          'COVID-19 viral vector',        NULL, 'substance', NULL, 'Vv', NULL),
  (396435019, 'Rabies vaccine',               'Vacina Antirrábica',                      'Vacuna Antirrábica',                      'Rabies vaccine',               NULL, 'substance', NULL, 'Rab', NULL),
  (396435020, 'Typhoid vaccine (Vi)',         'Vacina Febre Tifoide (Vi)',               'Vacuna Fiebre Tifoidea (Vi)',             'Typhoid vaccine (Vi)',         NULL, 'substance', NULL, 'Vi', NULL),
  (396435021, 'Tdap (adult)',                 'Vacina Tdap (adulto - dTpa)',             'Vacuna Tdap (adulto - dTpa)',             'Tdap (adult)',                 NULL, 'substance', NULL, 'Tdap', NULL),
  (396435022, 'Herpes Zoster vaccine',        'Vacina Herpes-zóster',                    'Vacuna Herpes zóster',                    'Herpes Zoster vaccine',        NULL, 'substance', NULL, 'HZ', NULL),
  (396435023, 'Dengue vaccine',               'Vacina Dengue',                           'Vacuna Dengue',                           'Dengue vaccine',               NULL, 'substance', NULL, 'DEN', NULL),
  (396435024, 'Chikungunya vaccine',          'Vacina Chikungunya',                      'Vacuna Chikungunya',                      'Chikungunya vaccine',          NULL, 'substance', NULL, 'CHIK', NULL),

  -- ═══ EXCIPIENTES / INGREDIENTES INATIVOS ═══
  (1003755001, 'Lactose',                     'Lactose',                          'Lactosa',                          'Lactose',                       NULL, 'substance', NULL, 'Lactose monohydrate', NULL),
  (1003755002, 'Sucrose',                     'Sacarose',                         'Sacarosa',                         'Sucrose',                       NULL, 'substance', NULL, 'Sucrose', NULL),
  (1003755003, 'Gluten',                      'Glúten',                           'Gluten',                           'Gluten',                        NULL, 'substance', NULL, 'Gluten', NULL),
  (1003755004, 'Soy lecithin',                'Lecitina de soja',                 'Lecitina de soja',                 'Soy lecithin',                  NULL, 'substance', NULL, 'Lecithin (soy)', NULL),
  (1003755005, 'Propylene glycol',            'Propilenoglicol',                  'Propilenglicol',                   'Propylene glycol',              NULL, 'substance', NULL, 'Propylene glycol', NULL),
  (1003755006, 'Polyethylene glycol (PEG)',   'Polietilenoglicol (PEG)',          'Polietilenglicol (PEG)',           'Polyethylene glycol (PEG)',     NULL, 'substance', NULL, 'PEG', NULL),
  (1003755007, 'Sodium benzoate',             'Benzoato de sódio',                'Benzoato de sodio',                'Sodium benzoate',               NULL, 'substance', NULL, 'Sodium benzoate', NULL),
  (1003755008, 'Tartrazine',                  'Tartrazina',                       'Tartrazina',                       'Tartrazine (Yellow No. 5)',     NULL, 'substance', NULL, 'Tartrazine', NULL),
  (1003755009, 'Aspartame',                   'Aspartame',                        'Aspartamo',                        'Aspartame',                     NULL, 'substance', NULL, 'Aspartame', NULL),
  (1003755010, 'Saccharin',                   'Sacarina',                         'Sacarina',                         'Saccharin',                     NULL, 'substance', NULL, 'Saccharin', NULL),
  (1003755011, 'Ethanol (excipient)',         'Etanol (excipiente)',              'Etanol (excipiente)',              'Ethanol (excipient)',           NULL, 'substance', NULL, 'Ethanol', NULL),
  (1003755012, 'Benzyl alcohol',              'Álcool benzílico',                 'Alcohol bencílico',                'Benzyl alcohol',                NULL, 'substance', NULL, 'Benzyl alcohol', NULL),
  (1003755013, 'Latex (natural rubber)',      'Látex (borracha natural)',         'Látex (caucho natural)',           'Latex (natural rubber)',        NULL, 'substance', NULL, 'Natural rubber latex', NULL);

-- Deduplica + INSERT idempotente
INSERT INTO public.snomed_concepts
  (concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis, rxnorm_code, inn, atc_code)
SELECT DISTINCT ON (concept_id)
  concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis, rxnorm_code, inn, atc_code
FROM _snomed_seed_v2
ORDER BY concept_id
ON CONFLICT (concept_id) DO UPDATE SET
  preferred_term = EXCLUDED.preferred_term,
  term_pt        = EXCLUDED.term_pt,
  term_es        = EXCLUDED.term_es,
  term_en        = EXCLUDED.term_en,
  cid10_code     = EXCLUDED.cid10_code,
  semantic_axis  = EXCLUDED.semantic_axis,
  rxnorm_code    = COALESCE(EXCLUDED.rxnorm_code, public.snomed_concepts.rxnorm_code),
  inn            = COALESCE(EXCLUDED.inn,            public.snomed_concepts.inn),
  atc_code       = COALESCE(EXCLUDED.atc_code,       public.snomed_concepts.atc_code),
  is_active      = true,
  updated_at     = timezone('utc'::text, now());

DROP TABLE _snomed_seed_v2;

-- ============================================================
-- NOTA OPERACIONAL
-- ============================================================
-- 1. IMPORTANTE: Os concept_ids gerados (3872070081..1003755013)
--    são PLACEHOLDERS únicos do IAMED. Para interoperabilidade
--    com sistemas externos (DATASUS, HL7 FHIR), o ideal é usar
--    os IDs oficiais do release SNOMED-CT.
--
-- 2. Para o release oficial, baixe o pacote do DATASUS/MLDS
--    e faça \COPY sobrescrevendo os placeholders. Mantenha o
--    campo inn / atc_code / rxnorm_code para mapeamento.
--
-- 3. INN (International Nonproprietary Name) é o nome genérico
--    oficial reconhecido pela OMS. Mesmo campo em todos os idiomas.
-- ============================================================
