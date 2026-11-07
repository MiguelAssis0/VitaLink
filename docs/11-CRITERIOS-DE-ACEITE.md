# Critérios de aceite verificáveis

## Fluxo feliz
- [ ] `docker compose up -d` inicializa PostgreSQL em localhost; frontend/backend iniciam com comandos do README.
- [ ] Paciente demo autentica, registra perfil médico fictício e consegue editá-lo.
- [ ] Paciente clica CTA de simulação, confirma, entra endereço manual ou concede localização e recebe ID persistido.
- [ ] A tela informa inequivocamente que nenhuma ambulância real foi acionada.
- [ ] Central demo recebe pedido novo sem refresh forçado (polling é aceitável), visualiza localização e altera estado respeitando máquina de estados.
- [ ] Operador vincula hospital fictício com grant; hospital autorizado acessa resumo médico mínimo.
- [ ] Hospital de outra instituição não consegue ler o dado mesmo conhecendo UUID.
- [ ] Timeline registra mudanças com horário e ator; auditoria registra acessos sensíveis sem registrar conteúdo médico.
- [ ] Paciente acompanha status apenas da própria ocorrência.
- [ ] Cancelamento simulado segue regra definida e não apaga a trilha.

## Falhas e segurança
- [ ] Ausência de conexão ou erro do banco nunca gera falsa confirmação.
- [ ] Usuário sem sessão não lê dados protegidos.
- [ ] Testes de IDOR, multi-tenant, CSRF, idempotência, concorrência e transições inválidas passam.
- [ ] Negar geolocalização não bloqueia entrada manual.
- [ ] Botão `Ligar 192` está visível e correto, sem alegar discagem completada.
- [ ] Rodar scanner de dependências e segredos em CI (falhas críticas impedem merge ou são documentadas para correção).

## UX/manutenção
- [ ] Mobile-first funcional em 360px e desktop; teclado e leitor de tela tratados nas principais telas.
- [ ] Todos os componentes de status têm texto, não só cor.
- [ ] Há README, `.env.example`, diagrama simples, docs de API e exemplos sintéticos.
- [ ] Migrações idempotentes e reproduzíveis em banco vazio.
- [ ] Sem dados pessoais reais em logs, testes ou seed.
- [ ] Rodar CI completo e registrar comandos/resultados.

## Não aceite
Um botão que apenas mostra 'ambulância solicitada' sem persistência, sem painel autorizado ou sem evidência de integração real NÃO atende ao projeto e é perigosamente enganoso.
