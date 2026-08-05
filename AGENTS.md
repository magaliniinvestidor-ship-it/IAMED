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

## Outras Regras

- Seguir o estilo de código existente no repositório.
- Manter o código limpo, eliminando comentários desnecessários.
- Preferir edições em arquivos existentes antes de criar arquivos duplicados.
- Nunca commitar senhas, tokens ou chaves secretas.
