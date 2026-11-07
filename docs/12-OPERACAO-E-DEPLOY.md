# Operação, ambientes e deploy

## Ambientes
`local`: dados sintéticos, indicador 'DEMO' permanente, compose local. `staging`: dados sintéticos, autenticação robusta, acesso restrito, HTTPS, logs redigidos. `production`: **não habilitar** fluxo emergencial real até cumprir gate regulatório/institucional.

## Configuração
- `.env.example` documenta `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `APP_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `SESSION_COOKIE_SECURE`, `DEMO_MODE=true` e timeout de sessão.
- Credenciais reais não versionadas; secrets por gerenciador em produção.
- `DEMO_MODE` deve ser servidor-side e validado na inicialização; **não implementar um `DEMO_MODE=false` que habilite disparo real automaticamente**.

## Observabilidade
- Endpoints health/readiness sem dados privados; request ID; logs com identificador de ocorrência, nunca texto livre médico/endereço.
- Métricas agregadas (contagem, erros, latência), sem identidade pessoal. Não expor Actuator sensível publicamente.
- Banco com migrations automáticas verificadas; backups/restore para ambiente autorizado; teste de restore antes de operação real.

## Segurança de infraestrutura
- PostgreSQL sem porta pública em staging/produção; containers sem privilégios, usuário não-root, imagens fixadas; CI com SBOM/dependency scan; HTTPS no reverse proxy; firewall e atualização.
- Prevenir exposição de OpenAPI/actuator sensível; segregação de backups; chave de criptografia fora dos artefatos.

## Incidente e contingência
- Em demonstração, indisponibilidade não pode ser representada como falha do SAMU. UI sempre mostra 'ligue 192' para emergências reais.
- Se o sistema algum dia virar operacional, exigir fluxos de plantão, monitoramento 24/7, contingência telefônica, parceria formal, avaliação de riscos e aprovação de operação.

## Checklist de entrega
README (versões e comandos), documentação de ambiente, arquitetura/ADR, políticas de segurança, relatório de testes, limitações, backup/migração, dependências, tratamento de erros e roadmap.
