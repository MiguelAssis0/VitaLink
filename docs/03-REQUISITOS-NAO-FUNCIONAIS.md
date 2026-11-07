# Requisitos não funcionais

- **Segurança por padrão**: deny-by-default; controle de acesso por papel, instituição, paciente e objeto; nenhuma API sensível pública.
- **Privacidade**: minimização e finalidade específica; retenção configurável sob decisão documentada; nenhuma telemetria com PHI/dados clínicos.
- **Acessibilidade**: WCAG 2.2 AA como meta; navegação por teclado, foco visível, contraste, tamanho de toque >= 44x44 px quando viável, avisos legíveis por leitores de tela. Testar também com fontes ampliadas.
- **Resiliência**: se gravação falha, nunca mostrar sucesso; confirmação é derivada da transação persistida no servidor.
- **Disponibilidade**: MVP local é demonstrativo; sem promessa de SLA 24/7 ou uso em risco de vida. Desenhar para futura redundância, sem alegação de prontidão operacional.
- **Performance**: em ambiente de dev normal e dataset sintético pequeno, API p95 alvo <500 ms para operações sem serviços externos; métricas sob teste, não garantia. UI LCP alvo <2.5s em rede boa. Sem bloquear interação por mapa pesado.
- **Manutenção**: acoplamento baixo, nomes claros, SRP, regras no domínio, composição sobre herança desnecessária; testes de transição; documentação de decisões.
- **Observabilidade**: logs JSON estruturados, trace/request id, métricas HTTP sem PII, readiness/liveness; não fazer log de payloads médicos.
- **Escalabilidade**: paginação, índices, migrações, controle de concorrência; adiar Kafka/Redis/Kubernetes até haver necessidade.
- **Compatibilidade**: navegadores modernos mobile e desktop, pt-BR; geolocalização requer contexto seguro (HTTPS/localhost).
- **Internacionalização futura**: textos centralizados; horários ISO/UTC; formatação por locale na interface.
- **Confiabilidade das mensagens**: eventos críticos de status ficam primeiro no banco; SSE apenas acelera atualização visual e não é fonte de verdade.
