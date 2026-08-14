-- ============================================================
-- SEED drug_interactions (Segurança Medicamentosa - Receituário)
-- Consistente com os ingredientes do drug_catalog.
-- Idempotente: pode rodar várias vezes.
-- ============================================================

-- Backfill dos registros existentes com ingredientes do catálogo
UPDATE public.drug_interactions SET
  drug_a_ingredient = CASE drug_a
    WHEN 'Ibuprofeno' THEN 'Ibuprofeno'
    WHEN 'Amoxicilina' THEN 'Amoxicilina'
    WHEN 'Clonazepam' THEN 'Clonazepam'
    WHEN 'Dipirona' THEN 'Dipirona Sódica'
    WHEN 'Losartana' THEN 'Losartana Potássica'
    ELSE drug_a_ingredient END,
  drug_b_ingredient = CASE drug_b
    WHEN 'Losartana' THEN 'Losartana Potássica'
    WHEN 'Omeprazol' THEN 'Omeprazol'
    WHEN 'Metilfenidato' THEN 'Metilfenidato'
    WHEN 'Ibuprofeno' THEN 'Ibuprofeno'
    ELSE drug_b_ingredient END,
  source = 'dinavisa'
WHERE source IS NULL OR source = 'local';

-- Novas interações reais (ON CONFLICT id DO NOTHING)
INSERT INTO public.drug_interactions
  (id, drug_a, drug_b, drug_a_ingredient, drug_b_ingredient, severity, description, recommendation, source)
VALUES
  ('int_6',  'Sulfato Ferroso', 'Omeprazol',          'Sulfato Ferroso', 'Omeprazol',          'moderada',
   'Inibidores da bomba de prótons reduzem a absorção do ferro não-heme. Redução do efeito terapêutico do ferro.',
   'Tomar o ferro com 2h de intervalo do omeprazol. Preferir ácido ascórbico para melhorar absorção.', 'dinavisa'),
  ('int_7',  'Sulfato Ferroso', 'Amoxicilina',        'Sulfato Ferroso', 'Amoxicilina',        'leve',
   'O ferro pode reduzir a absorção de antibióticos tetraciclinas/quais antibióticos administrados via oral.',
   'Administrar amoxicilina com 2h de intervalo do ferro.', 'dinavisa'),
  ('int_8',  'Paracetamol',     'Dipirona',           'Paracetamol',     'Dipirona Sódica',    'leve',
   'Efeito aditivo analgésico/antipirético. Risco de hepatotoxicidade com doses altas e uso prolongado.',
   'Evitar associação desnecessária. Monitorar função hepática em uso prolongado.', 'dinavisa'),
  ('int_9',  'Paracetamol',     'Ibuprofeno',         'Paracetamol',     'Ibuprofeno',         'leve',
   'Efeito analgésico aditivo. Aumento do risco renal e gastrointestinal com uso prolongado.',
   'Usar intervalos adequados entre doses. Não exceder 3g/dia de paracetamol.', 'dinavisa'),
  ('int_10', 'Omeprazol',       'Clonazepam',         'Omeprazol',       'Clonazepam',         'leve',
   'O omeprazol pode inibir o CYP3A4 e prolongar o efeito sedativo das benzodiazepinas.',
   'Monitorar sedação excessiva. Ajustar dose de clonazepam se necessário.', 'dinavisa'),
  ('int_11', 'Ibuprofeno',      'Sulfato Ferroso',    'Ibuprofeno',      'Sulfato Ferroso',    'moderada',
   'AINEs podem causar irritação gastrointestinal e o ferro agravar o desconforto gástrico.',
   'Administrar com alimentos. Considerar gastroproteção.', 'dinavisa'),
  ('int_12', 'Dipirona',        'Amoxicilina',        'Dipirona Sódica', 'Amoxicilina',        'leve',
   'Possível aumento de risco de reações cutâneas quando associados.',
   'Vigiar rash cutâneo. Suspender ambos se suspeita de reação.', 'dinavisa'),
  ('int_13', 'Losartana',       'Ibuprofeno',         'Losartana Potássica', 'Ibuprofeno',      'moderada',
   'AINEs reduzem o efeito anti-hipertensivo dos bloqueadores do receptor de angiotensina.',
   'Monitorar pressão arterial. Considerar alternativa analgésica.', 'dinavisa'),
  ('int_14', 'Paracetamol',     'Omeprazol',          'Paracetamol',     'Omeprazol',          'leve',
   'Sem interação clinicamente relevante. Monitoramento rotineiro apenas.',
   'Sem ajuste de dose necessário.', 'dinavisa'),
  ('int_15', 'Amoxicilina',     'Clonazepam',         'Amoxicilina',     'Clonazepam',         'leve',
   'Associação geralmente segura. Possível redução do efeito de anticoncepcionais orais.',
   'Sem ajuste de dose necessário na maioria dos casos.', 'dinavisa'),
  ('int_16', 'Sulfato Ferroso', 'Paracetamol',        'Sulfato Ferroso', 'Paracetamol',        'leve',
   'Sem interação clinicamente relevante.',
   'Sem ajuste de dose necessário.', 'dinavisa'),
  ('int_17', 'Metilfenidato',   'Ibuprofeno',         'Metilfenidato',   'Ibuprofeno',         'leve',
   'Sem interação significativa. Monitorar pressão arterial.',
   'Monitorar PA em pacientes hipertensos.', 'dinavisa');

-- Teste (pode ignorar)
SELECT count(*) AS total_interacoes FROM public.drug_interactions;