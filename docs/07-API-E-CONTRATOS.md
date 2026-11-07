# Contratos da API (rascunho v1)

Base `/api/v1`. JSON, autenticação por sessão, CSRF em mutações; erros `application/problem+json` com código estável. Campos de saúde apenas nos endpoints autorizados e sem cache compartilhado (`Cache-Control: no-store`).

| Método | Rota | Ator | Finalidade |
|---|---|---|---|
| POST | `/auth/register` | público | Conta adulta de paciente, com controle anti-abuso |
| POST | `/auth/login` | público | Sessão |
| POST | `/auth/logout` | autenticado | Encerrar sessão |
| GET | `/auth/me` | autenticado | Papel/identidade mínima |
| GET/PUT | `/patients/me` | paciente | Perfil básico |
| GET/PUT | `/patients/me/medical-profile` | paciente | Perfil de saúde |
| GET/PUT | `/patients/me/emergency-contacts` | paciente | Contatos |
| POST | `/emergencies` | paciente | Cria SIMULAÇÃO; cabeçalho Idempotency-Key obrigatório |
| GET | `/emergencies/mine` | paciente | Histórico paginado |
| GET | `/emergencies/{id}` | dono/operador/autorizado | Detalhes com DTO específico por ator |
| POST | `/emergencies/{id}/request-cancel` | dono | Solicita cancelamento |
| GET | `/central/emergencies` | dispatcher | Fila da central com escopo institucional |
| POST | `/central/emergencies/{id}/transitions` | dispatcher | Mudança de estado permitida |
| POST | `/central/emergencies/{id}/hospital-assignment` | dispatcher | Vincular hospital fictício e grant limitado |
| GET | `/hospital/emergencies` | hospital staff | Somente ocorrências atribuídas |
| GET | `/hospital/emergencies/{id}/medical-summary` | hospital staff | Resumo médico mínimo, auditado |
| GET | `/emergencies/{id}/events` | autorizado | Timeline |
| POST | `/patients/me/privacy-requests` | paciente | Solicitar exportação/exclusão |

## Exemplo de criação (dados sintéticos)
```json
{
  "location": {
    "source": "MANUAL",
    "address": "Rua Exemplo, 100 - Bairro Fictício",
    "reference": "Próximo à praça fictícia"
  },
  "notes": "Cenário fictício de demonstração"
}
```

Resposta HTTP 201 (somente após persistência):
```json
{
  "id": "e8ec0fd2-b99e-4b43-8e39-9a00d55ef6c2",
  "simulation": true,
  "status": "REQUESTED",
  "message": "Solicitação registrada na central de DEMONSTRAÇÃO. Nenhuma ambulância real foi acionada.",
  "createdAt": "2026-11-06T18:00:00Z"
}
```

## Regras de contrato
- DTO response para hospital não inclui email, contato de terceiros ou perfil completo se não necessário.
- `isSimulation=true` imposto no servidor e não aceito em requisição.
- `Idempotency-Key` tem escopo por usuário; mesma chave e payload devolve a mesma ocorrência, payload diferente retorna 409.
- Mudança de estado usa `expectedVersion` e retorna 409 se corrida; a transição, auditoria e eventos são commitados atomicamente.
- `/central` e `/hospital` nunca retornam ocorrências de outras instituições, mesmo se o cliente forjar IDs.
- Documentar com OpenAPI sem exemplos de PHI real, sem expor UI administrativa em produção por padrão.
