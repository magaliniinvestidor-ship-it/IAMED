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
