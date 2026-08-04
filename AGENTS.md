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

### Convenções de Nomenclatura

- Módulo **Agenda**: prefixo `agenda_` (ex: `agenda_save_changes`)
- Módulo **Recepção**: prefixo `rcpt_` (ex: `rcpt_alert_required_phone`)
- Chaves ficam em `lib/i18n/locales/*.json` na seção `app`

### Exceções (NÃO traduzir)

- Strings de console.log / console.error
- Strings em addAuditLog() (logs de auditoria internos - opcional traduzir)
- Nomes de arquivos técnicos
- Strings de comparação com banco de dados (devem bater com os values armazenados)
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

2. Usar o prefixo correto do módulo

3. Usar snake_case para as chaves

## Outras Regras

- Seguir o estilo de código existente
- Não adicionar comentários desnecessários
- Preferir edições em arquivos existentes
- Nunca commitar senhas ou chaves secretas

## Geração de IDs Sequenciais

**REGRA OBRIGATÓRIA:** Todos os IDs de registros em tabelas do Supabase DEVEM ser gerados via função RPC no banco. **NUNCA** gerar IDs no front-end com `Math.max()`, `useRef`, `Date.now()` ou qualquer lógica client-side.

### Por quê

- `Math.max(...numericIds) + 1` colide quando dois usuários cadastram ao mesmo tempo
- `useRef` zera ao dar F5 ou abrir nova aba
- `Date.now()` gera IDs únicos mas não sequenciais (ex: `agenda_1782752456551`)

### Como funciona

O Postgres tem sequences por tabela. O front chama funções RPC que usam `nextval()` atomicamente:

```tsx
// ✅ CORRETO - chamada RPC atômica
const { data: newId } = await supabase.rpc('next_patient_id');
const { data: newId } = await supabase.rpc('next_clinical_id', { p_prefix: 'soap' });

// ❌ ERRADO - lógica no front
const nextIdNum = Math.max(...numericIds) + 1;
patientId = `PAC${String(nextIdNum).padStart(3, '0')}`;
```

### Tabela de funções RPC disponíveis

| Função RPC | Prefixo/Formato | Tabela |
|---|---|---|
| `next_patient_id()` | `PAC001`, `PAC002`... | `patients` |
| `next_appointment_id()` | `CLI001`, `CLI002`... | `appointments` |
| `next_location_id()` | `loc_1`, `loc_2`... | `locations` |
| `next_room_id()` | `SALA001`, `SALA002`... | `clinical_rooms` |
| `next_professional_id()` | `PRF001`, `PRF002`... | `professionals` |
| `next_role_id()` | `role_01`, `role_02`... | `professional_roles` |
| `next_clinical_id(p_prefix text)` | `presc_0001`, `soap_0001`... | módulo 3 |

### Prefixos aceitos por `next_clinical_id()`

`presc`, `anam`, `soap`, `diag`, `exam`, `proc`, `att`, `sig`, `aso`

### Padrão recomendado em componentes

```tsx
const handleSave = async () => {
  if (!supabase) return;
  const { data: newId, error } = await supabase.rpc('next_clinical_id', { p_prefix: 'soap' });
  if (error || !newId) {
    console.error('Erro ao gerar ID:', error?.message);
    return;
  }
  await supabase.from('soap_notes').insert({ id: newId, ... });
};
```

### Migrações de sequence

As sequences ficam em `scripts/0[1-3]_*.sql`. Para sincronizar uma sequence após mudar dados manualmente:

```sql
select setval('seq_pacientes', 
  coalesce((select max(
    case when id ~ '^PAC[0-9]+$' 
         then substring(id from '^PAC([0-9]+)$')::int 
         else 0 end) from public.patients), 0) + 1,
  true);
```

NUNCA usar `Date.now()` como fallback em produção — manter consistência do formato.
