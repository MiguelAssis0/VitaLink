# VitaLink — Guia mestre para o Codex

> **PROTÓTIPO / SIMULAÇÃO — NÃO ACIONA AMBULÂNCIAS REAIS.**

## Missão
Construir uma aplicação web demonstrável de coordenação de solicitações de emergência, com cadastro de perfil de saúde do paciente, central de regulação fictícia e painel hospitalar fictício, garantindo isolamento de dados, rastreabilidade, acessibilidade e um caminho seguro para futuras integrações institucionais.

## Ordem de leitura obrigatória
1. `01-PRODUTO-E-ESCOPO.md`
2. `02-REQUISITOS-FUNCIONAIS.md`
3. `03-REQUISITOS-NAO-FUNCIONAIS.md`
4. `04-ARQUITETURA.md`
5. `05-DADOS-E-PRIVACIDADE.md`
6. `06-SEGURANCA.md`
7. `07-API-E-CONTRATOS.md`
8. `08-DESIGN-SYSTEM-E-UX.md`
9. `09-TESTES-E-QUALIDADE.md`
10. `10-PLANO-DE-IMPLEMENTACAO.md`
11. `11-CRITERIOS-DE-ACEITE.md`
12. `12-OPERACAO-E-DEPLOY.md`
13. `13-DECISOES-E-RISCOS.md`
14. `14-FONTES.md`

## Instruções para agente de codificação
- Implementar código funcional incremental, não apenas mockups ou documentação.
- Nunca inventar conectividade com SAMU, ambulâncias ou hospitais; não criar endpoints externos para serviço público nem automações de disparo de chamadas reais.
- Uso de **dados sintéticos apenas** em seed, screenshots e testes. Não coletar dados médicos reais para demonstração.
- Não adicionar funcionalidades fora do MVP sem justificativa. Modular monolith antes de microserviços.
- Priorizar controles de autorização por objeto antes de polimento visual.
- Cada etapa deve terminar com testes executados, resultado reportado e atualização do README.
- Não introduzir configuração que possa alternar para despacho real sem integração institucional, revisão legal e validação técnica específica.
- Se faltar configuração essencial, fornecer `.env.example` e padrão seguro de desenvolvimento, sem embutir credenciais.
- Não bloquear a ajuda imediata: em toda tela de emergência, exibir botão 'Ligar 192' e instrução de que **somente ligar para 192 realiza um contato real**.
- Antes de terminar, fazer auto-revisão de segurança, tratamento de erros, manutenção e UX.

## Pronto quando
Todos os cenários de `11-CRITERIOS-DE-ACEITE.md` forem reproduzíveis em ambiente local por uma pessoa que acabou de clonar o repositório. Evitar alegações de prontidão para uso clínico ou emergencial real.

## Modalidade de entrega
**Obrigatoriamente WEBAPP** React/TypeScript acessado via navegador, responsivo e com PWA instalável (quando suportado). Consulte `15-WEBAPP-E-PWA.md`. Não construir aplicativos nativos.
