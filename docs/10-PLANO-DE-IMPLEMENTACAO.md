# Plano de implementação incremental

## Etapa 0 — scaffolding
Monorepo, README, AGENTS.md (cópia das regras essenciais), compose com PostgreSQL, Spring Boot, React, Flyway, lint/testes/CI e `.env.example`. Fazer a aplicação subir localmente com healthcheck. Configurar domínio `demo` por padrão.

## Etapa 1 — Identidade e permissões
Cadastro/login paciente; seed seguro de operador/hospital fictícios; papéis e instituição; políticas backend, testes negativos de isolamento. Nunca abrir endpoint de criação de staff para público.

## Etapa 2 — Perfil e privacidade
Dados básicos, perfil médico opcional, contatos, autorização clara de tratamento demonstrativo; validadores, UI e testes. Somente dados fictícios na seed.

## Etapa 3 — Solicitação simulada
Localização com fallback, confirmação explícita, persistência, idempotência, status `REQUESTED`, timeline e detalhes. 'Ligar 192' em todo o fluxo.

## Etapa 4 — Central
Fila e detalhes, transições, visão e atualização de disponibilidade da frota, audit events, conflitos concorrentes.

## Etapa 5 — Hospital
Vincular hospital fictício, grants, resumo mínimo, revogação/expiração e testes de acesso entre instituições.

## Etapa 6 — Robustez
Tratamento de falhas/retries, estados vazios, acessibilidade, testes E2E, CI, scans, documentação OpenAPI/README.

## Entrega por etapa
Ao finalizar, informar: arquivos criados/alterados, decisões relevantes, como executar, testes rodados e próximos itens. Não dizer 'feito' se a etapa não compila.

## Prioridade se prazo apertar
Demonstrar fluxo mínimo seguro: paciente -> pedido simulado -> central -> hospital com um resumo clínico fictício e controle de acesso. Adiar SSE, mapas complexos, dashboard de métricas e uploads.
