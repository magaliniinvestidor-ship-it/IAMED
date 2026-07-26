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
