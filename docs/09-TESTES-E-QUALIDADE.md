# Estratégia de qualidade

## Backend
- JUnit 5 + Mockito: state machine, regras de autorização, validade de grants, retenção e idempotência.
- Spring Boot Test + Testcontainers/PostgreSQL: transações, migrações Flyway, queries com filtros, isolamento institucional.
- Security regression: 401 sem sessão; 403/404 em acesso indevido; CSRF; cross-tenant; IDOR; mass assignment; dupla requisição, rate limit.
- Verificar senhas hash, cookies, headers, no-store nas rotas clínicas e sanitização de logs.

## Frontend
- Vitest + React Testing Library: formulários, validação, avisos de simulação, falhas de API, localização negada, estados.
- Playwright: fluxo do paciente -> central -> hospital com dados falsos, em desktop e mobile.
- Axe ou check automatizado de acessibilidade + revisão manual teclado/screen reader.

## Testes essenciais
1. Cidadão não vê ocorrência de outro cidadão, mesmo trocando ID na URL.
2. Profissional do hospital A não vê dados atribuídos ao hospital B.
3. Hospital não atribuído não obtém perfil médico por ID conhecido.
4. Operador não pode alterar status fora da state machine.
5. Dois cliques/retry com mesma idempotency key criam uma única ocorrência.
6. Falha do banco não retorna sucesso.
7. Coordenadas negadas: modo manual funciona.
8. Desconexão/intermitência: paciente ainda encontra botão real 192.
9. Encerramento/revogação torna grant inválido.
10. Painéis e timeline sempre exibem 'SIMULAÇÃO'.
11. Se operador consegue ver dados médicos, há evento de auditoria de acesso.
12. Frontend não armazena tokens em localStorage ou dados médicos em persistência local.

## Definição de pronto
- CI verde: lint, format, build, test unit/integration e verificações básicas de dependência/segredos.
- Código sem TODO crítico em segurança, sem endpoints clínicos desprotegidos, sem credenciais reais.
- Cobertura de domínio sensível alta, alvo inicial >= 85% das classes de negócio críticas; não confundir percentual com qualidade.
- README com passos de setup, contas demo fictícias, rota feliz e limitações; ambiente sobe por comandos documentados.
- Revisão humana de acessibilidade e segurança obrigatória antes de qualquer demonstração pública.
