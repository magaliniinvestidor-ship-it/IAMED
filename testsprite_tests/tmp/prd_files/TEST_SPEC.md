# IAMED — Especificação de Testes de Front-End

## 1. Visão Geral

**Projeto:** IAMED (Clínica Inteligente & CRM de Pacientes)  
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Supabase  
**Público-alvo:** Operadores de clínicas médicas, recepcionistas, médicos, gestores, financeiro  
**Idiomas:** pt-BR, pt-PT, es-AR, es-PY, es, en  

---

## 2. Fluxo de Autenticação (Login)

### 2.1 Tela de Login
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| L-01 | Exibir tela de login quando não autenticado | Nenhuma sessão ativa | Formulário de login com campos de e-mail e senha deve aparecer |
| L-02 | Seletor de idioma funcional | Clicar no botão de idioma | Dropdown com 6 idiomas aparece |
| L-03 | Trocar idioma no login | Selecionar "English" | Textos do formulário mudam para inglês |
| L-04 | Campo e-mail vazio | Submeter formulário sem e-mail | Mensagem "Por favor informe seu e-mail" |
| L-05 | Senha muito curta | Digitar senha com < 4 caracteres | Mensagem "A senha deve ter pelo menos 4 caracteres" |
| L-06 | Login com credenciais inválidas (Supabase conectado) | E-mail/senha incorretos | Mensagem de erro + contagem de tentativas |
| L-07 | Login com placeholder (modo demonstração) | URL do Supabase é placeholder | Login bypassado com sessão mock |
| L-08 | Bloqueio por tentativas | 5 tentativas falhas seguidas | Mensagem "Conta bloqueada por 30 minutos" |
| L-09 | Visualizar/ocultar senha | Clicar no ícone de olho | Senha alterna entre texto e password |
| L-10 | Login bem-sucedido | Credenciais válidas | Redireciona para o dashboard principal |

### 2.2 Controle de Sessão
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| S-01 | Header exibe operador e role | Login realizado | Nome do operador + badge com role aparecem no header |
| S-02 | Badge de conexão Supabase | Login realizado | Badge "Supabase Conectado" (verde) ou "Modo Demonstração" (âmbar) |
| S-03 | Logout | Clicar em "Sair" | Sessão encerrada, retorna à tela de login |
| S-04 | Auditoria de login | Login/logout | Registro criado no log de auditoria |
| S-05 | Timeout por inatividade | 55 min sem atividade | Modal de aviso "Sessão Prestes a Expirar" aparece |
| S-06 | Renovar sessão | Mover mouse ou teclar no modal | Modal desaparece, timer reinicia |
| S-07 | Logout automático | 60 min sem atividade | Sessão encerrada automaticamente |

---

## 3. Dashboard Principal

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| D-01 | Exibir cards dos módulos | Login realizado | Grid com 21 cards de módulo visível |
| D-02 | Títulos dos módulos | Navegar pelos cards | Cada card tem número e título descritivo |
| D-03 | Abrir módulo | Clicar em um card | Breadcrumb e conteúdo do módulo aparecem |
| D-04 | Voltar ao portal | Clicar em "Voltar ao Portal Geral" | Retorna ao grid de módulos |
| D-05 | Loader de dados | Primeiro acesso | "Sincronizando dados do Supabase..." aparece |

---

## 4. Módulo: Recepção e Admissão (1) + Agenda (2)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| R-01 | Lista de pacientes | Abrir módulo 1 ou 2 | Tabela de pacientes com nome, prioridade, status |
| R-02 | Cadastrar paciente | Preencher formulário e salvar | Paciente adicionado à lista |
| R-03 | Check-in de paciente | Clicar em "Check-In" | Status muda para "aguardando" |
| R-04 | Iniciar atendimento | Clicar em "Atender" | Status muda para "atendimento" |
| R-05 | Finalizar atendimento | Clicar em "Concluir" | Status muda para "atendido" |
| R-06 | Filtro por status | Selecionar filtro | Lista filtra corretamente |
| R-07 | Criação de agendamento | Preencher formulário | Consulta aparece na agenda |
| R-08 | Agenda médica | Navegar pela agenda | Consultas do dia exibidas por horário |

---

## 5. Módulo: Histórico Clínico (3) / HCE

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| H-01 | Selecionar paciente | Clicar em paciente na lista | Prontuário do paciente carrega |
| H-02 | Linha do tempo clínica | Visualizar prontuário | Evoluções clínicas ordenadas por data |
| H-03 | Nova evolução | Preencher anamnese e salvar | Registro adicionado à linha do tempo |
| H-04 | Prescrição de medicamentos | Adicionar medicamento na evolução | Medicamento listado na prescrição |
| H-05 | Dr. IA (Gemini) | Clicar em "Resumo Clínico" | Chamada à API Gemini, resumo exibido |
| H-06 | Upload de arquivos | Anexar arquivo na evolução | Arquivo listado nos anexos |

---

## 6. Módulo: Diagnóstico por Imagens (4)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| I-01 | Visualizador PACS | Abrir exame de imagem | Imagem DICOM exibida com controles |
| I-02 | Ajuste de brilho/contraste | Mover sliders | Imagem altera brilho/contraste |
| I-03 | Laudo do exame | Digitar laudo e salvar | Laudo associado ao exame |
| I-04 | Lista de exames laboratoriais | Navegar para lab | Resultados de exames exibidos |

---

## 7. Módulo: Faturamento SIFEN (5) + Financeiro (6)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| F-01 | Criar DTE | Preencher formulário e emitir | DTE gerado com XML e CDC |
| F-02 | Visualizar KuDE | Clicar em "Ver KuDE" | Modal com representação gráfica do DTE |
| F-03 | Baixar XML do DTE | Clicar em "Baixar XML" | Arquivo .xml é baixado |
| F-04 | Cancelar DTE | Clicar em "Cancelar" | Status muda para "Cancelado" |
| F-05 | Conciliar pagamento | Selecionar gateway | Status muda para "conciliado" |
| F-06 | Lançamento financeiro | Adicionar receita/despesa | Novo lançamento na lista |
| F-07 | Dashboard financeiro | Visualizar | Gráficos de receita/despesa/saldo |
| F-08 | Contas a pagar/receber | Abrir abas AP/AR | Listas filtradas por status |

---

## 8. Módulo: Estoque e Farmácia (7)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| E-01 | Lista de medicamentos | Abrir módulo 7 | Tabela de itens com quantidades |
| E-02 | Cadastrar medicamento | Preencher formulário | Item adicionado ao estoque |
| E-03 | Controle de lote | Adicionar lote | Lote vinculado ao medicamento |
| E-04 | Movimentação de estoque | Registrar entrada/saída | Quantidade atualizada |
| E-05 | Alerta de estoque baixo | Estoque abaixo do mínimo | Destaque em vermelho no item |
| E-06 | Farmacovigilância | Registrar evento adverso | Evento listado no log |

---

## 9. Módulo: Medicina do Trabalho (8, 9)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| M-01 | Lista de ASOs | Abrir módulo 8 ou 9 | Exames ASO listados |
| M-02 | Novo ASO | Preencher formulário | ASO adicionado com riscos e status |
| M-03 | Laudo de aptidão | Definir "apto" ou "inapto" | Status atualizado no exame |

---

## 10. Módulo: Marketing e CRM (10) + BI (12)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| C-01 | Dashboard de Marketing | Abrir módulo 10 | Gráficos de campanhas e NPS |
| C-02 | NPS Analyser | Visualizar | Score NPS e distribuição |
| C-03 | BI Analyst | Abrir módulo 12 | Gráficos de desempenho financeiro |

---

## 11. Módulo: Internação e Centro Cirúrgico (11)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| I-01 | Mapa de leitos | Abrir módulo 11 | Leitos por ala com status visual |
| I-02 | Internar paciente | Selecionar leito e paciente | Leito marcado como "ocupado" |
| I-03 | Alta hospitalar | Clicar em "Alta" | Leito volta a "disponível" |
| I-04 | Centro cirúrgico | Navegar para CCIR | Agendamento cirúrgico |

---

## 12. Módulo: Portal do Paciente (13)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| P-01 | Videoconsulta | Clicar em "Iniciar Teleconsulta" | Câmera ativada, chamada simulada |
| P-02 | Histórico do paciente | Visualizar | Dados do paciente exibidos |

---

## 13. Módulo: Administração do Sistema e Segurança (14)

### 13.1 Gestão de Usuários (aba "Usuários")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-01 | Listar usuários | Abrir módulo 14 > aba Usuários | Lista de usuários com nome, e-mail, role, status |
| A-02 | Criar usuário | Preencher formulário completo | Novo usuário aparece na lista |
| A-03 | Criar usuário com especialidades | Digitar especialidade + Enter | Tag da especialidade adicionada |
| A-04 | Remover especialidade | Clicar no "x" da tag | Especialidade removida |
| A-05 | Editar usuário | Clicar no ícone de editar | Formulário preenchido com dados do usuário |
| A-06 | Alterar status do usuário | Clicar em ativar/desativar | Status alterna entre ativo/inativo |
| A-07 | Validação de campos obrigatórios | Submeter sem nome | Formulário não envia |
| A-08 | Auditoria de criação/edição | Salvar usuário | Log criado no terminal de auditoria |

### 13.2 RBAC (aba "RBAC")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-09 | Selecionar profissional | Escolher no dropdown | Permissões do profissional carregam |
| A-10 | Ativar permissão visualizar | Marcar checkbox | Checkbox fica marcado, log gerado |
| A-11 | Desativar permissão | Desmarcar checkbox | Checkbox desmarcado, log gerado |
| A-12 | Selecionar tudo | Clicar "Selecionar Tudo" | Todos os checkboxes marcados |
| A-13 | Limpar tudo | Clicar "Limpar Tudo" | Todos os checkboxes desmarcados |
| A-14 | Terminal de auditoria | Realizar alterações | Logs aparecem no terminal escuro |

### 13.3 Política de Senhas (aba "Política de Senhas")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-15 | Ativar/desativar política | Toggle | Política ativa/desativada visualmente |
| A-16 | Ajustar tamanho mínimo | Slider 4-32 | Valor numérico atualiza |
| A-17 | Requisitos de complexidade | Marcar/desmarcar checkboxes | Requisitos atualizados |
| A-18 | Definir expiração | Input numérico | Valor salvo |
| A-19 | Definir histórico | Input numérico | Valor salvo |
| A-20 | Salvar política | Clicar em "Salvar" | Feedback visual "Política Salva", log gerado |

### 13.4 Bloqueio Automático
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-21 | Ajustar tentativas máximas | Slider | Valor numérico atualiza |
| A-22 | Ajustar duração do bloqueio | Slider | Valor numérico atualiza |
| A-23 | Ajustar timeout de sessão | Slider | Valor numérico atualiza |

### 13.5 2FA / MFA (aba "2FA / MFA")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-24 | Barra de progresso 2FA | Visualizar | Barra mostra % de usuários com 2FA ativo |
| A-25 | QR Code TOTP | Visualizar | QR Code simulado + URI do TOTP |
| A-26 | Mostrar chave secreta | Clicar "Mostrar" | Chave secreta revelada |
| A-27 | Verificar código TOTP | Digitar 6 dígitos e "Verificar" | Feedback "2FA verificado com sucesso" |
| A-28 | Código inválido | Digitar < 6 dígitos | Alerta "Digite um código de 6 dígitos" |
| A-29 | Códigos de backup | Visualizar | 5 códigos exibidos |
| A-30 | Regenerar códigos | Clicar "Regenerar" | Novos códigos gerados, anteriores invalidados |
| A-31 | Status 2FA por usuário | Visualizar sidebar | Cada usuário com badge TOTP/SMS/E-mail ou Inativo |

### 13.6 SSO (aba "SSO")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-32 | Listar provedores | Abrir aba | Provedores configurados exibidos |
| A-33 | Adicionar provedor OIDC | Preencher formulário | Provedor adicionado à lista |
| A-34 | Adicionar provedor SAML | Selecionar tipo SAML | Campo de certificado aparece |
| A-35 | Editar provedor | Clicar em editar | Formulário preenchido |
| A-36 | Ativar/desativar provedor | Toggle | Status alterna |

### 13.7 Sessões (aba "Sessões")
| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| A-37 | Listar sessões ativas | Abrir aba | Sessões com IP, dispositivo, horários |
| A-38 | Filtrar sessões | Clicar "Ativas" / "Todas" | Lista filtra corretamente |
| A-39 | Revogar sessão | Clicar "Revogar Sessão" | Sessão marcada como revogada, log gerado |
| A-40 | Log de tentativas de login | Visualizar | Tentativas com sucesso/falha, IP, user agent |
| A-41 | Limpar log de tentativas | Clicar "Limpar Log" | Lista esvaziada, log gerado |

---

## 14. Módulo: Convênios (15) e Honorários (16-21)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| K-01 | Listar convênios | Abrir módulo 15 | Cartões de convênios com dados |
| K-02 | Tabela de honorários | Abrir módulo 16 | Tabela com procedimentos e preços |
| K-03 | Coparticipação | Abrir módulo 17 | Configuração de copagamento e tetos |
| K-04 | Lotes massivos | Abrir módulo 18 | Lista de faturas em lote |
| K-05 | Elegibilidade | Abrir módulo 19 | Simulação de consulta de elegibilidade |
| K-06 | Honorários e repasse | Abrir módulo 20 | Controle de honorários |
| K-07 | Pacientes estrangeiros | Abrir módulo 21 | Faturamento Mercosul |

---

## 15. Testes de Idioma (i18n)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| I-01 | Trocar idioma no header | Selecionar idioma no dropdown | Textos da interface mudam imediatamente |
| I-02 | Persistência do idioma | Trocar idioma e recarregar | Idioma selecionado mantido |
| I-03 | Todos os módulos traduzidos | Navegar por todos os módulos | Textos principais traduzidos (ou fallback para chave) |
| I-04 | pt-BR completo | Selecionar pt-BR | Todos os textos em português brasileiro |

---

## 16. Testes de Responsividade

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| R-01 | Viewport desktop (1920x1080) | Redimensionar | Layout completo com sidebar e header |
| R-02 | Viewport tablet (768x1024) | Redimensionar | Cards em grid adaptável |
| R-03 | Viewport mobile (375x667) | Redimensionar | Layout vertical, menu simplificado |

---

## 17. Testes de Dados Mockados (Modo Demonstração)

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| M-01 | Funcionamento sem Supabase | URL do Supabase = placeholder | Sistema opera com dados mock |
| M-02 | Persistência em memória | CRUD em modo demonstração | Dados alterados funcionam na sessão |
| M-03 | Badge "Modo Demonstração" | Modo demonstração ativo | Badge âmbar visível no header |

---

## 18. Testes de Regressão

| ID | Caso de Teste | Entrada | Resultado Esperado |
|----|--------------|---------|-------------------|
| G-01 | Build sem erros | `npm run build` | Compilação TypeScript bem-sucedida |
| G-02 | Navegação entre módulos | Abrir/fechar vários módulos | Sem travamentos ou erros de renderização |
| G-03 | Logout e relogin | Sair e entrar novamente | Estado limpo, dados recarregados |
