# Requisitos funcionais (RF)

**RF01 — Cadastro/autenticação.** Criar conta de paciente adulto, verificar email apenas se provedor confiável estiver configurado (em dev usar caixa de email fictícia), login, logout, recuperação segura de senha. Não expor enumeração de contas. Contas de central/hospital provisionadas por seed local ou administração controlada, nunca por auto-registro público.

**RF02 — Perfil básico.** Nome de exibição, telefone, endereço preferencial e contatos de emergência opcionais. Validar no servidor. Evitar campos não necessários.

**RF03 — Perfil médico opcional.** Alergias, medicamentos em uso, condições declaradas, observações de relevância emergencial, último update. Mostrar 'informado pelo paciente — não verificado'. Campos sem obrigatoriedade, limites de tamanho e sanitização.

**RF04 — Controle de privacidade.** Explicar finalidade, base legal sujeita a avaliação de controlador, quem recebe os dados, retenção proposta; permitir editar/corrigir, exportar dados em formato legível e solicitar exclusão seguindo regras de retenção/documentação. Consentimento destacado apenas quando aplicável, jamais tratar consentimento como base única automaticamente.

**RF05 — Solicitar ajuda (simulada).** Botão destacado leva a tela de confirmação com localização manual ou permissionada; a submissão cria ocorrência simulada somente após confirmação. Não confundir simulação com pedido real; manter visível opção `Ligar 192`.

**RF06 — Localização.** Geolocalização HTML5 somente após permissão explícita. Mostrar precisão quando retornada; permitir ajustar endereço e ponto de referência manual; não inferir localização exata; registrar fonte (`BROWSER`, `MANUAL`) e instante. Negação de permissão não impede registro de simulação.

**RF07 — Descrição.** Campo curto de observação livre; nenhuma triagem automática; evitar sugerir que a descrição médica determina prioridade de despacho.

**RF08 — Ocorrências e idempotência.** Gerar identificador não sequencial; proteger contra duplo clique e retry por `Idempotency-Key`; usuário vê seu histórico e status. No máximo uma ocorrência simulada aberta por usuário, como regra de demonstração (com resposta 409 e link para ocorrência existente).

**RF09 — Central.** Lista paginada, pesquisa por ID/status, detalhes com localização, resumo médico mínimo quando autorizado, registro de ações. A central confirma recebimento, atribui recurso simulado, marca deslocamento, chegada e encerramento. Transições válidas verificadas no backend.

**RF10 — Hospital.** Só enxerga ocorrência atribuída por operador autorizado da mesma central de demonstração e informações estritamente necessárias, com expiração da autorização após encerramento + janela de retenção definida em política. Não pode enumerar pacientes/ocorrências de outras instituições.

**RF11 — Timeline.** Registrar timestamps UTC, ator e mudança de estado. Tempo real opcional via SSE autenticado e segregado; fallback polling seguro. Não confiar apenas na UI para autorização.

**RF12 — Cancelamento.** Paciente pode solicitar cancelamento simulado enquanto aplicável; central visualiza e confirma; não apagar eventos. Não fazer equivaler cancelamento da UI a cancelamento de serviço real.

**RF13 — Auditoria.** Registrar criação, consulta por equipe, autorização de compartilhamento, alterações de status, exportação e exclusão de dados; evitar logar dados médicos, tokens, endereço completo ou payload integral.

**RF14 — Estados explícitos.** `REQUESTED`, `ACKNOWLEDGED`, `RESOURCE_ASSIGNED`, `EN_ROUTE`, `ON_SCENE`, `CLOSED`, `CANCEL_REQUESTED`, `CANCELLED`. `CANCEL_REQUESTED` pode partir de estados abertos, e só central fecha como `CANCELLED` conforme regra. Não fingir que essas transições correspondem à regulação real do SAMU.

**RF15 — Demonstrativo.** Seed somente sintético: um paciente, operador, equipe e hospital de teste. Os logins devem ser explicados no README local; credenciais de desenvolvimento nunca em produção.

**RF16 — Degradação.** Se backend estiver indisponível, interface não afirma pedido registrado. Mostrar erro claro, orientar ligação 192 e manter informações inseridas localmente em memória durante a sessão (sem armazenamento persistente de dados sensíveis).
