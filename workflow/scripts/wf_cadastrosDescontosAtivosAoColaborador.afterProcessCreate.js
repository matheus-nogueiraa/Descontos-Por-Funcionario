function afterProcessCreate(processId) {
  hAPI.setCardValue('solicitacao_fluig', processId);
}