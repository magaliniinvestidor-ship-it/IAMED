'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';

export interface CrmCampaign {
  id: string;
  nome: string;
  tipo?: string;
  template?: string;
  segmento_alvo?: string;
  mensagem?: string;
  data_disparo?: string;
  status?: string;
  total_contatos?: number;
  total_enviados?: number;
  total_falhas?: number;
  total_optout?: number;
  consentimento_obrigatorio?: boolean;
  created_by?: string;
}

export interface CrmLead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  origem?: string;
  data_primeiro_contato?: string;
  etapa_funil?: string;
  ultimo_contato?: string;
  interesse?: string;
  observacoes?: string;
  convertido?: boolean;
}

export interface CrmOpportunity {
  id: string;
  paciente_nome: string;
  paciente_telefone?: string;
  tipo?: string;
  descricao?: string;
  valor_estimado?: number;
  status?: string;
  probabilidade?: number;
  data_criacao?: string;
  data_fechamento?: string;
  responsavel?: string;
}

export interface CrmOptOut {
  id: string;
  paciente_nome?: string;
  paciente_contato?: string;
  canal?: string;
  data_optout?: string;
  confirmado?: boolean;
}

export interface NpsSurvey {
  id: string;
  paciente_nome?: string;
  data_atendimento?: string;
  data_resposta?: string;
  score?: number;
  categoria?: string;
  origem?: string;
  respondido?: boolean;
}

export function useCrm(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const campaignsQuery = useSupabaseQuery<CrmCampaign>('crm_campaigns', {
    select: '*',
    order: { column: 'data_disparo', ascending: false },
    limit: 100,
    enabled,
  });

  const leadsQuery = useSupabaseQuery<CrmLead>('crm_leads', {
    select: '*',
    order: { column: 'data_primeiro_contato', ascending: false },
    limit: 200,
    enabled,
  });

  const oppsQuery = useSupabaseQuery<CrmOpportunity>('crm_opportunities', {
    select: '*',
    order: { column: 'data_criacao', ascending: false },
    limit: 200,
    enabled,
  });

  const optoutsQuery = useSupabaseQuery<CrmOptOut>('crm_optouts', {
    select: '*',
    order: { column: 'data_optout', ascending: false },
    limit: 100,
    enabled,
  });

  const npsQuery = useSupabaseQuery<NpsSurvey>('crm_nps_surveys', {
    select: '*',
    order: { column: 'data_atendimento', ascending: false },
    limit: 100,
    enabled,
  });

  const genModuleId = useModuleId();

  const createCampaign = useCallback(
    async (campaign: Partial<CrmCampaign>) => {
      if (!supabase) return null;
      const id = campaign.id || (await genModuleId('camp'));
      const { data, error } = await supabase
        .from('crm_campaigns')
        .insert({
          ...campaign,
          id,
          status: campaign.status ?? 'rascunho',
          consentimento_obrigatorio: campaign.consentimento_obrigatorio ?? true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.createCampaign]', error.message);
        return null;
      }
      await campaignsQuery.refetch();
      return data as CrmCampaign;
    },
    [genModuleId, campaignsQuery]
  );

  const createLead = useCallback(
    async (lead: Partial<CrmLead>) => {
      if (!supabase) return null;
      const id = lead.id || (await genModuleId('lead'));
      const { data, error } = await supabase
        .from('crm_leads')
        .insert({
          ...lead,
          id,
          etapa_funil: lead.etapa_funil ?? 'novo',
          convertido: lead.convertido ?? false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.createLead]', error.message);
        return null;
      }
      await leadsQuery.refetch();
      return data as CrmLead;
    },
    [genModuleId, leadsQuery]
  );

  const updateLead = useCallback(
    async (id: string, updates: Partial<CrmLead>) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('crm_leads')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.updateLead]', error.message);
        return null;
      }
      await leadsQuery.refetch();
      return data as CrmLead;
    },
    [leadsQuery]
  );

  const createOpportunity = useCallback(
    async (opp: Partial<CrmOpportunity>) => {
      if (!supabase) return null;
      const id = opp.id || (await genModuleId('opp'));
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          ...opp,
          id,
          status: opp.status ?? 'aberta',
          probabilidade: opp.probabilidade ?? 50,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.createOpportunity]', error.message);
        return null;
      }
      await oppsQuery.refetch();
      return data as CrmOpportunity;
    },
    [genModuleId, oppsQuery]
  );

  const updateOpportunity = useCallback(
    async (id: string, updates: Partial<CrmOpportunity>) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.updateOpportunity]', error.message);
        return null;
      }
      await oppsQuery.refetch();
      return data as CrmOpportunity;
    },
    [oppsQuery]
  );

  const registerOptOut = useCallback(
    async (optout: Partial<CrmOptOut>) => {
      if (!supabase) return null;
      const id = optout.id || (await genModuleId('opt'));
      const { data, error } = await supabase
        .from('crm_optouts')
        .insert({
          ...optout,
          id,
          confirmado: optout.confirmado ?? true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.registerOptOut]', error.message);
        return null;
      }
      await optoutsQuery.refetch();
      return data as CrmOptOut;
    },
    [genModuleId, optoutsQuery]
  );

  const createNpsSurvey = useCallback(
    async (nps: Partial<NpsSurvey>) => {
      if (!supabase) return null;
      const id = nps.id || (await genModuleId('nps'));
      const { data, error } = await supabase
        .from('crm_nps_surveys')
        .insert({
          ...nps,
          id,
          score: nps.score ?? 0,
          respondido: nps.respondido ?? false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useCrm.createNpsSurvey]', error.message);
        return null;
      }
      await npsQuery.refetch();
      return data as NpsSurvey;
    },
    [genModuleId, npsQuery]
  );

  return {
    campaigns: (campaignsQuery.data as CrmCampaign[]) || [],
    leads: (leadsQuery.data as CrmLead[]) || [],
    opportunities: (oppsQuery.data as CrmOpportunity[]) || [],
    optouts: (optoutsQuery.data as CrmOptOut[]) || [],
    npsSurveys: (npsQuery.data as NpsSurvey[]) || [],
    loading:
      campaignsQuery.loading ||
      leadsQuery.loading ||
      oppsQuery.loading ||
      optoutsQuery.loading ||
      npsQuery.loading,
    error:
      campaignsQuery.error ||
      leadsQuery.error ||
      oppsQuery.error ||
      optoutsQuery.error ||
      npsQuery.error,
    refetch: campaignsQuery.refetch,
    createCampaign,
    createLead,
    updateLead,
    createOpportunity,
    updateOpportunity,
    registerOptOut,
    createNpsSurvey,
  };
}
