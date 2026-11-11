export const statusNames: Record<string, string> = {
  REQUESTED: 'Solicitação recebida',
  ACKNOWLEDGED: 'Atendimento confirmado',
  RESOURCE_ASSIGNED: 'Preparando saída',
  EN_ROUTE: 'Ambulância em deslocamento',
  ON_SCENE: 'Equipe no local',
  CLOSED: 'Atendimento encerrado',
  CANCEL_REQUESTED: 'Cancelamento solicitado',
  CANCELLED: 'Atendimento cancelado',
}

export const statesFrom: Record<string, string[]> = {
  REQUESTED: ['ACKNOWLEDGED', 'CANCEL_REQUESTED'],
  ACKNOWLEDGED: ['RESOURCE_ASSIGNED', 'CANCEL_REQUESTED'],
  RESOURCE_ASSIGNED: ['EN_ROUTE', 'CANCEL_REQUESTED'],
  EN_ROUTE: ['ON_SCENE', 'CANCEL_REQUESTED'],
  ON_SCENE: ['CLOSED', 'CANCEL_REQUESTED'],
  CANCEL_REQUESTED: ['CANCELLED'],
}
