# Decisões, trade-offs e riscos

## Decisões arquiteturais
- **React + Spring Boot + PostgreSQL**: stack estabelecida, suficiente para lógica transacional e segurança. Custo de operação moderado.
- **Monólito modular** em vez de microserviços: mais simples de evoluir e testar, menos pontos de falha no MVP.
- **Sessão via cookie + CSRF**: evita exposição de token em armazenamento do browser; exige mesma origem ou configuração cuidadosa de CORS.
- **Atualização por polling** inicialmente: menos complexidade; SSE pode ser incluído após necessidade demonstrada.
- **Geolocalização opcional**: navegador pode negar ou fornecer baixa precisão; sempre exigir validação humana da localização informada.
- **Sem triagem por IA**: decisões clínicas e despacho não podem ser automatizados por protótipo não validado.
- **Sem dados de menores** até avaliação jurídica/especializada.

## Matriz de riscos
| Risco | Severidade | Mitigação |
|---|---|---|
| Usuário acha que ambulância real foi chamada | Crítica | Demo explícita em todas as telas, aviso após sucesso, ligação 192 |
| Acesso indevido a dados médicos | Crítica | ABAC, grants, audit, criptografia revisada, pentest futuro |
| Geolocalização incorreta | Alta | Mostrar precisão, endereço manual e ponto de referência, sem prometer rota |
| Falha da conexão | Crítica se operacional | Nunca confirmar falsamente; reforçar canal telefônico |
| Conta de staff comprometida | Alta | MFA antes de produção, sessões curtas, auditoria e mínimo privilégio |
| Uso de dados reais na demo | Alta | Seed sintética e proibição em docs/termos |
| Integração externa inexistente | Crítica | Sem chamadas reais; separar interface institucional e negociar parceria futura |
| Escopo explodir | Média | Fases, critérios claros e sem IA/microsserviços no MVP |

## Perguntas para evolução, não bloqueiam o MVP
1. Piloto com central privada ou poder público? Quais contratos e protocolos?
2. Atendimento adulto somente ou menores com responsáveis?
3. Operação em qual município e serviços de referência?
4. Como confirmar identidade e atualizar dados clínicos em cenário real?
5. Quem será controlador/operador LGPD e qual retenção necessária?
6. Infra e suporte 24/7? O que acontece quando todo o sistema falha?
7. Qual equipe clínica valida processo e campos de resumo médico?

## Evoluções condicionadas
Fase posterior: padrões HL7 FHIR para interoperabilidade, SSO institucional, integrações autorizadas, filas de eventos com outbox, mapas/licenciamento adequado, acessibilidade auditada, indicadores reais de performance. Não incluir automaticamente.
