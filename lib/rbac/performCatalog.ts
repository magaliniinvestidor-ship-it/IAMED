// ============================================================
// RBAC: catálogo de ações (perform_*) por módulo
//
// Mapeia cada view_<module> para as ações perform_* que aquele
// módulo possui gates no código (botões/forms wired). Usado pelo
// editor RBAC para filtrar a seção "Pode Realizar / Alterar"
// de acordo com os módulos marcados em "Pode Visualizar / Acessar".
//
// Quando um módulo ganha um novo botão gated, basta adicionar a
// chave perform_* aqui — nenhum outro código precisa mudar.
//
// Mapeamento atual baseado nos gates aplicados em:
//   - ReceptionModule.tsx   (checkin, triage, admit legacy)
//   - AgendaModule.tsx      (agenda_create)
//   - ClinicalModule.tsx    (prescribe, aso via HCE)
//   - MedicinaTrabalhoModule (aso)
//   - Internacao...Module   (beds, surgery)
//   - EstoqueFarmaciaModule (stock)
//   - AdminFinanceModule    (sifen, post_finance, insurance,
//                            fee_schedule, copay, batches,
//                            eligibility, settlements,
//                            foreign_billing, rbac)
// ============================================================

export const PERFORM_BY_VIEW: Record<string, string[]> = {
  view_reception: ['perform_checkin', 'perform_triage', 'perform_admit'],
  view_agenda: ['perform_agenda_create'],
  view_hce: ['perform_prescribe', 'perform_surgery'],
  view_diagnostic: ['perform_diagnostic_report', 'perform_diagnostic_sign'],
  view_pcmso: ['perform_aso'],
  view_med_work: ['perform_aso'],
  view_hospitalization: ['perform_beds', 'perform_surgery'],
  view_stock: ['perform_stock'],
  view_sifen: ['perform_sifen'],
  view_finance: ['perform_post_finance'],
  view_insurance: ['perform_insurance', 'perform_fee_schedule'],
  view_copay: ['perform_copay'],
  view_batches: ['perform_batches'],
  view_eligibility: ['perform_eligibility'],
  view_settlements: ['perform_settlements'],
  view_foreign_billing: ['perform_foreign_billing'],
  view_security: ['perform_rbac'],
};

/** Retorna a lista única de perform_* visíveis dado um conjunto de view_* marcadas. */
export function visiblePerformKeys(selectedViews: string[]): string[] {
  const set = new Set<string>();
  for (const v of selectedViews) {
    const actions = PERFORM_BY_VIEW[v];
    if (actions) actions.forEach(a => set.add(a));
  }
  return Array.from(set);
}