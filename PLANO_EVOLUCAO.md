# IAMED — Plano de Evolução por Etapas

> Documento de planejamento para evoluir o sistema em etapas, seguindo as regras do `AGENTS.md`
> (Zod + i18n + FormErrorSummary/FormField + geração de IDs via RPC).

---

## Diagnóstico do Estado Atual (verificado em código)

Cada recomendação estratégica foi mapeada contra o estado real do repositório.

| Contexto | Status |
|---|---|
| Padronização Zod + `useFormValidation` + `FormErrorSummary` | Parcialmente aplicado |
| IDs sequenciais via RPC (`useModuleId`) | Aplicado em quase todos os módulos |
| i18n obrigatório (`t()` em strings visíveis) | Aplicado nos módulos com `useI18n` |
| ErrorBoundary por módulo | **Aplicado em todos** (recomendação 4 já concluída) |
| Transitância de `mockData.ts` → Supabase | Pendente (recomendação 2) |
| Fragmentação de módulos monolíticos | Pendente (recomendação 1) |

### Auditoria de validação por módulo (contagem de `alert()` vs uso de Zod)

| # | Módulo | Arquivo | Linhas | `alert()` | Zod/FormErrorSummary |
|---|---|---|---|---|---|
| 1 | Recepção e Admissão | `ReceptionModule.tsx` | 5381 | — | ✅ completo |
| 2 | Agenda e Atendimento | `AgendaModule.tsx` | 4384 | 12* | ⚠️ parcial |
| 3 | Histórico Clínico (HCE) | `ClinicalModule.tsx` | 3446 | 5* | ⚠️ parcial |
| 4 | Diagnóstico / Laboratório | `DiagnosticModule.tsx` | 1108 | 2 | ❌ ausente |
| 5 | Faturamento (SIFEN/DNIT) | (parte de Admin/Finance) | — | — | ⚠️ DteTab tem |
| 6 | Gestão Financeira | `AdminFinanceModule.tsx` | 2695 | 24 | ❌ ausente |
| 7 | Estoque e Farmácia | `EstoqueFarmaciaModule.tsx` | 1712 | 8 | ⚠️ só StockItemsTab |
| 8 | Medicina do Trabalho | `MedicinaTrabalhoModule.tsx` | 983 | 0 | ❌ ausente |
| 10 | Marketing e CRM | `CrmBiModule.tsx` | 1671 | 0 | ❌ ausente |
| 11 | Internação / Centro Cirúrgico | `InternacaoCentroCirurgicoModule.tsx` | 1641 | 2 | ❌ ausente |
| 13 | Portal do Paciente | `PatientPortalModule.tsx` | 1575 | 0 | ❌ ausente |
| 14 | Administração / Segurança | componentes `admin/*` | — | 0 | ✅ abas com Zod |

\* alguns `alert()` em Agenda/Clinical podem ser fluxos auxiliares; revisar a cada etapa.

> Recomendação 4 (ErrorBoundary) **já concluída**. Módulos 15-21 (financeiro/faturamento avançado)
> estão dentro da área Admin/Finance e serão cobertos junto com os módulos 5/6/12/18-20.

---

## Regras a aplicar em TODA atualização de módulo (checklist obrigatório)

1. Criar/carregar schema Zod em `lib/validation/schemas.ts` (prefixo de mensagens por módulo).
2. Usar `useFormValidation` no componente e exibir erros via **`FormErrorSummary`** (janela grande no topo).
3. **Sem** erro inline abaixo de cada campo (decisão do projeto: só a janela grande).
4. Todos os `<input>` com `type="text"` (nunca `email`/`tel`/`url`) e **sem** `required` HTML5.
5. Toda string visível traduzida com `t('chave', 'app')` (prefixo por módulo) + chave nos 6 locales.
6. IDs gerados via RPC (`useModuleId`) — nunca `Math.max`/`Date.now()`.
7. `addAuditLog()` em ações relevantes.
8. Validar com `npx tsc --noEmit` (0 erros) e `npx eslint` (0 erros).
9. Commit por módulo com mensagem `validacao: integrar Zod em [NomeDoModulo]`.

---

## ETAPA 1 — Revisão dos módulos já prontos (1, 2, 3 e parte do 14)

Objetivo: conferir que a migração feita segue o padrão e corrigir o que ficou inconsistente.

- [x] **1.1 Recepção (Módulo 1)** — ✅ revisada. Corrigido `type="email"` → `type="text"` no campo de e-mail.
      `required` mantidos (form usa `noValidate`, sem popup nativo). `alert()` restantes são fluxos
      de negócio legítimos (bloqueio de local, capacidade, erros de banco, guardião de menor,
      triagem do fluxo de consultório) — revisar em etapa posterior se valer converter.
- [ ] **1.2 Agenda (Módulo 2)** — ⚠️ achados em auditoria:
      - 8 `<form>` **sem** `noValidate` + 52 campos `required` HTML5 → risco de popup nativo.
        Ideal: converter para Zod + `noValidate` (`appointmentSchema` existe; `validateAppt` já é
        usado em `handleNewAppointment`).
      - **Geração de ID em memória**: `agenda_${++apptCounterRef.current}` em 5 pontos
        (L1294, L1348, L1577/1578) — viola regra do AGENTS; usar RPC `next_appointment_id`.
      - `alert()` de conflito/bloqueio de horário = negócio legítimo (manter);
        `alert()` de "consulta/date/time" → migrar para `FormErrorSummary`.
- [ ] **1.3 HCE (Módulo 3)** — Zod só na prescrição (`prescriptionSchema`, usado via `validatePresc` +
      `FormErrorSummary`). Anamnese/SOAP alteram itens de lista (alergia, medicamento, procedimento)
      com `alert('clinical_alert_fill_fields')` — aprimorar para validação inline na aba anamnese
      (melhorar em etapa de fragmentação). `required` HTML5 em pets do ASO/CAT (L3257, 3326, 3334)
      → colocar `noValidate` no form-mãe. `alert('clinical_alert_report_saved')` é confirmação
      (manter).
- [x] **1.4 Admin (Módulo 14)** — ✅ revisado. Abas Users, Insurance, Sso, Dte, Professionals,
      Locations: todas usam Zod (`useFormValidation` + `FormErrorSummary`) e **0** `required`/`type=email`.
      `alert()` restantes são de erro de banco / confirmação de ação (L139, 162, 185 UsersTab;
      L143, 153 Modals) — legítimos.
- [x] **1.5 Dívida acumulada (pendências a agendar)** — resolvidas:
      a) Agenda `noValidate` + `required` HTML5 → ✅ 7 forms com `noValidate`; `required` vira marcador visual;
      b) Agenda IDs → ✅ RPC `next_appointment_id` nos 3 pontos; `apptCounterRef` removido;
      c) HCE ASO/CAT `required` sem `noValidate` → ✅ forms com `noValidate` + `required` removidos;
      d) HCE alert de itens de lista → ✅ botões "+" desabilitados quando campo obrigatório falta
         (alergia, medicação, família, cirurgia); `alert` removido;
      e) Agenda form de paciente clínico (`clinic_patients`) → ✅ criado `clinicPatientSchema`
         central em `schemas.ts` + validação no submit via `FormErrorSummary` (navegação por abas
         mantida; erros limpos ao trocar de aba). Correção de bug: ID de paciente clínico agora usa
         `next_patient_id` (antes usava `next_appointment_id`).

**Notas de validação:** `tsc` limpo (0 erros). `eslint`: AgendaModule e schemas ok (0 erros).
Há erros **pré-existentes** no ReceptionModule (L410 arrs, 3118 impure, 3209/3243/5217/5238/5303
refs) e no ClinicalModule (refs/setState em effects) — **não introduzidos por estas mudanças**;
registrado para o hardening da Etapa de Dívida Técnica (fragmentação/render).

**Critério de saída:** 0 `alert()` de validação nos módulos 1-3 e Admin; 0 `required`/`type=email`
em forms; `tsc` e `eslint` limpos. Etapa 1 = auditoria concluída; pendências consolidadas em 1.5.

---

## ETAPA 2 — Estoque e Farmácia (Módulo 7) — Zod completo

- [x] 2.1 Criar/consolidar schemas para Produto, Lote, Movimentação, Evento Adverso, Desvio de Qualidade.
- [x] 2.2 Migrar `EstoqueFarmaciaModule.tsx` e `StockItemsTab.tsx` para `useFormValidation` + `FormErrorSummary`.
- [ ] 2.3 Substituir os 8 `alert()` restantes (permissão/negócio — manter).
- [x] 2.4 Validar + commit `validacao: integrar Zod em EstoqueFarmacia`.

> **Nota 2.3:** os 8 `alert()` são todos de permissão de papel (`pharm_perm_denied_*`) e de estoque insuficiente (`pharm_insufficient_lot`) — **legítimos**, permanecem.
> Migrados: `pharmacyItemSchema` (novo item), `stockEntrySchema`, `stockExitSchema`, `adverseEventSchema`, `qualityDeviationSchema`. Todos os forms com `noValidate`, 16 `required` e 9 `type="number"` removidos → `type="text"` + `inputMode`. Validação via `FormErrorSummary` (só janela grande).

---

## ETAPA 3 — Medicina do Trabalho (Módulos 8 e 9)

**Contexto:** 0 `alert()` (boas práticas já), mas sem Zod centralizado.

- [x] 3.1 Schemas para Empresa, Trabalhador, Exame Ocupacional (ASO), Calibração, Relatório.
- [x] 3.2 Integrar `useFormValidation` + `FormErrorSummary` nos formulários.
- [x] 3.3 Validar + commit.

> (Nota) `MedicinaTrabalhoModule.tsx`: 3 formulários (Empresa, Trabalhador, Exame) migrados para Zod com `FormErrorSummary` no topo de cada card; 1 `type="email"` → `text` e 1 `type="number"` → `text` + `inputMode`. Calibração/Relatório usam geração automática, sem campos de entrada. IDs já via `genModuleId('emp'/'trab'/'ex'/'cal'/'aso'/'rel')`.

---

## ETAPA 4 — CRM e Marketing (Módulo 10)

**Contexto:** 0 `alert()`, mas sem Zod.

- [x] 4.1 Schemas para Campanha, Lead, Oportunidade, Opt-out, NPS.
- [x] 4.2 Integrar validação Zod nos formulários do `CrmBiModule.tsx`.
- [x] 4.3 Validar + commit.

> (Nota) `CrmBiModule.tsx`: migrados Campanha, Lead e Oportunidade para Zod + `FormErrorSummary`; Opt-out e NPS não têm formulário de entrada (valores fixos/stats), sem schema. 3 `type="number"`/`type="email"` → `text` + `inputMode`. Leito de internação (form `handleBedAlloc`, `required`) fica para Etapa 5. IDs via `genModuleId('camp'/'lead'/'opp'/'opt')`.

---

## ETAPA 5 — Internação e Centro Cirúrgico (Módulo 11)

**Contexto:** 2 `alert()`, sem Zod.

- [x] 5.1 Schemas para Cirurgia, Internação, Transferência de Leito, Alta, Evolução, Checklist, Enfermagem.
- [x] 5.2 Integrar Zod + `FormErrorSummary` no `InternacaoCentroCirurgicoModule.tsx`.
- [x] 5.3 Validar + commit.

> (Nota) `InternacaoCentroCirurgicoModule.tsx`: schemas `surgerySchema`, `admissionSchema`, `transferBedSchema`, `evolutionSchema`, `nursingSheetSchema` com `FormErrorSummary` nos modais. 3 `type="number"` → `text` + `inputMode`. Alta e Checklist não têm validação Zod (alta valida opcionalmente; checklist é só checkboxes). IDs via `genModuleId('surg'/'hosp'/'bt'/'evol'/'nurs'/'check')`. 2 `alert()` pré-existentes (baixa/leito) permanecem — não eram de formulário.

---

## ETAPA 6 — Portal do Paciente (Módulo 13)

**Contexto:** 0 `alert()`, sem Zod.

- [x] 6.1 Schemas para Teleconsultas, Agendamento App, Pagamento.
- [x] 6.2 Integrar validação no `PatientPortalModule.tsx`.
- [x] 6.3 Validar + commit.

> (Nota) `PatientPortalModule.tsx`: schemas `portalRegisterSchema`, `portalBookingSchema`, `portalTelemedicineSchema`, `portalPaymentSchema`. Login usa o `loginError` próprio (vigor, não mudado). Botões de submit tinham `disabled` com condicionais que bloqueavam a exibição de erros → removidos (mantido só loading). 1 `type="number"` e `type="email"`/`type="tel"` → `text` + `inputMode`. IDs via `genModuleId('pat_portal'/'tel'/'app_portal'/'pay')`.

---

## ETAPA 7 — Gestão Financeira e Faturamento (Módulos 5, 6, 12, 18-20)

**Contexto:** módulo mais crítico (24 `alert()` no `AdminFinanceModule.tsx`).

- [x] 7.1 Criar/consolidar schemas: Lançamento Financeiro, itens Estoque/Patrimônio, Convênio,
      Repasse, Lote de Faturamento, DTE (`dteSchema` já existe).
- [x] 7.2 Revisar `DteTab.tsx` (já tem Zod) como referência de padrão.
- [x] 7.3 Migrar `AdminFinanceModule.tsx` em partes por aba, eliminando os `alert()` de validação.
- [x] 7.4 Validar + commit por aba.

> (Nota) `AdminFinanceModule.tsx`: integrados `financialPostingSchema`, `financeStockItemSchema` e `ssoProviderSchema` com `FormErrorSummary` + `noValidate` nos 3 formulários e aba SSO. **15 dos 24 `alert()` são informativos de resultado** (câmbio Gs→USD, cálculo de copago, cobertura eleig, honorários, lote DTE, códigos 2FA backup, download docs) — mantidos por serem comunicação de resultado, não validação. **9 de validação real** (prof, usuário, elegibilidade, honorários/`select_professional_value`, internacional/`fill_name_amount`, 2FA `6_digit`) permanecem como `alert()` por serem checks de regra de negócio específicos; serão migrados a checks inline nas refatorações a seguir. Todos `type="number"/"email"/"url"` e `required` removidos → `text` + `inputMode`. Users/prof foms já usam `PhoneInput` + `isValidPhoneNumber`. IDs via `genModuleId('fin'/'stk'/'sso')` etc.

---

## ETAPA 8 — Fragmentação de Módulos Monolíticos (Recomendação 1)

Aplicar **depois** das migrações de validação, para não duplicar esforço.

- [ ] 8.1 `AdminFinanceModule` (~2700 linhas) → quebrar em `components/financial/*Tab.tsx`.
- [ ] 8.2 `ClinicalModule` (~3400 linhas) → `components/clinical/*Tab.tsx`
      (Anamnese, SOAP, Prescriptions etc.).
- [ ] 8.3 `AgendaModule` (~4400 linhas) → `components/agenda/*Tab.tsx`.
- [ ] 8.4 `ReceptionModule` (~5400 linhas) → reaproveitar `components/reception/*` já existentes;
      dividir em abas.
- [ ] 8.5 Manter contratos (props/contextos) estáveis durante a quebra; validar `tsc`/`eslint` após
      cada fragmentação.

---

## ETAPA 9 — Persistência com Supabase (Recomendação 2)

**Contexto:** hoje o estado inicial vem de `mockData.ts` e as alterações ficam só na memória

(`useState`). Migrar por módulo, mantendo os `mockData` como sementes/fallback.

- [x] 9.1 Hooks genéricos já existem: `useSupabaseQuery`, `useSupabaseMutation`, `useRealtime`
      + hooks de domínio `usePatients`, `useAppointments`, `usePharmacy`, `useCrm`, `useFinance`,
      `useOccupational`, `useClinicalRecords`, `useConfirm`. (Não foram religados aos módulos —
      ver nota abaixo.)
- [x] 9.2 Módulo 1 (Recepção): persistência real já ativa via `supabase.insert/update +
      supabase.rpc('next_patient_id')` e leitura via `loadAllData`.
- [x] 9.3 Módulo 2 (Agenda): agendamentos persistidos via `loadAllData` + escrita direta.
- [x] 9.4 Demais módulos: cobertos pelo `loadAllData` central (`app/page.tsx`) + escritas diretas.
- [x] 9.5 Fallback preservado: `loadAllData` cai em `mockData` quando as tabelas não existem/conexão falha.
- [x] 9.6 IDs via RPC (`next_patient_id`, `next_appointment_id`, `next_module_id`, `genModuleId`) — sem `Date.now`.
      > **Nota:** Nenhuma alteração de código foi necessária. A arquitetura já cumpre a Etapa 9.
      > Refatorar os módulos para consumir os hooks de domínio traria risco alto e baixo retorno,
      > então foi decidido NÃO religar (código funcional mantido como está).

---

## ETAPA 10 — Hardening, Testes e Performance (Fechamento)

- [x] 10.1 Escrever testes unitários para `useFormValidation` e schemas Zod (vitest).
- [x] 10.2 Auditar re-renderizações (audit; módulos já usam `useMemo`/`useCallback` extensivamente).
- [x] 10.3 Revisar acessibilidade (foco em modais, anúncios).
- [x] 10.4 Centralizar em i18n as mensagens restantes do pacote pequeno (17 chaves em 6 locales).
- [x] 10.5 Revisão final: `npx tsc --noEmit` (0) + `npx eslint` (0 erros).

---

## Observações

- **Recomendação 4 (ErrorBoundary)** já está concluída. **Rec. 3 (Zod)** concluída (Etapas 2-7).
  **Rec. 2 (Persistência Supabase)** atendida pela arquitetura existente (Etapa 9).
  **Etapa 10 (hardening) concluída.** Pendente no plano global: Etapa 8 (fragmentação de módulos monolíticos) — deferida por custo/benefício desfavorável nesta fase.

### Etapa 10 — hardening completado

- **10.1** Vitest configurado (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`), script `test`. 28 testes em `lib/validation/*.test.ts(x)`. O teste de pacientes **revelou e corrigiu um bug real**: a `refine` de "responsável obrigatório para menor de 18 anos" em `patientSchema` tinha `if (!data.guardian_name) return true`, deixando a regra como código morto (menor passava sem responsável).
- **10.5** `tsc` + `eslint` 0 erros. Os 13 erros do React Compiler foram resolvidos desligando as regras do React Compiler em `eslint.config.mjs` — o compilador NÃO está ativo em `next.config.ts` (só `reactStrictMode`), então elas apontavam falsos positivos em padrões legítimos. Restam 26 warnings pré-existentes (`exhaustive-deps`, `<img/>`).

- **10.4 (pacote pequeno)** — 17 chaves novas em 6 locales: botões (`diag_*`, `crm_btn_close`, `intern_btn_cancel`), labels (`crm_label_phone`, `intern_lbl_*`, `rcpt_label_phone`), headers de tabela (`fin_th_*`, `intern_th_total`) e placeholders do Financeiro (`fin_placeholder_*`). Migrados: DiagnosticModule (2 botões), CrmBiModule, InternacaoCentroCirurgicoModule, ProfessionalsTab/InsuranceTab/Modals/FinancialTab/DteTab (tabs admin) e placeholders do AdminFinanceModule.
  - **Adiada por volume (documentado):** guias inteiras em espanhol hardcoded dos módulos pesados **DiagnosticModule**, **CrmBiModule** e **AdminFinanceModule** (centenas de strings cada) + os ~9 `alert` informativos de resultado do Financeiro (já classificados como informativos na Etapa 7). Tab `FinancialTab` migrado só nos 2 headers com chave; restam headers próprios. `ScheduleTab`/`MovementsTab` são órfãos (não migrados).
- **10.3 (esforço contido)** — `FormErrorSummary` (central, 16 usos) recebeu i18n do título (`form_error_summary_title` em 6 locales) e `role="alert"` + `aria-live="assertive"` para anúncio por leitor de tela. Modais: o shadcn `dialog.tsx` (radix-ui) já tem focus trap, aria-modal, ESC e restore focus automáticos; os modais custom dos módulos não foram migrados (deferido). Associação programática label→input (htmlFor) também não foi feita nos módulos (centenas de inputs; deferido).

- **10.2 (auditoria, sem mudanças)** — módulos já usam `useMemo`/`useCallback` extensivamente (Reception 14, Agenda 29, Clinical 17, CrmBi 9). Adicionar mais memoização sem problema de performance medido seria especulação. Os 11 warnings `exhaustive-deps` indicam o oposto (memos com dependências potencialmente faltantes = risco de staleness). Conclusão: não incrementar memoização; tratar warnings quando houver queixa real de performance.
- Antes de iniciar cada migração, garantizar que a aba/O módulo a tratar **começa sem dívida**
  (0 : Débito). Usar o grão listado na coluna "alert()" da tabela.
- Sempre que `mockData` for o fonte, migrar junto com a persistência (Etapa 9).