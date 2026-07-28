-- Verificar quais tabelas do Módulo 3 (Prontuário HCE) existem no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Listar todas as tabelas existentes no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar especificamente as tabelas do Módulo 3
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anamnese' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_anamnese,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physical_exams' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_physical_exams,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'soap_notes' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_soap_notes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diagnoses' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_diagnoses,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_prescriptions,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_requests' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_exam_requests,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'procedures' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_procedures,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinical_attachments' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_clinical_attachments,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'electronic_signatures' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_electronic_signatures,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_controls' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_access_controls,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_timeline' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_patient_timeline,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinical_history' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status_clinical_history;

-- 3. Estrutura das tabelas que existem (colunas e tipos)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'anamnese', 
    'physical_exams', 
    'soap_notes', 
    'diagnoses',
    'prescriptions',
    'exam_requests',
    'procedures',
    'clinical_attachments',
    'electronic_signatures',
    'access_controls',
    'patient_timeline',
    'clinical_history'
  )
ORDER BY table_name, ordinal_position;