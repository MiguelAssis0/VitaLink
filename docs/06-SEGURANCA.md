# Requisitos de segurança obrigatórios

Referência: OWASP ASVS 5.0, diretrizes OWASP e LGPD. Meta de desenho com controles compatíveis com dados de saúde; **não alegar certificação ASVS** sem auditoria.

## Auth/session
- Preferir sessão server-side com cookie `HttpOnly`, `Secure` em HTTPS, `SameSite=Lax/Strict` conforme fluxo; rotação no login e logout, timeout de inatividade, invalidação do lado servidor.
- **CSRF habilitado** em mutações autenticadas via cookie; token CSRF para SPA, CORS restrito e same-origin em produção.
- Senhas com Argon2id em parâmetros seguros avaliados na implantação ou bcrypt com custo adequado; senha nunca logada. Reset token aleatório de uso único, hash armazenado, TTL curto.
- Rate limit em login, reset, criação de ocorrência e endpoints de consulta; backoff e observabilidade sem bloquear ajuda telefônica.
- Usuário desabilitado perde sessão; sessão de operador/hospital exige MFA antes de produção real. No MVP, permitir MFA fictício/planejado, mas **bloquear deployment real** sem ele.

## Authorization
- Modelo RBAC + ABAC: `PATIENT`, `DISPATCHER`, `HOSPITAL_STAFF`, `DEMO_ADMIN`.
- Autorização para CADA request: user ID, papel, instituição e vínculo da ocorrência; não confiar em IDs no front.
- `PATIENT` só acessa seus próprios perfis e chamados.
- `DISPATCHER` só acessa chamados da central associada, com scope por necessidade.
- `HOSPITAL_STAFF` só acessa ocorrência associada a sua instituição e com grant ativo.
- `DEMO_ADMIN` não lê dados clínicos por padrão.
- Proibir mass assignment, troca de instituição via payload e alteração client-side de `is_simulation`.

## API/security
- Bean Validation, limites por campo, size limits, paginação, query parametrizada via JPA, prevenção a XSS no React (não usar dangerouslySetInnerHTML para dados de usuário), headers CSP, HSTS (em produção HTTPS), X-Content-Type-Options, Referrer-Policy.
- Não usar localStorage para tokens de acesso; no MVP sem JWT por default se cookies bastarem.
- CORS fechado ao domínio oficial; secrets em variáveis/secret manager; `.env` no gitignore; SAST, dependency scan, secret scan em CI.
- HTTPS obrigatório fora de localhost; proibir envio de dados clínicos por email, console ou URL query.
- Idempotência e deduplicação nas ações de emergência; CSRF e rate limiting também nessas ações.

## Criptografia e dados
- Banco e backups criptografados em produção autorizada, além de proteção de campos sensíveis com mecanismo revisado.
- Chaves fora do banco e repositório; rotação e separação por ambiente; não inventar AES-CBC caseiro nem chave fixa compartilhada.
- Eliminar PII/PHI de logs, rastros, erros, métricas, screenshots e fixtures.
- Acesso à auditoria restrito; trilha append-only lógica e monitoramento de ações suspeitas.

## Threat model mínimo
1. Pessoa maliciosa forja solicitação -> rate limits, conta verificada quando disponível, confirmação e auditoria.
2. IDOR: paciente/hospital tenta acessar outra ocorrência -> ABAC no backend, testes negativos.
3. Funcionário consulta prontuário sem motivo -> escopo limitado, grant, auditoria.
4. Credenciais vazam -> cookies seguros, senha hash, MFA para profissionais antes de produção.
5. CSRF dispara pedido -> token CSRF e idempotência.
6. Browser nega localização -> modo manual, sem falsa precisão.
7. Rede cai -> não mostrar confirmação falsa; instruir ligar 192.
8. Funcionário modifica status concorrente -> optimistic locking, transições válidas, audit.
9. Vazamento via observabilidade -> redaction, nenhuma coleta de payload médico.
10. Ataque de indisponibilidade -> limites por IP/conta, timeouts, restrições de payload, alertas.

## Release gate obrigatório
NÃO disponibilizar para emergências reais sem: convênio/instrumento legal e API oficial da central; governança clínica; revisão LGPD; pentest independente; plano operacional 24/7; redundância e observabilidade; treinamento e suporte; MFA; análise de incidentes e aprovação institucional. Um MVP funcional não satisfaz esses requisitos.
