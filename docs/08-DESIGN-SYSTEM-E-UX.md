# Design system, UX e acessibilidade

## Identidade
Nome provisório VitaLink. Produto de emergência deve priorizar legibilidade, consistência e não induzir falsa sensação de segurança. Não usar logotipos, cores e selos que insinuem afiliação oficial ao SAMU ou hospitais.

## Tokens sugeridos (verificar contraste)
- Brand navy `#12304A` — cabeçalho e texto forte.
- Brand teal `#087E83` — ações secundárias e identidade.
- Danger `#B42318` — chamada de emergência e estados críticos, sempre com rótulo textual.
- Background `#F7F9FB`, surface `#FFFFFF`, text `#172B3A`, muted `#536575`, border `#D8E1E8`.
- Success `#18794E`, warning `#8F5900` — nunca codificar status só por cor.
- Font: system stack ou Inter com fallback, sem depender de CDN externa.
- Spacing 4/8/12/16/24/32; radius 8/12; sombras leves; responsivo mobile-first.

## Layouts
1. Landing: explicação clara de simulação, botão 'Ligar 192' e botão 'Explorar demonstração'.
2. Cadastro/login: formulários simples, campos obrigatórios mínimos, acessibilidade.
3. Dashboard paciente: estado atual, atalho para perfil médico e chamada de **simulação**.
4. Perfil médico: seções alergias, medicações, condições, observações; indicador da última atualização; aviso 'autodeclarado'.
5. Solicitação: CTA primário 'Criar pedido de simulação', confirmação explícita, geolocalização opcional, alternativa manual, aviso fixo com `Ligar 192`.
6. Acompanhamento: status e timeline bem legíveis, 'SIMULAÇÃO' sempre próximo do título; mensagens de falha claras.
7. Central: tabela/lista paginada, filtros, detalhe em painel, confirmação de ações, nenhuma triagem automatizada.
8. Hospital: fila de pacientes atribuídos, detalhe mínimo e acesso clínico auditado.

## Texto crítico obrigatório
- Antes de criar: '**Demonstração:** este botão registra um chamado fictício e **não** solicita ambulância real. Em emergência, ligue **192**.'
- Após criar: 'Pedido **simulado** registrado. **Nenhuma ambulância real foi acionada.**'
- Em falha: 'Não foi possível registrar o pedido de simulação. Em emergência real, ligue **192**.'
- Botão real: 'Ligar 192' com `href="tel:192"` quando suportado; em desktop destacar o número legível, sem confirmar ou prometer ligação.

## Regras de interação
- Confirmação antes de criar simulação evita toques acidentais; nunca forçar cadastro para visualizar instrução de telefone real.
- Indicadores com `aria-live` para status; gerenciamento de foco em modais; `label`, hint, erro por campo; teclado completo.
- Alvos de toque generosos, texto >= 16px em mobile, opção de zoom de 200%; sem animação essencial ou flash.
- Consentimento/privacidade: texto legível, opt-in separado quando juridicamente aplicável, nunca checkbox pré-marcado.
- Loading real, estados vazios, erro, offline e sem permissão de localização implementados.
- Nunca mostrar ETA, rota de ambulância, fila real ou hospital de destino como se fossem dados operacionais reais.
