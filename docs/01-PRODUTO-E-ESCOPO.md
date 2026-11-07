# Visão de produto e escopo

## Problema
Em uma emergência, o solicitante pode estar sob estresse e não conseguir relatar prontamente endereço, alergias, medicamentos e condições preexistentes. A hipótese do VitaLink é que uma interface simplificada e a transmissão de um resumo mínimo de saúde, quando feita a um serviço autorizado, possam melhorar a preparação do atendimento. Essa hipótese **não está validada clinicamente**.

## Objetivo do MVP
Demonstrar de ponta a ponta, com atores fictícios, o fluxo: cidadão autenticado cria pedido -> central fictícia recebe e confirma -> central registra despacho fictício -> hospital fictício recebe dados mínimos somente quando vinculado -> ocorrência termina, com histórico e auditoria.

## Personas
- Cidadão: preenche dados mínimos; aciona emergência simulada em poucos toques.
- Operador central fictícia: visualiza fila de chamados, verifica localização, atribui equipe fictícia, vincula hospital fictício.
- Profissional hospitalar fictício: vê informações da ocorrência vinculada e apenas o resumo médico necessário.
- Administrador técnico: gerencia contas de instituições sintéticas; NÃO tem acesso padrão a dados médicos em texto claro.

## Abrangência
IN: registro/login, consentimentos e aviso de simulação; perfil de saúde opcional; contato de emergência; geolocalização do navegador com permissão e entrada manual; pedido com confirmação explícita; painel central; painel hospital; estados e timeline; notificações internas; revogação de acesso; auditoria; testes; interface responsiva.

OUT: solicitação real ao SAMU/UPA/hospital, telefonia programática, envio de SMS reais, despacho de frota real, IA para triagem clínica, diagnóstico, cálculo automático de risco/gravidade, sugestão de hospital por algoritmo, prescrições, prontuário completo, integração com SUS/Conecte SUS/RNDS, pagamentos, atendimento sem autenticação como fluxo principal, cadastro de menores na primeira versão.

## Premissas explícitas
- Brasil, pt-BR, fuso horário configurável com armazenamento UTC.
- **Somente usuários adultos (18+) no MVP**, com autodeclaração. Nenhum processamento real de saúde de menores.
- Uma central fictícia e um ou mais hospitais fictícios no ambiente de demonstração.
- Sem vínculo com serviços públicos reais. Toda ocorrência é etiquetada `SIMULADA` no backend e na UI.
- O recurso `tel:192` apenas abre discador quando suportado; não confirma ligação ou atendimento. Desktop mostra instruções para ligar.
- Em caso de indisponibilidade do sistema, continuar indicando o contato telefônico real 192.

## Métricas de produto (simuladas)
- Tempo até confirmar a solicitação; taxa de solicitações simuladas concluídas; incidência de erro; usabilidade; taxa de localização válida; taxa de execução dos testes.
- Não afirmar redução de tempo de socorro, mortalidade ou benefícios clínicos sem estudo e parceria.

## Terminologia
'Pedido', 'ocorrência', 'simulação', 'central fictícia', 'hospital fictício'. Não usar 'ambulância a caminho' sem subtítulo visual 'SIMULAÇÃO'.
