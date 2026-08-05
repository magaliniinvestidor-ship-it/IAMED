-- ════════════════════════════════════════════
-- BLOCO 11: Índices de Alta Performance 100% Seguros e Tolerantes a Falhas
-- Tenta criar cada índice e ignora silenciosamente se a tabela/coluna não existir.
-- ════════════════════════════════════════════

DO $$
BEGIN
  -- 1. Pacientes
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_patients_doc ON public.patients (document_number);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients (name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 2. Agendamentos
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (date);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments (doctor_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments (patient_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 3. HCE / Atendimento Clínico (Prontuário)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_clinical_history_patient ON public.clinical_history (patient_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON public.soap_notes (patient_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions (patient_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. Internação e Centro Cirúrgico
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_surgeries_date ON public.surgeries (scheduled_date);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_surgeries_status ON public.surgeries (status);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_hospitalizations_status ON public.hospitalizations (status);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_clinical_beds_status ON public.clinical_beds (status);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 5. Estoque e Farmácia
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_pharma_lots_expiry ON public.lot_controls (expiry_date);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_pharma_lots_status ON public.lot_controls (status);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements (item_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 6. Faturamento SIFEN e DTEs
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_dtes_cdc ON public.dtes (cdc);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_financial_records_date ON public.financial_records (date);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 7. Medicina do Trabalho
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_trabalhadores_empresa ON public.trabalhadores (empresa_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_exames_trabalhador ON public.exames_ocupacionais (trabalhador_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
