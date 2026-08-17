-- Storage bucket para anexos clínicos do HCE (PDF, DICOM, JPEG, PNG, MP4, WAV)
-- Limite: 50 MB por arquivo (validado também em Zod)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-attachments',
  'clinical-attachments',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/dicom',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Política: profissionais autenticados podem inserir na pasta attachments/<patient_id>/
DROP POLICY IF EXISTS "clinical_attachments_insert_authenticated" ON storage.objects;
CREATE POLICY "clinical_attachments_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinical-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
);

-- Política: leitura para profissionais autenticados (acesso é controlado via HCE PermissionGate)
DROP POLICY IF EXISTS "clinical_attachments_select_authenticated" ON storage.objects;
CREATE POLICY "clinical_attachments_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clinical-attachments');

-- Política: delete para o criador do anexo
DROP POLICY IF EXISTS "clinical_attachments_delete_authenticated" ON storage.objects;
CREATE POLICY "clinical_attachments_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinical-attachments');
