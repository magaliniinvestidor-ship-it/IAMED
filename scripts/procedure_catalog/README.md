# Importadores do catálogo unificado de procedimentos

Esta pasta contém os scripts que populam a tabela Supabase
`public.procedure_catalog` com os nomencladores oficiais usados
pelo IAMED:

- `import_sigtap.mjs` — SIGTAP (SUS, Brasil)
- `import_tuss_cbhpm.mjs` — TUSS-CBHPM (setor suplementar, Brasil)
- `import_sns_portugal.mjs` — SNS (Portugal) — MCDT ou Atos Médicos
- `import_ips_paraguay.mjs` — IPS (Paraguai) e demais financiadores
- `import_all.mjs` — runner que chama os quatro em sequência
- `_shared.mjs` — utilidades compartilhadas (env, parser CSV, upsert)

## Configuração

Defina em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

A `service_role` é necessária para `upsert` ignorar RLS.

## Execução individual

```bash
node scripts/procedure_catalog/import_sigtap.mjs --file ./dados/tb_procedimento.csv
node scripts/procedure_catalog/import_tuss_cbhpm.mjs --file ./dados/tuss.csv
node scripts/procedure_catalog/import_sns_portugal.mjs --file ./dados/sns_mcdt.csv --nomenclature mcdt
node scripts/procedure_catalog/import_ips_paraguay.mjs --file ./dados/ips.csv --financiador IPS
```

Cada script aceita `--dry-run` para validar o mapeamento sem gravar,
e `--limit N` para subir apenas as primeiras N linhas (debug).

## Execução em lote

```bash
node scripts/procedure_catalog/import_all.mjs \
  --sigtap ./dados/tb_procedimento.csv \
  --tuss   ./dados/tuss.csv \
  --sns    ./dados/sns_mcdt.csv \
  --ips    ./dados/ips.csv
```

## Fontes oficiais

| Catálogo     | Origem                                                                                          | URL típica                                                                |
|--------------|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| SIGTAP       | DATASUS (Ministério da Saúde, BR)                                                               | http://sigtap.datasus.gov.br                                              |
| TUSS-CBHPM   | ANS (Agência Nacional de Saúde Suplementar, BR)                                                 | https://www.gov.br/ans/pt-br/arquivos/assuntos/prestadores/tuss            |
| SNS Portugal | SPMS / transparência SNS (PT)                                                                   | https://transparencia.sns.gov.pt                                          |
| IPS Paraguay | IPS — tabela oficial (fornecida pelo usuário como CSV)                                          | (manual)                                                                  |

## Formato esperado dos CSVs

| Script             | Coluna obrigatória 1 | Coluna obrigatória 2 | Colunas opcionais              |
|--------------------|----------------------|----------------------|--------------------------------|
| `import_sigtap`    | `CO_PROCEDIMENTO`    | `NO_PROCEDIMENTO`    | `NO_GRUPO` (categoria)         |
| `import_tuss_cbhpm`| `Código TUSS`        | `Procedimento`       | `Grupo` (categoria)            |
| `import_sns_*`     | `codigo`             | `designacao` ou `descricao` | (n/a)                    |
| `import_ips_*`     | `codigo`             | `descricao`          | `categoria`, `financiador`     |

Separador padrão: `;` (ponto e vírgula).

## Política de upsert

Todos os scripts usam `upsert` com `onConflict: 'nomenclature,code'`
— rodar várias vezes não duplica registros, apenas atualiza.

## Validação recomendada após a carga

```sql
select nomenclature, count(*)
from public.procedure_catalog
group by nomenclature
order by nomenclature;
```
