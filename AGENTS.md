# IAMED - Regras de Desenvolvimento

## Internacionalização (i18n)

### Regra Obrigatória

**TODA string visível ao usuário DEVE usar `t('chave', 'app')`.**

Nunca escrever strings hardcoded em português (ou qualquer outro idioma) diretamente no código JSX/TSX.

### Como funciona

1. Importar o hook `useI18n`:
   ```tsx
   import { useI18n } from '@/lib/i18n/I18nContext';
   ```

2. Dentro do componente:
   ```tsx
   const { t } = useI18n();
   ```

3. Usar `t()` para todas as strings:
   ```tsx
   // ✅ CORRETO
   <button>{t('agenda_save_changes', 'app')}</button>
   alert(t('rcpt_alert_required_phone', 'app'));
   
   // ❌ ERRADO
   <button>Salvar Alterações</button>
   alert("Campo obrigatório não preenchido");
   ```

### Convenções de Nomenclatura por Módulo

- **Recepção**: prefixo `rcpt_` (ex: `rcpt_alert_required_phone`)
- **Agenda**: prefixo `agenda_` (ex: `agenda_save_changes`)
- **Prontuário (HCE)**: prefixo `hce_` ou `presc_`
- **Medicina do Trabalho**: prefixo `medtrab_` (ex: `medtrab_tab_pcmso`)
- **Internação e Centro Cirúrgico**: prefixo `intern_` (ex: `intern_tab_beds`)
- **PACS / Diagnóstico por Imagem**: prefixo `diag_` (ex: `diag_tab_worklist`)
- **Portal do Paciente / Telemedicina**: prefixo `portal_` (ex: `portal_payment_success`)
- **CRM e Marketing**: prefixo `crm_`
- **Estoque e Farmácia**: prefixo `pharm_`
- **Gestão Financeira e SIFEN**: prefixo `fin_`

> **Nota:** As chaves ficam em `lib/i18n/locales/*.json` na seção `app`.

### Exceções (NÃO traduzir)

- Strings de `console.log` / `console.error`
- Strings em `addAuditLog()` (logs de auditoria internos - opcional traduzir)
- Nomes de arquivos técnicos
- Strings de comparação com banco de dados (devem bater com os `values` armazenados)
- Nomes de idiomas ("Español", "English") - ficam na forma nativa
- Placeholders técnicos (ex: "120/80", "36.8")

### Para novos componentes

Ao criar um componente novo, SEMPRE incluir:

```tsx
import { useI18n } from '@/lib/i18n/I18nContext';

// Dentro do componente:
const { t } = useI18n();
```

### Para novas chaves

1. Adicionar a chave em TODOS os 6 arquivos de locale:
   - `lib/i18n/locales/pt-BR.json`
   - `lib/i18n/locales/pt-PT.json`
   - `lib/i18n/locales/en.json`
   - `lib/i18n/locales/es.json`
   - `lib/i18n/locales/es-AR.json`
   - `lib/i18n/locales/es-PY.json`

2. Usar o prefixo correto do módulo em `snake_case`.

---

## Geração de IDs Sequenciais

**REGRA OBRIGATÓRIA:** Todos os IDs de registros em tabelas do Supabase DEVEM ser gerados via função RPC no banco. **NUNCA** gerar IDs no front-end com `Math.max()`, `useRef`, `Date.now()` ou qualquer lógica client-side.

### Por quê

- `Math.max(...numericIds) + 1` colide quando dois usuários cadastram ao mesmo tempo
- `useRef` zera ao dar F5 ou abrir nova aba
- `Date.now()` gera IDs únicos mas não sequenciais (ex: `agenda_1782752456551`)

### Como funciona

O Postgres tem sequences atômicas por tabela. O front chama funções RPC que executam `nextval()` de forma isolada e transacional.

```tsx
// ✅ CORRETO - chamada RPC atômica
const { data: newId } = await supabase.rpc('next_patient_id');
const { data: newId } = await supabase.rpc('next_clinical_id', { p_prefix: 'soap' });
const { data: newId } = await supabase.rpc('next_module_id', { p_prefix: 'surg' });

// ❌ ERRADO - lógica no front ou fallback com Date.now()
const nextIdNum = Math.max(...numericIds) + 1;
patientId = `PAC${String(nextIdNum).padStart(3, '0')}`;
id = `surg_${Date.now()}`;
```

### Tabela de Funções RPC Disponíveis

| Função RPC | Prefixo/Formato | Módulo / Tabela |
|---|---|---|
| `next_patient_id()` | `PAC001`, `PAC002`... | Pacientes (`patients`) |
| `next_appointment_id()` | `CLI001`, `CLI002`... | Agendamentos (`appointments`) |
| `next_location_id()` | `loc_1`, `loc_2`... | Locais de Atendimento (`locations`) |
| `next_room_id()` | `SALA001`, `SALA002`... | Salas Clínicas (`clinical_rooms`) |
| `next_professional_id()` | `PRF001`, `PRF002`... | Profissionais (`professionals`) |
| `next_role_id()` | `role_01`, `role_02`... | Cargos (`professional_roles`) |
| `next_clinical_id(p_prefix)` | `presc_0001`, `soap_0001`... | Módulo 3 (Atendimento Clínico HCE) |
| `next_module_id(p_prefix)` | `surg_0001`, `emp_0001`... | Módulos 4 a 21 (Geral) |

### Prefixos Aceitos por `next_clinical_id(p_prefix text)`
`presc`, `anam`, `soap`, `diag`, `exam`, `proc`, `att`, `sig`, `aso`

### Prefixos Aceitos por `next_module_id(p_prefix text)`

| Módulo | Prefixos Suportados |
|---|---|
| **Internação & Centro Cirúrgico** | `surg` (Cirurgias), `hosp` (Internações), `bt` (Transferência Leito), `evol` (Evoluções), `nurs` (Registros Enfermagem), `check` (Checklists) |
| **Estoque & Farmácia** | `pharm` (Produtos), `lot` (Lotes), `mov` (Movimentações), `ae` (Eventos Adversos), `qd` (Desvios Qualidade) |
| **Medicina do Trabalho** | `emp` (Empresas), `trab` (Trabalhadores), `ex` (Exames Ocupacionais), `cal` (Calibrações), `rel` (Relatórios MTESS) |
| **Portal do Paciente** | `pat_portal` (Pacientes Portal), `tel` (Teleconsultas), `app_portal` (Consultas App), `pay` (Pagamentos) |
| **Diagnóstico (PACS/SADT)** | `rep` (Laudos), `hl7` (Mensagens HL7), `m` (Medições Laboratório) |
| **CRM & BI Analyst** | `camp` (Campanhas), `lead` (Leads), `opp` (Oportunidades), `opt` (Opt-Outs), `nps` (Pesquisas NPS) |
| **Financeiro, Faturamento & LGPD** | `dte` (Documentos Eletrônicos), `fin` (Lançamentos Financeiros), `stk` (Itens Estoque/Patrimônio), `ins` (Convênios), `sso` (Provedores SSO), `elig` (Consultas Elegibilidade), `sett` (Repasses/Liquidacões), `frn` (Faturamento Estrangeiro), `batch` (Lotes Faturamento) |
| **Agenda (Módulo 2)** | `blk` (Bloqueios de horário), `wl` (Lista de Espera), `whats` (Lembretes WhatsApp), `call` (Call Center) |

### Padrão Recomendado nos Componentes

```tsx
import { useModuleId } from '@/hooks/useModuleId';

// Dentro do componente:
const genModuleId = useModuleId(); // Módulos 4-21 (usa 'next_module_id')
// Ou para o Módulo Clínico HCE (usa 'next_clinical_id'):
// const genId = useModuleId('next_clinical_id');

const handleSave = async () => {
  const newId = await genModuleId('surg');
  await supabase.from('surgeries').insert({ id: newId, ... });
};
```

> **Atenção:** Em caso de falha de conexão ou ambiente de testes local sem banco, use SEMPRE um fallback estático como `${prefix}_0001`. **NUNCA usar `Date.now()`**.

---

## Otimização de Imagens (next/image)

### Regra Obrigatória

**TODA imagem em JSX DEVE usar `<Image>` de `next/image`, nunca `<img>` cru.**

### Por quê

- ✅ Redimensionamento automático (não baixa arquivo gigante para mostrar 32×32).
- ✅ Conversão para WebP, lazy loading, otimização de LCP.
- ✅ Cumpre automaticamente o lint `@next/next/no-img-element`.

### Como funciona

```tsx
import Image from 'next/image';

// ✅ Tamanho fixo conhecido
<Image src={patient.photo_url} alt={patient.name} width={80} height={80} className="rounded-full object-cover" />

// ✅ Imagem que preenche o parent (ex.: avatar em card circular)
<div className="relative w-20 h-20 overflow-hidden">
  <Image src={photo} alt="Foto" fill className="object-cover" />
</div>

// ❌ ERRADO
<img src={photo} alt="Foto" className="w-20 h-20 rounded-full object-cover" />
```

### Pontos de atenção

- Ao usar `fill`, o **pai precisa ter `position: relative`** (e tamanho definido).
- Domínios externos de imagens devem estar em `next.config.ts` → `images.remotePatterns` (já tem `picsum.photos` e `images.unsplash.com`).
- Para imagens do Supabase Storage, adicionar o domínio `*.supabase.co` no mesmo local.

---

## Outras Regras

- Seguir o estilo de código existente no repositório.
- Manter o código limpo, eliminando comentários desnecessários.
- Preferir edições em arquivos existentes antes de criar arquivos duplicados.
- Nunca commitar senhas, tokens ou chaves secretas.

---

## Validação de Formulários com Zod

### Regra Obrigatória

**TODA validação de formulário DEVE usar Zod (schemas centralizados em `lib/validation/schemas.ts`).**

**PROIBIDO** usar validação HTML5 nativa (`required`, `type="email"`, `type="tel"`, `type="url"`) — sempre usar `type="text"` para evitar popups nativos do navegador.

### Por quê

- ✅ Erros aparecem **inline** (embaixo de cada campo), não em popups do navegador
- ✅ Mensagens em **português** (consistente com i18n)
- ✅ Valida regras complexas (menor de idade precisa de responsável, data no passado, etc.)
- ✅ TypeScript automático — Zod gera os tipos
- ✅ Mesma validação pode ser usada no front e no back

### Como funciona

**1. Schemas ficam em `lib/validation/schemas.ts`:**

```ts
export const patientSchema = z.object({
  name: nonEmptyString('Nome', 200),
  email: emailSchema,
  birthdate: dateSchema,
  // ...
});
```

**2. Componente usa o hook `useFormValidation`:**

```tsx
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { FormErrorSummary } from '@/components/forms';
import { patientSchema } from '@/lib/validation/schemas';

const { errors, validate } = useFormValidation(patientSchema);

const handleSave = async () => {
  const result = validate(formData);
  if (!result.success) {
    // Erros aparecem automaticamente via FormErrorSummary e FormField
    return;
  }
  // ...salvar no banco
};
```

**3. JSX usa `FormField` com `error`:**

```tsx
<FormField label="Nome Completo" required error={fieldErrors.name}>
  <input
    type="text"  // NUNCA type="email" ou required
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</FormField>
```

### Padrão Obrigatório para Novos Formulários

Todo novo formulário DEVE seguir este checklist:

- [ ] Schema criado em `lib/validation/schemas.ts`
- [ ] Hook `useFormValidation` usado no componente
- [ ] Todos os `<input>` com `type="text"` (nunca `type="email"`, `type="tel"`, `type="url"`)
- [ ] Todos os `<input>` sem atributo `required`
- [ ] Componente `FormErrorSummary` no topo do formulário
- [ ] Componente `FormField` com prop `error` em cada campo
- [ ] Helper `groupErrorsByPath` para acessar erros por campo
- [ ] Função de submit chama `validate()` antes de salvar

### Schemas Existentes

| Schema | Uso | Arquivo |
|---|---|---|
| `patientSchema` | Pacientes (Recepção) | `lib/validation/schemas.ts` |
| `appointmentSchema` | Agendamentos | `lib/validation/schemas.ts` |
| `professionalSchema` | Profissionais | `lib/validation/schemas.ts` |
| `insuranceSchema` | Convênios | `lib/validation/schemas.ts` |
| `prescriptionSchema` | Prescrições | `lib/validation/schemas.ts` |
| `dteSchema` | Documentos Fiscais Eletrônicos | `lib/validation/schemas.ts` |
| `triageSchema` | Triagem Manchester | `lib/validation/schemas.ts` |
| `passwordChangeSchema` | Mudança de senha | `lib/validation/schemas.ts` |
| `locationSchema` | Locais/Sedes | `lib/validation/schemas.ts` |
| `clinicalRoomSchema` | Salas Clínicas | `lib/validation/schemas.ts` |
| `systemUserSchema` | Usuários do Sistema | `lib/validation/schemas.ts` |
| `pharmacyItemSchema` | Itens de Estoque | `lib/validation/schemas.ts` |

### Para Atualizações de Módulos Existentes

Ao atualizar qualquer módulo (estoque, CRM, internação, diagnóstico, financeiro), o agente DEVE:

1. Identificar todos os formulários do módulo
2. Criar schema Zod correspondente em `lib/validation/schemas.ts`
3. Refatorar o formulário para usar `useFormValidation` + `FormField` + `FormErrorSummary`
4. Remover todos os `required` e mudar `type="email"/"tel"/"url"` para `type="text"`
5. Validar com `npx tsc --noEmit` (0 erros) e `npx eslint` (0 erros)
6. Commitar com mensagem: `validacao: integrar Zod em [NomeDoModulo]`

### Exemplo Completo

```tsx
'use client';

import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { patientSchema } from '@/lib/validation/schemas';
import { FormField, FormErrorSummary } from '@/components/forms';

export function MeuForm() {
  const { errors, validate } = useFormValidation(patientSchema);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const fieldErrors = groupErrorsByPath(errors);

  const handleSave = () => {
    const result = validate({ name, email });
    if (!result.success) return;
    // salvar...
  };

  return (
    <form>
      {errors.length > 0 && <FormErrorSummary errors={errors} />}
      
      <FormField label="Nome" required error={fieldErrors.name}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      
      <FormField label="E-mail" required error={fieldErrors.email}>
        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      
      <button onClick={handleSave}>Salvar</button>
    </form>
  );
}
```

### Exceção

Se um módulo ainda não foi migrado para Zod (legado), ele PODE manter validação HTML5 temporariamente, mas DEVE ser migrado na próxima atualização do módulo.

---

## RBAC — Atualização Obrigatória ao Finalizar Módulo

### Regra Obrigatória

**Ao finalizar a construção de qualquer módulo (4 a 21), o agente DEVE automaticamente perguntar ao usuário se deseja atualizar o RBAC no Módulo 14 (Segurança/Controle de Acesso).**

Isso garante que o novo módulo apareça corretamente no editor de permissões do painel admin, com suas abas e ações controláveis.

### Checklist de Atualização RBAC (ao finalizar um módulo)

Ao construir um módulo novo, o agente deve:

1. **`lib/rbac/catalog.ts`** — Adicionar entrada no `RBAC_MODULE_CATALOG`:
   ```ts
   {
     id: 'nome_do_modulo',         // mesmo id usado em view_* e canAccessTab
     labelKey: 'submodule_N',      // ex: 'submodule_4'
     tabs: [
       { key: 'aba1', labelKey: 'prefix_tab_aba1' },
       { key: 'aba2', labelKey: 'prefix_tab_aba2' },
       // ... cada aba que o módulo possui
     ],
   },
   ```

2. **`lib/rbac/performCatalog.ts`** — Adicionar mapeamento em `PERFORM_BY_VIEW`:
   ```ts
   view_nome_do_modulo: ['perform_action1', 'perform_action2'],
   ```

3. **`lib/usePermissions.ts`** — Adicionar:
   - `view_nome_do_modulo: 'view_nome_do_modulo'` no objeto `PERMISSIONS.view`
   - `action1: 'perform_action1'`, `action2: 'perform_action2'` no objeto `PERMISSIONS.perform`
   - Chaves no array do `WILDCARD_MAP` nas categorias relevantes (ex: `admin`, `clinical`, etc.)

4. **`lib/i18n/locales/*.json`** (6 arquivos) — Adicionar chaves:
   - `submodule_N`: nome do módulo em cada idioma
   - `prefix_tab_aba1`, `prefix_tab_aba2`: nome de cada aba em cada idioma

5. **Verificar coerência com o componente** — O componente do módulo DEVE usar:
   - `<PermissionGate view="nome_do_modulo">` no wrapper principal
   - `canAccessTab(userPermissions, 'nome_do_modulo', 'aba1')` para cada sub-aba
   - `hasPermission(userPermissions, 'perform_action1')` para botões/actions gated

6. **Validar** com `npx tsc --noEmit` (0 erros) e `npx eslint` (0 erros)

7. **Commit** com mensagem: `rbac: adicionar permissões do módulo [Nome]`

### Padrão de Referência

Os módulos 1 (Recepção), 2 (Agenda) e 3 (HCE) são a referência. Ao adicionar um novo módulo, copiar o padrão de:
- Nomes de constantes: `view_<modulo>`, `perform_<acao>`
- Chaves de aba: `tab_<modulo>_<aba>` (geradas por `tabPermissionKey()`)
- Estrutura do catalog: `{ id, labelKey, tabs: [{ key, labelKey }] }`

### Mapeamento Atual (módulos com RBAC configurado)

| Módulo | id | Abas configuradas |
|---|---|---|
| 1 Recepção | `reception` | recepcao, distribuicao, locais, notificacoes |
| 2 Agenda | `agenda` | register, calendar, whatsapp, waitlist, callcenter |
| 3 HCE | `hce` | anamnese, exam, soap, diagnoses, prescriptions, exams, procedures, attachments, signatures, timeline, security |
| 4 Diagnóstico | `diagnostic` | pacs, laudos, worklist, laboratorio |
| 5 SIFEN | `sifen` | (sem abas) |
| 6 Financeiro | `finance` | dashboard, ap_ar, cashflow, reconciliation, cost_centers, dre, tax, books, multicurrency, chart_accounts, accounting_entries |
| 7 Estoque/Farmácia | `stock` | dashboard, items, lots, movements, entries, exits, inventory, alerts, reports, pharmacovigilance |
| 9 Medicina Trabalho | `med_work` | dashboard, empresas, trabalhadores, exames, cal, riscos, relatorios |
| 10 CRM | `crm` | dashboard, segmentacao, campanhas, funil, oportunidades, nps, leads, optout |
| 11 Internação | `hospitalization` | dashboard, leitos, cirurgia, internacao, relatorios |
| 12 BI | `bi` | ocupacao, cirurgias, financeiro, nps, alertas |
| 13 Portal Paciente | `patient_portal` | dashboard, appointments, history, prescriptions, exames, dtes, payments, telemedicine, notifications, profile |
| 15 Convênios | `insurance` | companies, fee, preauth |

> **Nota:** Módulos 8, 16–21 ainda não possuem RBAC configurado — serão adicionados conforme forem construídos.

---

## WhatsApp (Módulo de Lembretes)

### Arquitetura Atual

O envio de WhatsApp **NÃO tem API real** — o sistema usa um **provider de simulação**. A estrutura foi desenhada para permitir a troca por uma API real sem refatorar o resto do código.

```
lib/whatsapp/
├── index.ts        # Re-exports
├── templates.ts    # WHATSAPP_TEMPLATES, getLangMessageKey, buildReminderMessage
└── provider.ts     # WhatsAppProvider (interface) + SimulatorProvider + get/setWhatsAppProvider
```

**Arquivos principais:**
- `lib/whatsapp/templates.ts` — 3 templates (`tpl_1`=48h, `tpl_2`=24h, `tpl_3`=2h) multilíngue com placeholders `{nombre} {profesional} {fecha} {hora} {sede}`. `buildReminderMessage(tpl, lang, ctx)` é o ÚNICO ponto de interpolação dos placeholders.
- `lib/whatsapp/provider.ts` — interface `WhatsAppProvider` com `sendMessage(phone, message, { onStatus, onError })`; `SimulatorProvider` emite `'sent' → 'delivered' → 'read'` com delays.
- `components/AgendaModule.tsx` — consome via `getWhatsAppProvider().sendMessage(...)` (função `simulateWhatsAppSend`). A aba "WhatsApp" gerencia lembretes na tabela `whatsapp_reminders`.

### Como Trocar para API Real (quando o usuário pedir)

Quando o usuário pedir para integrar uma API de WhatsApp real (Twilio, Meta WhatsApp Business API, Evolution API, etc.):

1. **Criar um novo provider** em `lib/whatsapp/provider.ts` (ou novo arquivo), implementando a interface `WhatsAppProvider`:
   ```ts
   export class EvolutionApiProvider implements WhatsAppProvider {
     readonly id = 'evolution';
     readonly name = 'Evolution API';
     async sendMessage(phone: string, message: string, options?: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
       // fazer o POST real na API e chamar options.onStatus?.(...) conforme o status real
       // 'sent' = fila da API, 'delivered' = entregue, 'read' = lido/lido duplo check
     }
   }
   ```
2. **Ativar o provider** rodando `setWhatsAppProvider(new EvolutionApiProvider())` no início do app (ex.: `app/page.tsx`) ou verificando variável de ambiente (ex.: `NEXT_PUBLIC_WHATSAPP_PROVIDER === 'evolution'`).
3. **Regras obrigatórias ao integrar API real:**
   - **NUNCA commitar chaves/credenciais**. Ler de `process.env.*` (`*.env.local`), ex.: `NEXT_PUBLIC_EVOLUTION_URL`, `EVOLUTION_KEY`.
   - Não alterar a assinatura `sendMessage` — a UI depende dela.
   - Manter `buildReminderMessage` como única fonte de interpolação de templates.
   - Status devem continuar gravados na tabela `whatsapp_reminders` (status `scheduled/sent/delivered/read/confirmed/cancelled/rescheduled`).
   - Em ambiente sem API configurada, manter `SimulatorProvider` como fallback.
4. **Validar** com `npx tsc --noEmit` e `npx eslint lib/whatsapp components/AgendaModule.tsx`.
5. Commit com mensagem tipo `feat: integrar WhatsApp API real em [NomeDoProvider]`.

### Tabela `whatsapp_reminders` (colunas)

| Coluna | Tipo | Uso |
|---|---|---|
| `id` | text | `rem_N` |
| `appointment_id` | text | vínculo com `appointments` |
| `patient_name` | text | nome (desnormalizado) |
| `patient_phone` | text | telefone |
| `message_template` | text | mensagem já interpolada |
| `language` | text | `es/gn/pt/pt-BR/pt-PT/es-AR/es-PY/en` (CHECK) |
| `status` | text | `scheduled/sent/delivered/read/confirmed/cancelled/rescheduled` (CHECK) |
| `scheduled_for` | timestamp | quando disparar |
| `sent_at` | timestamp | quando enviou |
| `response_received` | text | `'1'`=confirmar, `'2'`=cancelar, `'3'`=remarcar |
| `created_at` / `updated_at` | timestamp | auditoria |

> **Nota:** a tabela `whatsapp_reminders` já possui CHECK de `language` e `status` com todos os valores usados — **nenhuma migração SQL é necessária** para o fluxo atual.
