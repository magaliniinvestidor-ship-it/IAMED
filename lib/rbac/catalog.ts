// ============================================================
// RBAC: catálogo central Módulo → Abas (Fase 1)
//
// Chave de permissão de aba: `tab_<modulo>_<aba>` (ex.: tab_hce_soap)
// gravada no MESMO array jsonb das demais permissões.
//
// Compatibilidade (fail-open): se o usuário NÃO tem nenhuma chave
// tab_<modulo>_* no array, TODAS as abas do módulo ficam visíveis.
// Assim, configurações antigas continuam funcionando sem migration.
// ============================================================

export interface RbacTabDef {
  key: string;
  labelKey?: string;
  literalLabel?: string;
}

export interface RbacModuleDef {
  id: string;
  labelKey: string;
  tabs: RbacTabDef[];
}

export const RBAC_MODULE_CATALOG: RbacModuleDef[] = [
  {
    id: 'reception',
    labelKey: 'submodule_1',
    tabs: [
      { key: 'recepcao', labelKey: 'rcpt_tab_reception' },
      { key: 'distribuicao', labelKey: 'rcpt_tab_attendances' },
      { key: 'locais', labelKey: 'rcpt_tab_locations' },
      { key: 'notificacoes', labelKey: 'rcpt_tab_notifications' },
    ],
  },
  {
    id: 'agenda',
    labelKey: 'submodule_2',
    tabs: [
      { key: 'register', labelKey: 'agenda_tab_register' },
      { key: 'calendar', labelKey: 'agenda_tab_calendar' },
      { key: 'whatsapp', literalLabel: 'WhatsApp' },
      { key: 'waitlist', labelKey: 'agenda_tab_waitlist' },
      { key: 'callcenter', labelKey: 'agenda_tab_callcenter' },
    ],
  },
  {
    id: 'hce',
    labelKey: 'submodule_3',
    tabs: [
      { key: 'anamnese', labelKey: 'hce_tab_anamnese' },
      { key: 'exam', labelKey: 'hce_tab_exam' },
      { key: 'soap', labelKey: 'hce_tab_soap' },
      { key: 'diagnoses', labelKey: 'hce_tab_diagnoses' },
      { key: 'prescriptions', labelKey: 'hce_tab_prescriptions' },
      { key: 'exams', labelKey: 'hce_tab_exams' },
      { key: 'procedures', labelKey: 'hce_tab_procedures' },
      { key: 'attachments', labelKey: 'hce_tab_attachments' },
      { key: 'signatures', labelKey: 'hce_tab_signatures' },
      { key: 'timeline', labelKey: 'hce_tab_timeline' },
      { key: 'security', labelKey: 'hce_tab_security' },
    ],
  },
  {
    id: 'diagnostic',
    labelKey: 'submodule_4',
    tabs: [
      { key: 'pacs', labelKey: 'diag_tab_pacs' },
      { key: 'laudos', labelKey: 'diag_tab_laudos' },
      { key: 'worklist', labelKey: 'diag_tab_worklist' },
      { key: 'laboratorio', labelKey: 'diag_tab_lab' },
    ],
  },
  {
    id: 'sifen',
    labelKey: 'submodule_5',
    tabs: [],
  },
  {
    id: 'finance',
    labelKey: 'submodule_6',
    tabs: [
      { key: 'dashboard', labelKey: 'fin_tab_dashboard' },
      { key: 'ap_ar', labelKey: 'fin_tab_ap_ar' },
      { key: 'cashflow', labelKey: 'fin_tab_cashflow' },
      { key: 'reconciliation', labelKey: 'fin_tab_reconciliation' },
      { key: 'cost_centers', labelKey: 'fin_tab_cost_centers' },
      { key: 'dre', labelKey: 'fin_tab_dre' },
      { key: 'tax', labelKey: 'fin_tab_tax' },
      { key: 'books', labelKey: 'fin_tab_books' },
      { key: 'multicurrency', labelKey: 'fin_tab_multicurrency' },
      { key: 'chart_accounts', labelKey: 'fin_tab_chart_accounts' },
      { key: 'accounting_entries', labelKey: 'fin_tab_accounting_entries' },
    ],
  },
  {
    id: 'stock',
    labelKey: 'submodule_7',
    tabs: [
      { key: 'dashboard', labelKey: 'pharm_tab_dashboard' },
      { key: 'items', labelKey: 'pharm_tab_items' },
      { key: 'lots', labelKey: 'pharm_tab_lots' },
      { key: 'movements', labelKey: 'pharm_tab_movements' },
      { key: 'entries', labelKey: 'pharm_tab_entries' },
      { key: 'exits', labelKey: 'pharm_tab_exits' },
      { key: 'inventory', labelKey: 'pharm_tab_inventory' },
      { key: 'alerts', labelKey: 'pharm_tab_alerts' },
      { key: 'reports', labelKey: 'pharm_tab_reports' },
      { key: 'pharmacovigilance', labelKey: 'pharm_tab_pv' },
    ],
  },
  {
    id: 'pcmso',
    labelKey: 'submodule_8',
    tabs: [],
  },
  {
    id: 'med_work',
    labelKey: 'submodule_9',
    tabs: [
      { key: 'dashboard', labelKey: 'ocp_dashboard' },
      { key: 'empresas', labelKey: 'ocp_empresas' },
      { key: 'trabalhadores', labelKey: 'ocp_trabalhadores' },
      { key: 'exames', labelKey: 'ocp_exames_cal' },
      { key: 'cal', labelKey: 'ocp_certificados' },
      { key: 'riscos', labelKey: 'ocp_riscos_matriz' },
      { key: 'relatorios', labelKey: 'ocp_relatorios_mtess' },
    ],
  },

  {
    id: 'crm',
    labelKey: 'submodule_10',
    tabs: [
      { key: 'dashboard', labelKey: 'crm_dashboard' },
      { key: 'segmentacao', labelKey: 'crm_segmentacao' },
      { key: 'campanhas', labelKey: 'crm_campanhas' },
      { key: 'funil', labelKey: 'crm_funil' },
      { key: 'oportunidades', labelKey: 'crm_oportunidades' },
      { key: 'nps', labelKey: 'crm_nps' },
      { key: 'leads', labelKey: 'crm_captura_web' },
      { key: 'optout', labelKey: 'crm_optout' },
    ],
  },
  {
    id: 'hospitalization',
    labelKey: 'submodule_11',
    tabs: [
      { key: 'dashboard', labelKey: 'intern_tab_dashboard' },
      { key: 'leitos', labelKey: 'intern_tab_beds' },
      { key: 'cirurgia', labelKey: 'intern_tab_surgeries' },
      { key: 'internacao', labelKey: 'intern_tab_admissions' },
      { key: 'relatorios', labelKey: 'intern_tab_reports' },
    ],
  },
  {
    id: 'bi',
    labelKey: 'submodule_12',
    tabs: [
      { key: 'ocupacao', labelKey: 'bi_tab_ocupacao' },
      { key: 'cirurgias', labelKey: 'bi_tab_cirurgias' },
      { key: 'financeiro', labelKey: 'bi_tab_financeiro' },
      { key: 'nps', labelKey: 'bi_tab_nps' },
      { key: 'alertas', labelKey: 'bi_tab_alertas' },
    ],
  },
  {
    id: 'patient_portal',
    labelKey: 'submodule_13',
    tabs: [
      { key: 'dashboard', labelKey: 'portal_tab_dashboard' },
      { key: 'appointments', labelKey: 'portal_tab_appointments' },
      { key: 'history', labelKey: 'portal_tab_history' },
      { key: 'prescriptions', labelKey: 'portal_tab_prescriptions' },
      { key: 'exams', labelKey: 'portal_tab_exams' },
      { key: 'dtes', labelKey: 'portal_tab_dtes' },
      { key: 'payments', labelKey: 'portal_tab_payments' },
      { key: 'telemedicine', labelKey: 'portal_tab_telemedicine' },
      { key: 'notifications', labelKey: 'portal_tab_notifications' },
      { key: 'profile', labelKey: 'portal_tab_profile' },
    ],
  },
  {
    id: 'security',
    labelKey: 'submodule_14',
    tabs: [
      { key: 'users', labelKey: 'admin_tab_users' },
      { key: 'security', labelKey: 'admin_tab_rbac' },
      { key: 'password-policy', labelKey: 'admin_tab_password_policy' },
      { key: 'two-factor', labelKey: 'admin_tab_twofa' },
      { key: 'sso', labelKey: 'admin_tab_sso' },
      { key: 'sessions', labelKey: 'admin_tab_sessions' },
      { key: 'professionals', labelKey: 'admin_tab_professionals' },
      { key: 'locations', labelKey: 'admin_tab_locations' },
      { key: 'rooms', labelKey: 'admin_tab_rooms' },
      { key: 'roles', labelKey: 'admin_tab_roles' },
      { key: 'snomed', labelKey: 'admin_tab_snomed' },
    ],
  },
  {
    id: 'insurance',
    labelKey: 'submodule_15',
    tabs: [
      { key: 'companies', labelKey: 'fin_tab_companies' },
      { key: 'fee', labelKey: 'fin_tab_fee' },
      { key: 'preauth', labelKey: 'fin_tab_preauth' },
    ],
  },
  {
    id: 'fee_schedule',
    labelKey: 'submodule_16',
    tabs: [],
  },
  {
    id: 'copay',
    labelKey: 'submodule_17',
    tabs: [],
  },
  {
    id: 'batches',
    labelKey: 'submodule_18',
    tabs: [],
  },
  {
    id: 'eligibility',
    labelKey: 'submodule_19',
    tabs: [],
  },
  {
    id: 'settlements',
    labelKey: 'submodule_20',
    tabs: [],
  },
  {
    id: 'foreign_billing',
    labelKey: 'submodule_21',
    tabs: [],
  },
];

export function tabPermissionKey(moduleId: string, tabKey: string): string {
  return `tab_${moduleId}_${tabKey}`;
}

export function moduleTabPrefix(moduleId: string): string {
  return `tab_${moduleId}_`;
}

/** O usuário tem alguma configuração de abas para este módulo? */
export function hasTabConfig(permissions: string[] | undefined | null, moduleId: string): boolean {
  if (!permissions) return false;
  return permissions.some(p => p.startsWith(moduleTabPrefix(moduleId)));
}

/**
 * A pessoa pode ver esta aba?
 * - Sem nenhuma config de abas do módulo → sim (compatibilidade/fail-open).
 * - Com config → só se a chave específica estiver presente.
 *
 * O gate de MÓDULO (view_*) continua responsabilidade do PermissionGate;
 * esta função é apenas a camada fina de abas.
 */
export function canAccessTab(
  permissions: string[] | undefined | null,
  moduleId: string,
  tabKey: string
): boolean {
  if (!hasTabConfig(permissions, moduleId)) return true;
  return !!permissions && permissions.includes(tabPermissionKey(moduleId, tabKey));
}
