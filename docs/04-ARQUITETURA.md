# Arquitetura de referência

## Stack
- React + TypeScript + Vite; React Router, TanStack Query, React Hook Form + Zod; Tailwind CSS (versão estável compatível com ambiente); ícones Lucide; acessibilidade nativa.
- Java 21 + Spring Boot (linha estável compatível com Java 21 escolhida no início e registrada no README); Spring Web, Spring Security, Spring Data JPA, Bean Validation, Actuator, Flyway.
- PostgreSQL 16+ em Docker para desenvolvimento; Testcontainers em integração.
- Gradle ou Maven (preferir Maven para configuração inicial mais simples), npm com lockfile.

## Modelo
Monólito modular, REST. Módulos `auth`, `patients`, `medical-profile`, `emergencies`, `dispatch-simulation`, `institutions`, `audit`, `shared`.

Fluxo:
```text
React patient/central/hospital
       | HTTPS + cookie de sessão seguro
       v
Spring Boot REST + RBAC/ABAC
  auth | patients | emergencies | institutions
       | transações / JPA
       v
  PostgreSQL
       |
       +--> audit_events / emergency_status_events
```

## Estrutura sugerida
```text
vitalink/
  README.md
  AGENTS.md
  .env.example
  compose.yaml
  docs/  # estes guidelines
  backend/
    pom.xml
    src/main/java/.../modules/{auth,patients,medical,emergency,institution,audit}/
    src/main/resources/db/migration/
    src/test/
  frontend/
    package.json
    src/{app,features,components,lib,styles}/
    src/features/{auth,patient,emergency,central,hospital}/
  .github/workflows/ci.yml
```

## Regras técnicas
- Domain state machine centralizada em serviço de domínio, nunca espalhada em controllers.
- Controllers recebem DTOs validados e retornam DTOs minimizados; entidades JPA nunca expostas diretamente.
- `@Transactional` em use cases; `@Version` optimistic locking para atualização concorrente, 409 em conflito.
- Repositórios sem acessar tabelas de outras instituições sem filtros de autorização. Testar IDOR e cross-tenant access.
- `Clock` injetável; timestamps UTC; IDs UUID gerados no backend; paginação e ordenação determinística.
- Não usar WebSocket/SSE como substituto de persistência ou autenticação.
- Sem sobreengenharia: não introduzir microsserviços, mensageria ou cache distribuído no primeiro MVP.
- Adicionar ADR curto para decisões divergentes.

## Tratamento de falhas
- `ProblemDetail`/RFC 9457 ou estrutura compatível: code, title, detail seguro, correlationId, timestamp. Nunca stacktrace para o cliente.
- Erros 400 de validação; 401 sessão ausente; 403 sem permissão; 404 recursos invisíveis (quando necessário para evitar enumeração); 409 conflito/idempotência; 429 limite; 500 genérico.
- Operação de criação somente exibe sucesso depois do commit; cliente trata retries usando idempotency key estável.
