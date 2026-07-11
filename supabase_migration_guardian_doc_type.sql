-- Migration: Adicionar coluna guardian_document_type na tabela patients
-- Data: 2026-07-11
-- Descrição: Adiciona o tipo de documento do responsável legal (CI, Passaporte, RG, Outro)

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS guardian_document_type TEXT DEFAULT 'CI';
