# Dados e privacidade (LGPD)

**Aviso**: diretriz de engenharia; não substitui análise jurídica, DPIA/RIPD, governança clínica, DPO/encarregado nem autorização dos serviços participantes.

## Categorias de dados
- Conta: ID, email, hash da senha, role(s), instituição, createdAt.
- Paciente: identificação mínima e contato; endereço preferencial opcional.
- Perfil clínico **autodeclarado**: alergias, condições relevantes, medicamentos, observações, última atualização.
- Ocorrência: ID, status, localização fornecida/consentida, descrição breve, usuário, instituição/central, hospital atribuído (opcional), timestamps.
- Auditoria: tipo de evento, ator, recurso, data, correlação e justificativa, sem conteúdo clínico ou geolocalização completa.

## Modelo relacional proposto
`users(id,email,password_hash,role,institution_id,created_at,disabled_at)`
`patients(id,user_id,display_name,phone,preferred_address,created_at)`
`medical_profiles(id,patient_id,allergies_ciphertext,medications_ciphertext,conditions_ciphertext,notes_ciphertext,updated_at)`
`emergency_contacts(id,patient_id,name,phone,relationship)`
`institutions(id,name,kind,is_demo)`
`emergencies(id,patient_id,central_id,hospital_id,summary_of_event,latitude,longitude,accuracy_meters,location_source,manual_address,status,is_simulation,version,created_at,closed_at)`
`emergency_status_events(id,emergency_id,old_status,new_status,actor_user_id,created_at)`
`access_grants(id,emergency_id,institution_id,scope,granted_by,created_at,expires_at,revoked_at)`
`audit_events(id,actor_id,institution_id,action,object_type,object_id,result,occurred_at,correlation_id)`
`privacy_requests(id,patient_id,request_type,status,created_at,completed_at)`
`idempotency_records(id,user_id,key_hash,request_hash,response_reference,created_at,expires_at)`

**OBS**: modelo inicial para revisão. Se criptografar campos na aplicação, implementar gerenciamento de chaves e rotação adequados; não improvisar criptografia. Em dev, permitir dados fictícios; produção exige desenho criptográfico revisado. Usar criptografia de armazenamento/backup e TLS além da proteção em campo, conforme modelo de ameaça. Pesquisas em texto clínico são fora do MVP.

## Fluxo de compartilhamento
1. Paciente autentica e cria ocorrência simulada.
2. A central fictícia vinculada obtém só os campos estritamente necessários para conduzir simulação.
3. Hospital fictício acessa apenas após operador autorizado atribuí-lo e criar concessão de acesso limitada à ocorrência.
4. Cada leitura de dados médicos por central/hospital é auditada (quem, quando, qual ocorrência, finalidade).
5. Encerrar ocorrência revoga acesso operacional após período explicitamente configurado; retenção histórica limitada por política e obrigações aplicáveis.

## Bases legais
Dados de saúde são **dados pessoais sensíveis**. O art. 11 da LGPD prevê hipóteses específicas (ex.: consentimento destacado, proteção da vida, tutela da saúde em contexto legalmente definido). **Não presumir** que qualquer desenvolvedor ou app comercial possa usar hipóteses de emergência/tutela da saúde indiscriminadamente. Controlador e assessoria jurídica devem determinar bases legais e papéis reais antes de produção.

## Direitos do titular
Interface para ler/corrigir e solicitar exportação/exclusão. Exclusão não deve apagar automaticamente logs legalmente necessários; política deve justificar retenção e acesso mínimo. Histórico pessoal exportável com autenticação reforçada.

## Padrão dev
- Gerar apenas pacientes, hospitais, telefones e dados clínicos fictícios identificados como demonstração.
- Não capturar logs de requisições/respostas sensíveis; sem analytics terceiro, pixel, mapas que vazem geolocalização sem revisão.
- Retenção do MVP local: dados de demonstração descartáveis via reset do compose; política real pendente.
- Backups cifrados e restauráveis só quando operação real autorizada.
