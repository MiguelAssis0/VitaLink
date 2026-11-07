# VitaLink — Webapp e PWA

## Modalidade obrigatória
O produto será um **webapp responsivo, mobile-first**, acessado por URL em navegadores mobile e desktop. Não desenvolver aplicativo nativo Android/iOS, nem Unity, Electron ou wrappers nativos no MVP. A mesma aplicação web disponibilizará três experiências protegidas por RBAC: paciente, central fictícia e hospital fictício.

## PWA
- Implementar Progressive Web App instalável quando suportado: `manifest.webmanifest`, ícones próprios, `display: standalone`, `start_url`, `theme_color` e service worker.
- Usar Vite PWA ou integração equivalente, com atualização controlada de assets estáticos.
- **Não colocar em cache prontuários, dados médicos, tokens, solicitações, URLs autenticadas ou respostas da API.** Para rotas e requisições privadas, estratégia network-only; cabeçalhos `Cache-Control: no-store`.
- Offline: mostrar indicação clara de desconexão e impedir criar, enviar ou confirmar pedidos de emergência simulada sem resposta comprovada do servidor; nunca enfileirar para envio posterior nem mostrar sucesso local. O atalho de ligação 192 deve permanecer visível.
- Não depender de push notifications para execução do fluxo crítico. Se houver notificações, elas são apenas complementares; usar polling ou SSE autenticado com reconciliação do estado no servidor.

## UX mobile-first
- Fluxo de simulação em poucos toques, com botão principal de grande área clicável, tela de revisão e confirmação explícita; não prometer despacho real.
- Identificação inequívoca `AMBIENTE DE SIMULAÇÃO` em todas as telas relevantes, inclusive na PWA instalada, com opção visível `Ligar 192` (link `tel:192` quando suportado).
- Permitir geolocalização apenas após consentimento do navegador, com revisão de endereço e alternativa de preenchimento manual.
- Navegação acessível por teclado, layout em 320/360/390px, suporte a zoom, leitores de tela e alto contraste; estados de loading/erro/offline/sem localização.
- No dashboard institucional usar layout desktop-first adaptado para tablets e mobile sem eliminar ações essenciais.

## Qualidade e aceite
- Testes Playwright em viewport mobile e desktop: cadastro, perfil médico fictício, abertura de solicitação simulada, visualização autorizada na central e hospital.
- Testar PWA instalável em HTTPS ou localhost e o comportamento offline. Verificar que nenhum dado sensível permanece em Cache Storage, precache, IndexedDB ou localStorage.
- Verificar que telas protegidas não são acessíveis por outros perfis e que refresh/deep-link funcionam.
- Publicação só em HTTPS, com política de cookies seguros e CSP apropriada. PWA não altera o caráter demonstrativo da plataforma.
